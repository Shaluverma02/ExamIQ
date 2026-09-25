const CodingProblem = require('../models/CodingProblem');
const TestCase = require('../models/TestCase');
const CodingSubmission = require('../models/CodingSubmission');
const CodingSession = require('../models/CodingSession');
const { runCode } = require('../services/codeRunnerService');

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

/**
 * Normalize output before comparison.
 *
 * Handles:
 * - Windows line endings
 * - Leading/trailing spaces
 * - Extra blank lines
 */
const normalizeOutput = (value) => {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
};

/**
 * Get numeric value safely.
 */
const positiveNumber = (value, fallback) => {
  const number = Number(value);

  return Number.isFinite(number) && number > 0
    ? number
    : fallback;
};

/**
 * Get current student's submission count.
 */
const getAttemptNumber = async (studentId, problemId) => {
  const count = await CodingSubmission.countDocuments({
    studentId,
    problemId,
  });

  return count + 1;
};

/**
 * Recalculate whether current submission is best.
 *
 * Best submission is decided primarily by score,
 * then accepted status,
 * then execution time.
 */
const updateBestSubmission = async (submission) => {
  const previousBest = await CodingSubmission.find({
    studentId: submission.studentId,
    problemId: submission.problemId,
    ...(submission.collegeId ? { collegeId: submission.collegeId } : {}),
    _id: { $ne: submission._id },
    isBest: true,
  }).sort({
    score: -1,
    executionTime: 1,
    createdAt: 1,
  });

  let shouldBeBest = true;

  if (previousBest.length > 0) {
    const oldBest = previousBest[0];

    if (oldBest.score > submission.score) {
      shouldBeBest = false;
    } else if (
      oldBest.score === submission.score &&
      oldBest.status === 'Accepted' &&
      submission.status !== 'Accepted'
    ) {
      shouldBeBest = false;
    } else if (
      oldBest.score === submission.score &&
      oldBest.status === submission.status &&
      oldBest.executionTime <= submission.executionTime
    ) {
      shouldBeBest = false;
    }
  }

  if (shouldBeBest) {
    await CodingSubmission.updateMany(
      {
        studentId: submission.studentId,
        problemId: submission.problemId,
        ...(submission.collegeId ? { collegeId: submission.collegeId } : {}),
        _id: { $ne: submission._id },
      },
      {
        $set: {
          isBest: false,
        },
      }
    );

    submission.isBest = true;
    await submission.save();
  }

  return submission;
};

/**
 * ============================================================
 * GET ALL CODING PROBLEMS
 * ============================================================
 *
 * GET /api/coding
 *
 * Student receives problem metadata only.
 * Hidden test cases are NEVER returned here.
 */
exports.getCodingProblems = async (req, res, next) => {
  try {
    const {
      category,
      topic,
      difficulty,
      search,
      tag,
      page = 1,
      limit = 20,
      sort = 'newest',
    } = req.query;

    const query = req.collegeId ? { collegeId: req.collegeId } : {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (topic && topic !== 'All') {
      query.topic = topic;
    }

    if (difficulty && difficulty !== 'All') {
      query.difficulty = String(
        difficulty
      ).toLowerCase();
    }

    if (tag) {
      query.tags = tag;
    }

    if (search && search.trim()) {
      const searchValue = search.trim();

      query.$or = [
        {
          title: {
            $regex: searchValue,
            $options: 'i',
          },
        },
        {
          description: {
            $regex: searchValue,
            $options: 'i',
          },
        },
        {
          tags: {
            $regex: searchValue,
            $options: 'i',
          },
        },
      ];
    }

    /**
     * Pagination
     */
    const currentPage = Math.max(
      Number(page) || 1,
      1
    );

    const perPage = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );

    const skip =
      (currentPage - 1) * perPage;

    /**
     * Sorting
     */
    let sortQuery = {
      createdAt: -1,
    };

    if (sort === 'oldest') {
      sortQuery = {
        createdAt: 1,
      };
    }

    if (sort === 'title') {
      sortQuery = {
        title: 1,
      };
    }

    if (sort === 'difficulty') {
      sortQuery = {
        difficulty: 1,
      };
    }

    const [problems, total] =
      await Promise.all([
        CodingProblem.find(query)
          .populate(
            'createdBy',
            'name email role'
          )
          .sort(sortQuery)
          .skip(skip)
          .limit(perPage)
          .lean(),

        CodingProblem.countDocuments(query),
      ]);

    /**
     * Student-specific status.
     *
     * This lets frontend show:
     *
     * âœ“ Solved
     * Attempted
     * Unsolved
     */
    let studentStatuses = {};

    if (
      req.user &&
      req.user.role === 'student' &&
      problems.length > 0
    ) {
      const problemIds =
        problems.map((problem) => problem._id);

      const submissions =
        await CodingSubmission.find({
          studentId: req.user._id,
          ...(req.collegeId ? { collegeId: req.collegeId } : {}),
          problemId: {
            $in: problemIds,
          },
        })
          .select(
            'problemId status score isBest'
          )
          .sort({
            createdAt: -1,
          })
          .lean();

      for (const submission of submissions) {
        const key =
          String(submission.problemId);

        if (!studentStatuses[key]) {
          studentStatuses[key] = {
            status:
              submission.status,
            score:
              submission.score || 0,
            solved:
              submission.status ===
              'Accepted',
          };
        }

        /**
         * Accepted always wins.
         */
        if (
          submission.status ===
          'Accepted'
        ) {
          studentStatuses[key] = {
            status: 'Accepted',
            score:
              submission.score || 0,
            solved: true,
          };
        }
      }
    }

    const formattedProblems =
      problems.map((problem) => {
        const status =
          studentStatuses[
          String(problem._id)
          ];

        return {
          ...problem,

          studentStatus:
            status?.status || 'Unsolved',

          studentScore:
            status?.score || 0,

          solved:
            Boolean(status?.solved),

          /**
           * Never send test cases from list API.
           */
          testCases: undefined,
        };
      });

    res.status(200).json({
      success: true,

      count:
        formattedProblems.length,

      total,

      page: currentPage,

      pages: Math.ceil(
        total / perPage
      ),

      problems: formattedProblems,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ============================================================
 * GET CODING PROBLEM BY ID
 * ============================================================
 *
 * GET /api/coding/:id
 *
 * Student:
 *   Public test cases only
 *
 * Faculty/Admin:
 *   All test cases
 */
exports.getCodingProblemById = async (
  req,
  res,
  next
) => {
  try {
    const problem =
      await CodingProblem.findOne({ _id: req.params.id, ...(req.collegeId ? { collegeId: req.collegeId } : {}) })
        .populate(
          'createdBy',
          'name email role'
        )
        .lean();

    if (!problem) {
      return res.status(404).json({
        success: false,
        message:
          'Coding problem not found',
      });
    }

    const isStaff =
      req.user &&
      ['admin', 'faculty'].includes(
        req.user.role
      );

    /**
     * Student gets public cases only.
     */
    const testCaseQuery = {
      $or: [
        { codingProblemId: problem._id },
        { problemId: problem._id },
      ],
    };

    if (!isStaff) {
      testCaseQuery.isHidden = false;
    }

    const testCases = await TestCase.find(testCaseQuery)
      .sort({
        createdAt: 1,
      })
      .lean();

    /**
     * IMPORTANT:
     *
     * For student we should ideally not send
     * expectedOutput of public tests either
     * if we want a strict HackerRank-style
     * system.
     *
     * But examples already contain expected
     * output, so public test cases are mainly
     * for Run/preview.
     */

    /**
     * Student submission statistics.
     */
    let submissionStats = {
      attempts: 0,
      accepted: false,
      bestScore: 0,
      bestSubmissionId: null,
      lastSubmissionId: null,
    };

    if (
      req.user &&
      req.user.role === 'student'
    ) {
      const submissions =
        await CodingSubmission.find({
          studentId: req.user._id,
          ...(req.collegeId ? { collegeId: req.collegeId } : {}),
          problemId: problem._id,
        })
          .select(
            '_id status score isBest submittedAt'
          )
          .sort({
            submittedAt: -1,
          })
          .lean();

      submissionStats.attempts =
        submissions.length;

      submissionStats.accepted =
        submissions.some(
          (submission) =>
            submission.status ===
            'Accepted'
        );

      if (submissions.length > 0) {
        submissionStats.lastSubmissionId =
          submissions[0]._id;
      }

      const best =
        submissions.reduce(
          (bestSubmission, current) => {
            if (!bestSubmission) {
              return current;
            }

            return current.score >
              bestSubmission.score
              ? current
              : bestSubmission;
          },
          null
        );

      if (best) {
        submissionStats.bestScore =
          best.score || 0;

        submissionStats.bestSubmissionId =
          best._id;
      }
    }

    res.status(200).json({
      success: true,

      problem,

      testCases,

      submissionStats,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ============================================================
 * CREATE CODING PROBLEM
 * ============================================================
 *
 * POST /api/coding
 *
 * Faculty/Admin
 */
exports.createCodingProblem = async (
  req,
  res,
  next
) => {
  try {
    const {
      testCases,
      examples,
      starterCode,
      tags,
      allowedLanguages,
      ...problemData
    } = req.body;

    /**
     * Never trust createdBy from frontend.
     */
    problemData.createdBy =
      req.user._id;
    problemData.collegeId = req.collegeId || undefined;

    /**
     * Normalize tags.
     */
    if (Array.isArray(tags)) {
      problemData.tags = tags
        .map((tag) =>
          String(tag).trim()
        )
        .filter(Boolean);
    }

    /**
     * Normalize languages.
     */
    if (Array.isArray(
      allowedLanguages
    )) {
      problemData.allowedLanguages =
        allowedLanguages;
    }

    /**
     * Examples.
     */
    if (Array.isArray(examples)) {
      problemData.examples =
        examples
          .filter(
            (example) =>
              example &&
              example.input !==
              undefined &&
              example.output !==
              undefined
          )
          .map((example) => ({
            input: String(
              example.input ?? ''
            ),
            output: String(
              example.output ?? ''
            ),
            explanation: String(
              example.explanation ?? ''
            ),
          }));
    }

    /**
     * Starter code.
     */
    if (Array.isArray(starterCode)) {
      problemData.starterCode =
        starterCode;
    }

    /**
     * Numeric values.
     */
    problemData.marks =
      positiveNumber(
        problemData.marks,
        10
      );

    problemData.timeLimit =
      positiveNumber(
        problemData.timeLimit,
        2
      );

    problemData.memoryLimit =
      positiveNumber(
        problemData.memoryLimit,
        128
      );

    const problem =
      await CodingProblem.create(
        problemData
      );

    /**
     * Create test cases.
     */
    if (
      Array.isArray(testCases) &&
      testCases.length > 0
    ) {
      const formattedCases =
        testCases
          .filter(
            (tc) =>
              tc &&
              tc.input !==
              undefined &&
              tc.expectedOutput !==
              undefined
          )
          .map((tc) => ({
            codingProblemId:
              problem._id,

            input: String(
              tc.input ?? ''
            ),

            expectedOutput:
              String(
                tc.expectedOutput ?? ''
              ),

            isHidden:
              tc.isHidden !==
                undefined
                ? Boolean(
                  tc.isHidden
                )
                : true,

            weight:
              Number(tc.weight) > 0
                ? Number(tc.weight)
                : 1,
          }));

      if (
        formattedCases.length > 0
      ) {
        await TestCase.insertMany(
          formattedCases
        );
      }
    }

    res.status(201).json({
      success: true,

      message:
        'Coding problem created successfully',

      problem,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ============================================================
 * UPDATE CODING PROBLEM
 * ============================================================
 *
 * PUT /api/coding/:id
 */
exports.updateCodingProblem = async (
  req,
  res,
  next
) => {
  try {
    const {
      testCases,
      examples,
      starterCode,
      tags,
      allowedLanguages,
      ...problemData
    } = req.body;

    let problem =
      await CodingProblem.findOne({ _id: req.params.id, ...(req.collegeId ? { collegeId: req.collegeId } : {}) });

    if (!problem) {
      return res.status(404).json({
        success: false,
        message:
          'Coding problem not found',
      });
    }

    /**
     * Tags.
     */
    if (Array.isArray(tags)) {
      problemData.tags = tags
        .map((tag) =>
          String(tag).trim()
        )
        .filter(Boolean);
    }

    /**
     * Languages.
     */
    if (Array.isArray(
      allowedLanguages
    )) {
      problemData.allowedLanguages =
        allowedLanguages;
    }

    /**
     * Examples.
     */
    if (Array.isArray(examples)) {
      problemData.examples =
        examples
          .filter(
            (example) =>
              example &&
              example.input !==
              undefined &&
              example.output !==
              undefined
          )
          .map((example) => ({
            input: String(
              example.input ?? ''
            ),
            output: String(
              example.output ?? ''
            ),
            explanation: String(
              example.explanation ?? ''
            ),
          }));
    }

    /**
     * Starter code.
     */
    if (Array.isArray(starterCode)) {
      problemData.starterCode =
        starterCode;
    }

    /**
     * Numeric values.
     */
    if (
      problemData.marks !==
      undefined
    ) {
      problemData.marks =
        positiveNumber(
          problemData.marks,
          10
        );
    }

    if (
      problemData.timeLimit !==
      undefined
    ) {
      problemData.timeLimit =
        positiveNumber(
          problemData.timeLimit,
          2
        );
    }

    if (
      problemData.memoryLimit !==
      undefined
    ) {
      problemData.memoryLimit =
        positiveNumber(
          problemData.memoryLimit,
          128
        );
    }

    problem =
      await CodingProblem.findOneAndUpdate(
        { _id: req.params.id, ...(req.collegeId ? { collegeId: req.collegeId } : {}) },
        problemData,
        {
          new: true,
          runValidators: true,
        }
      );

    /**
     * Replace test cases only when supplied.
     */
    if (Array.isArray(testCases)) {
      await TestCase.deleteMany({
        codingProblemId:
          problem._id,
      });

      const formattedCases =
        testCases
          .filter(
            (tc) =>
              tc &&
              tc.input !==
              undefined &&
              tc.expectedOutput !==
              undefined
          )
          .map((tc) => ({
            codingProblemId:
              problem._id,

            input: String(
              tc.input ?? ''
            ),

            expectedOutput:
              String(
                tc.expectedOutput ?? ''
              ),

            isHidden:
              tc.isHidden !==
                undefined
                ? Boolean(
                  tc.isHidden
                )
                : true,

            weight:
              Number(tc.weight) > 0
                ? Number(tc.weight)
                : 1,
          }));

      if (
        formattedCases.length > 0
      ) {
        await TestCase.insertMany(
          formattedCases
        );
      }
    }

    res.status(200).json({
      success: true,

      message:
        'Coding problem updated successfully',

      problem,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ============================================================
 * DELETE CODING PROBLEM
 * ============================================================
 *
 * DELETE /api/coding/:id
 */
exports.deleteCodingProblem = async (
  req,
  res,
  next
) => {
  try {
    const problem =
      await CodingProblem.findOne({ _id: req.params.id, ...(req.collegeId ? { collegeId: req.collegeId } : {}) });

    if (!problem) {
      return res.status(404).json({
        success: false,
        message:
          'Coding problem not found',
      });
    }

    /**
     * Delete test cases.
     */
    await TestCase.deleteMany({
      codingProblemId:
        problem._id,
    });

    /**
     * Delete submissions.
     */
    await CodingSubmission.deleteMany({
      problemId:
        problem._id,
    });

    await problem.deleteOne();

    res.status(200).json({
      success: true,

      message:
        'Coding problem deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ============================================================
 * RUN TRIAL CODE
 * ============================================================
 *
 * POST /api/coding/run
 *
 * Used by Run Code button.
 *
 * This DOES NOT create a submission.
 */
exports.runTrialCode = async (
  req,
  res,
  next
) => {
  try {
    const {
      language,
      sourceCode,
      input = '',
      timeLimit,
      memoryLimit,
    } = req.body;

    if (
      !language ||
      !sourceCode ||
      !String(sourceCode).trim()
    ) {
      return res.status(400).json({
        success: false,

        message:
          'Language and source code are required',
      });
    }

    const result =
      await runCode({
        language,

        sourceCode,

        input: String(input ?? ''),

        timeLimit: timeLimit && Number(timeLimit) > 100 ? Number(timeLimit) : positiveNumber(timeLimit, 3) * 1000,

        memoryLimit:
          positiveNumber(
            memoryLimit,
            128
          ),
      });

    /**
     * Never expose internal runner details.
     */
    res.status(200).json({
      success: true,

      result: {
        status:
          result.status ||
          'Internal Judge Error',

        output:
          result.output || '',

        errorMessage:
          result.errorMessage || result.error || '',

        error:
          result.errorMessage || result.error || '',

        executionTime:
          Number(
            result.executionTime
          ) || 0,

        memoryUsed:
          Number(
            result.memoryUsed
          ) || 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ============================================================
 * SUBMIT CODE
 * ============================================================
 *
 * POST /api/coding/submit
 *
 * Student only.
 */
exports.submitCode = async (
  req,
  res,
  next
) => {
  try {
    const {
      problemId,
      examId,
      language,
      sourceCode,
    } = req.body;

    /**
     * Basic validation.
     */
    if (
      !problemId ||
      !language ||
      !sourceCode ||
      !String(sourceCode).trim()
    ) {
      return res.status(400).json({
        success: false,

        message:
          'Problem ID, language and source code are required',
      });
    }

    /**
     * Student only.
     */
    if (
      !req.user ||
      req.user.role !==
      'student'
    ) {
      return res.status(403).json({
        success: false,

        message:
          'Only students can submit coding solutions',
      });
    }

    /**
     * Get problem.
     */
    const problem =
      await CodingProblem.findOne({ _id: problemId, ...(req.collegeId ? { collegeId: req.collegeId } : {}) });

    if (!problem) {
      return res.status(404).json({
        success: false,

        message:
          'Coding problem not found',
      });
    }

    /**
     * Validate language.
     */
    if (
      Array.isArray(
        problem.allowedLanguages
      ) &&
      problem.allowedLanguages
        .length > 0 &&
      !problem.allowedLanguages.includes(
        language
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          `Language ${language} is not allowed for this problem`,
      });
    }

    /**
     * Get all test cases.
     * Hidden cases stay server-side.
     */
    const testCases = await TestCase.find({
      $or: [
        { codingProblemId: problemId },
        { problemId: problemId },
      ],
    }).sort({ createdAt: 1 });

    let finalTestCases = testCases;
    if (!finalTestCases || finalTestCases.length === 0) {
      if (Array.isArray(problem.testCases) && problem.testCases.length > 0) {
        finalTestCases = problem.testCases.map((tc, idx) => ({
          _id: tc._id || `${problem._id}_tc_${idx}`,
          input: tc.input || '',
          expectedOutput: tc.expectedOutput || tc.output || '',
          isHidden: Boolean(tc.isHidden),
          weight: tc.points || tc.weight || 1,
        }));
      } else if (Array.isArray(problem.examples) && problem.examples.length > 0) {
        finalTestCases = problem.examples.map((ex, idx) => ({
          _id: ex._id || `${problem._id}_ex_${idx}`,
          input: ex.input || '',
          expectedOutput: ex.expectedOutput || ex.output || '',
          isHidden: false,
          weight: 1,
        }));
      }
    }

    /**
     * Attempt number.
     */
    const attemptNumber =
      await getAttemptNumber(
        req.user._id,
        problemId
      );

    /**
     * Evaluation counters.
     */
    let passedCount = 0;

    let totalScore = 0;

    let totalExecutionTime = 0;

    let maxMemoryUsed = 0;

    let overallStatus =
      'Accepted';

    let errorMessage = '';

    const testResults = [];

    /**
     * ========================================================
     * EXECUTE TEST CASES
     * ========================================================
     */
    for (
      let index = 0;
      index < finalTestCases.length;
      index++
    ) {
      const tc =
        finalTestCases[index];

      let execRes;

      try {
        execRes =
          await runCode({
            language,

            sourceCode,

            input:
              tc.input,

            timeLimit:
              positiveNumber(
                problem.timeLimit,
                2
              ) * 1000,

            memoryLimit:
              positiveNumber(
                problem.memoryLimit,
                128
              ),
          });
      } catch (runnerError) {
        execRes = {
          status:
            'Internal Judge Error',

          output: '',

          error:
            runnerError.message ||
            'Code execution failed',

          executionTime: 0,

          memoryUsed: 0,
        };
      }

      const executionTime =
        Number(
          execRes.executionTime
        ) || 0;

      const memoryUsed =
        Number(
          execRes.memoryUsed
        ) || 0;

      totalExecutionTime +=
        executionTime;

      maxMemoryUsed =
        Math.max(
          maxMemoryUsed,
          memoryUsed
        );

      const actualOutput =
        normalizeOutput(
          execRes.output
        );

      const expectedOutput =
        normalizeOutput(
          tc.expectedOutput
        );

      const runnerStatus =
        execRes.status ||
        'Internal Judge Error';

      const isPassed =
        runnerStatus ===
        'Accepted' &&
        actualOutput ===
        expectedOutput;

      let testStatus =
        'Wrong Answer';

      /**
       * Accepted.
       */
      if (isPassed) {
        testStatus =
          'Accepted';

        passedCount++;

        totalScore +=
          Number(tc.weight) >
            0
            ? Number(tc.weight)
            : 1;
      }

      /**
       * Runner error.
       */
      else if (
        runnerStatus !==
        'Accepted'
      ) {
        testStatus =
          runnerStatus;

        /**
         * First error determines
         * submission status.
         */
        if (
          overallStatus ===
          'Accepted'
        ) {
          overallStatus =
            testStatus;
        }

        if (
          !errorMessage &&
          execRes.error
        ) {
          errorMessage =
            String(
              execRes.error
            );
        }
      }

      /**
       * Wrong answer.
       */
      else {
        testStatus =
          'Wrong Answer';

        if (
          overallStatus ===
          'Accepted'
        ) {
          overallStatus =
            'Wrong Answer';
        }
      }

      /**
       * ======================================================
       * STUDENT RESPONSE
       * ======================================================
       *
       * PUBLIC:
       *   input/output visible
       *
       * HIDDEN:
       *   no input/output
       */
      testResults.push({
        testCaseId:
          tc._id,

        input:
          tc.isHidden
            ? 'Hidden'
            : tc.input,

        expectedOutput:
          tc.isHidden
            ? 'Hidden'
            : tc.expectedOutput,

        actualOutput:
          tc.isHidden
            ? isPassed
              ? 'Passed'
              : 'Output Mismatch'
            : execRes.output ||
            '',

        status:
          testStatus,

        executionTime,

        isHidden:
          Boolean(
            tc.isHidden
          ),
      });

      /**
       * ======================================================
       * STOP CONDITIONS
       * ======================================================
       *
       * Compilation error:
       * impossible to continue.
       *
       * Security error:
       * stop immediately.
       *
       * Internal judge error:
       * stop.
       *
       * Runtime/TLE:
       * stop for this submission.
       */
      const fatalStatuses = [
        'Compilation Error',
        'Runtime Security Error',
        'Internal Judge Error',
        'Time Limit Exceeded',
        'Memory Limit Exceeded',
        'Runtime Error',
      ];

      if (
        fatalStatuses.includes(
          testStatus
        )
      ) {
        break;
      }
    }

    /**
     * ========================================================
     * SCORE
     * ========================================================
     */
    const totalWeight =
      testCases.reduce(
        (sum, tc) =>
          sum +
          (Number(tc.weight) >
            0
            ? Number(tc.weight)
            : 1),
        0
      );

    const marks =
      positiveNumber(
        problem.marks,
        10
      );

    const earnedScore =
      totalWeight > 0
        ? Math.round(
          (totalScore /
            totalWeight) *
          marks
        )
        : 0;

    /**
     * Passed percentage.
     */
    const passedPercentage =
      testCases.length > 0
        ? Math.round(
          (passedCount /
            testCases.length) *
          100
        )
        : 0;

    /**
     * All test cases passed.
     */
    if (
      passedCount ===
      testCases.length &&
      testResults.length ===
      testCases.length
    ) {
      overallStatus =
        'Accepted';
    }

    /**
     * Average execution time.
     */
    const averageExecutionTime =
      testResults.length > 0
        ? Math.round(
          totalExecutionTime /
          testResults.length
        )
        : 0;

    /**
     * ========================================================
     * CREATE SUBMISSION
     * ========================================================
     */
    let submission =
      await CodingSubmission.create({
        studentId:
          req.user._id,

        collegeId:
          req.collegeId || problem.collegeId || undefined,

        examId:
          examId || null,

        problemId,

        language,

        sourceCode,

        status:
          overallStatus,

        score:
          earnedScore,

        passedTestCases:
          passedCount,

        totalTestCases:
          testCases.length,

        executionTime:
          averageExecutionTime,

        memoryUsed:
          maxMemoryUsed,

        errorMessage,

        testResults,

        attemptNumber,

        passedPercentage,

        isBest: false,

        submittedAt:
          new Date(),
      });

    /**
     * Determine best submission.
     */
    submission =
      await updateBestSubmission(
        submission
      );

    /**
     * ========================================================
     * PROBLEM STATISTICS
     * ========================================================
     */
    const [
      totalSubmissions,
      acceptedSubmissions,
    ] = await Promise.all([
      CodingSubmission.countDocuments({
        problemId,
        ...(req.collegeId ? { collegeId: req.collegeId } : {}),
      }),

      CodingSubmission.countDocuments({
        problemId,
        ...(req.collegeId ? { collegeId: req.collegeId } : {}),

        status:
          'Accepted',
      }),
    ]);

    const acceptanceRate =
      totalSubmissions > 0
        ? Math.round(
          (acceptedSubmissions /
            totalSubmissions) *
          100
        )
        : 0;

    /**
     * Update problem statistics
     * if fields exist in model.
     */
    await CodingProblem.findOneAndUpdate(
      { _id: problemId, ...(req.collegeId ? { collegeId: req.collegeId } : {}) },
      {
        totalSubmissions,

        totalAccepted:
          acceptedSubmissions,

        acceptanceRate,
      },
      {
        runValidators: false,
      }
    );

    /**
     * ========================================================
     * RESPONSE
     * ========================================================
     *
     * Never send source code back unnecessarily.
     */
    res.status(200).json({
      success: true,

      message:
        overallStatus ===
          'Accepted'
          ? 'Solution accepted'
          : 'Solution submitted',

      submission: {
        _id:
          submission._id,

        problemId:
          submission.problemId,

        language:
          submission.language,

        status:
          submission.status,

        score:
          submission.score,

        passedTestCases:
          submission.passedTestCases,

        totalTestCases:
          submission.totalTestCases,

        passedPercentage,

        executionTime:
          submission.executionTime,

        memoryUsed:
          submission.memoryUsed,

        errorMessage:
          submission.errorMessage,

        attemptNumber:
          submission.attemptNumber,

        isBest:
          submission.isBest,

        testResults:
          submission.testResults,

        submittedAt:
          submission.submittedAt,
      },

      problemStats: {
        totalSubmissions,

        acceptedSubmissions,

        acceptanceRate,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ============================================================
 * GET MY SUBMISSIONS
 * ============================================================
 *
 * GET /api/coding/:problemId/submissions
 *
 * Student submission history.
 */
exports.getMySubmissions = async (
  req,
  res,
  next
) => {
  try {
    if (
      !req.user ||
      req.user.role !==
      'student'
    ) {
      return res.status(403).json({
        success: false,

        message:
          'Only students can access submission history',
      });
    }

    const {
      page = 1,
      limit = 20,
    } = req.query;

    const currentPage =
      Math.max(
        Number(page) || 1,
        1
      );

    const perPage =
      Math.min(
        Math.max(
          Number(limit) || 20,
          1
        ),
        100
      );

    const skip =
      (currentPage - 1) *
      perPage;

    const query = {
      studentId:
        req.user._id,
      ...(req.collegeId ? { collegeId: req.collegeId } : {}),
      problemId:
        req.params.problemId,
    };

    const [
      submissions,
      total,
    ] = await Promise.all([
      CodingSubmission.find(query)
        .select(
          [
            '_id',
            'problemId',
            'language',
            'status',
            'score',
            'passedTestCases',
            'totalTestCases',
            'passedPercentage',
            'executionTime',
            'memoryUsed',
            'errorMessage',
            'attemptNumber',
            'isBest',
            'submittedAt',
          ].join(' ')
        )
        .sort({
          submittedAt: -1,
        })
        .skip(skip)
        .limit(perPage)
        .lean(),

      CodingSubmission.countDocuments(
        query
      ),
    ]);

    res.status(200).json({
      success: true,

      submissions,

      total,

      page:
        currentPage,

      pages:
        Math.ceil(
          total / perPage
        ),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ============================================================
 * GET MY SUBMISSION DETAIL
 * ============================================================
 *
 * GET /api/coding/submission/:submissionId
 */
exports.getMySubmissionById =
  async (
    req,
    res,
    next
  ) => {
    try {
      if (
        !req.user ||
        req.user.role !==
        'student'
      ) {
        return res
          .status(403)
          .json({
            success: false,

            message:
              'Only students can access submissions',
          });
      }

      const submission =
        await CodingSubmission.findOne(
          {
            _id:
              req.params
                .submissionId,

            studentId:
              req.user._id,
            ...(req.collegeId ? { collegeId: req.collegeId } : {}),
          }
        )
          .populate(
            'problemId',
            'title difficulty marks'
          )
          .lean();

      if (!submission) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              'Submission not found',
          });
      }

      res.status(200).json({
        success: true,

        submission,
      });
    } catch (err) {
      next(err);
    }
  };

/**
 * ============================================================
 * GET BEST SUBMISSION
 * ============================================================
 *
 * GET /api/coding/:problemId/best
 */
exports.getMyBestSubmission =
  async (
    req,
    res,
    next
  ) => {
    try {
      if (
        !req.user ||
        req.user.role !==
        'student'
      ) {
        return res
          .status(403)
          .json({
            success: false,

            message:
              'Only students can access best submission',
          });
      }

      const submission =
        await CodingSubmission.findOne(
          {
            studentId:
              req.user._id,
            ...(req.collegeId ? { collegeId: req.collegeId } : {}),

            problemId:
              req.params
                .problemId,
          }
        )
          .sort({
            score: -1,

            isBest: -1,

            executionTime: 1,

            submittedAt: 1,
          })
          .select(
            [
              '_id',
              'problemId',
              'language',
              'status',
              'score',
              'passedTestCases',
              'totalTestCases',
              'passedPercentage',
              'executionTime',
              'memoryUsed',
              'attemptNumber',
              'isBest',
              'submittedAt',
            ].join(' ')
          )
          .lean();

      if (!submission) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              'No submission found',
          });
      }

      res.status(200).json({
        success: true,

        submission,
      });
    } catch (err) {
      next(err);
    }
  };

/**
 * ============================================================
 * GET MY SUBMISSION SOURCE CODE
 * ============================================================
 *
 * GET /api/coding/submission/:submissionId/code
 *
 * Allows student to reopen previous code.
 */
exports.getMySubmissionCode =
  async (
    req,
    res,
    next
  ) => {
    try {
      if (
        !req.user ||
        req.user.role !==
        'student'
      ) {
        return res
          .status(403)
          .json({
            success: false,

            message:
              'Only students can access submission code',
          });
      }

      const submission =
        await CodingSubmission.findOne(
          {
            _id:
              req.params
                .submissionId,

            studentId:
              req.user._id,
            ...(req.collegeId ? { collegeId: req.collegeId } : {}),
          }
        )
          .select(
            '_id problemId language sourceCode status submittedAt'
          )
          .lean();

      if (!submission) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              'Submission not found',
          });
      }

      res.status(200).json({
        success: true,

        submission,
      });
    } catch (err) {
      next(err);
    }
  };

/**
 * ============================================================
 * RUN TRIAL CODE
 * ============================================================
 */
exports.runTrialCode = async (req, res, next) => {
  try {
    const { language, sourceCode, input, timeLimit, memoryLimit } = req.body;

    if (!language || !sourceCode) {
      return res.status(400).json({
        success: false,
        message: 'Language and source code are required',
      });
    }

    const result = await runCode({
      language,
      sourceCode,
      input: input || '',
      timeLimit: timeLimit ? Number(timeLimit) * 1000 : 3000,
      memoryLimit: memoryLimit ? Number(memoryLimit) : 128,
    });

    res.status(200).json({
      success: true,
      result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ============================================================
 * SUBMIT CODE
 * ============================================================
 */
exports.submitCode = async (req, res, next) => {
  try {
    const { problemId, language, sourceCode } = req.body;
    
    if (!problemId || !language || !sourceCode) {
      return res.status(400).json({
        success: false,
        message: 'Problem ID, language, and source code are required',
      });
    }

    const problem = await CodingProblem.findOne({ _id: problemId, ...(req.collegeId ? { collegeId: req.collegeId } : {}) });
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found',
      });
    }

    const testCases = await TestCase.find({ $or: [{ problemId }, { codingProblemId: problemId }] }).lean();
    if (!testCases || testCases.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No test cases found for this problem',
      });
    }

    let passedCount = 0;
    let totalScore = 0;
    let maxTime = 0;
    let maxMemory = 0;
    let finalStatus = 'Accepted';
    
    const results = [];

    for (const testCase of testCases) {
      const execResult = await runCode({
        language,
        sourceCode,
        input: testCase.input,
        timeLimit: problem.timeLimit ? Number(problem.timeLimit) * 1000 : 3000,
        memoryLimit: problem.memoryLimit ? Number(problem.memoryLimit) : 128,
      });

      const actualOutput = normalizeOutput(execResult.output);
      const expectedOutput = normalizeOutput(testCase.expectedOutput);
      
      const isPassed = execResult.status === 'Accepted' && actualOutput === expectedOutput;
      
      let tcStatus = execResult.status;
      if (execResult.status === 'Accepted' && !isPassed) {
        tcStatus = 'Wrong Answer';
      }

      if (isPassed) {
        passedCount++;
        totalScore += testCase.score || 0;
      } else if (finalStatus === 'Accepted') {
        finalStatus = tcStatus;
      }

      if (execResult.executionTime > maxTime) maxTime = execResult.executionTime;

      results.push({
        testCaseId: testCase._id,
        status: tcStatus,
        executionTime: execResult.executionTime || 0,
        memoryUsed: 0,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: execResult.output,
        errorMessage: execResult.errorMessage,
        passed: isPassed
      });
      
      // Optionally stop early on compilation or runtime error
      if (!isPassed && finalStatus !== 'Wrong Answer') {
          break;
      }
    }

    const passedPercentage = (passedCount / testCases.length) * 100;
    const attemptNumber = req.user ? await getAttemptNumber(req.user._id, problemId) : 1;

    let submission = new CodingSubmission({
      studentId: req.user ? req.user._id : null,
      collegeId: req.collegeId || problem.collegeId || undefined,
      problemId,
      language,
      sourceCode,
      status: finalStatus,
      score: totalScore,
      passedTestCases: passedCount,
      totalTestCases: testCases.length,
      passedPercentage,
      executionTime: maxTime,
      memoryUsed: maxMemory,
      testCaseResults: results,
      attemptNumber,
      isBest: false
    });

    if (req.user) {
        submission = await updateBestSubmission(submission);
    } else {
        await submission.save();
    }

    res.status(200).json({
      success: true,
      submission,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ============================================================
 * START ASSESSMENT SESSION
 * ============================================================
 */
exports.startAssessmentSession = async (req, res, next) => {
  try {
    const { problemId, examId } = req.body;

    if (!problemId) {
      return res.status(400).json({
        success: false,
        message: 'Problem ID is required to start assessment',
      });
    }

    // Find if there's already an active session for this problem/student
    let session = await CodingSession.findOne({
      studentId: req.user._id,
      problemId,
      ...(req.collegeId ? { collegeId: req.collegeId } : {}),
      status: 'active',
    });

    if (!session) {
      session = new CodingSession({
        studentId: req.user._id,
        collegeId: req.collegeId || undefined,
        problemId,
        examId: examId || null,
        warningCount: 0,
        status: 'active',
      });
      await session.save();
    }

    res.status(200).json({
      success: true,
      session,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ============================================================
 * RECORD VIOLATION
 * ============================================================
 */
exports.recordViolation = async (req, res, next) => {
  try {
    const { problemId, message } = req.body;

    if (!problemId) {
      return res.status(400).json({
        success: false,
        message: 'Problem ID is required',
      });
    }

    const session = await CodingSession.findOne({
      studentId: req.user._id,
      problemId,
      ...(req.collegeId ? { collegeId: req.collegeId } : {}),
      status: 'active',
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No active assessment session found',
      });
    }

    session.warningCount += 1;
    session.warnings.push({ message: message || 'Proctoring violation detected' });

    if (session.warningCount >= 4) {
      session.status = 'terminated';
    }

    await session.save();

    res.status(200).json({
      success: true,
      warningCount: session.warningCount,
      status: session.status,
    });
  } catch (err) {
    next(err);
  }
};
