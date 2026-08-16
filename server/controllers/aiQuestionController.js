const Question = require('../models/Question');
const CodingProblem = require('../models/CodingProblem');

// @desc    Generate MCQs or Coding Problems using AI templates
// @route   POST /api/ai/generate-questions
// @access  Private (Faculty, Admin)
exports.generateAIQuestions = async (req, res, next) => {
  try {
    const { topic = 'General Programming', type = 'mcq', difficulty = 'medium', count = 3 } = req.body;

    const numCount = Math.min(Math.max(parseInt(count) || 3, 1), 10);
    const generatedItems = [];

    if (type === 'mcq') {
      const templates = [
        {
          questionText: `What is the main advantage of using efficient data structures in ${topic}?`,
          options: [
            { optionText: 'Optimizes time and space complexity ($O(N)$ / $O(1)$)', isCorrect: true },
            { optionText: 'Increases memory footprint unnecessarily', isCorrect: false },
            { optionText: 'Prevents compiler optimizations', isCorrect: false },
            { optionText: 'Forces synchronous CPU execution', isCorrect: false },
          ],
          explanation: `Efficient data structures optimize algorithmic execution bounds and reduce memory overhead in ${topic}.`,
          marks: difficulty === 'hard' ? 5 : difficulty === 'medium' ? 3 : 2,
        },
        {
          questionText: `Which of the following best describes the core principle of ${topic}?`,
          options: [
            { optionText: 'Modular design and clean separation of concerns', isCorrect: true },
            { optionText: 'Tight coupling of business logic and UI', isCorrect: false },
            { optionText: 'Avoiding error handling and input validation', isCorrect: false },
            { optionText: 'Hardcoding static configuration parameters', isCorrect: false },
          ],
          explanation: `${topic} emphasizes modularity, reusability, and scalable architectural patterns.`,
          marks: difficulty === 'hard' ? 5 : difficulty === 'medium' ? 3 : 2,
        },
        {
          questionText: `In ${topic}, what is the worst-case time complexity of standard search algorithms?`,
          options: [
            { optionText: '$O(N)$ for linear search, $O(\\log N)$ for binary search', isCorrect: true },
            { optionText: '$O(N^3)$ for all search algorithms', isCorrect: false },
            { optionText: '$O(1)$ constant time unconditionally', isCorrect: false },
            { optionText: '$O(2^N)$ exponential time always', isCorrect: false },
          ],
          explanation: 'Linear search scans element by element ($O(N)$), whereas binary search divides input space ($O(\\log N)$).',
          marks: difficulty === 'hard' ? 5 : difficulty === 'medium' ? 3 : 2,
        },
        {
          questionText: `How does memory management operate in modern ${topic} environments?`,
          options: [
            { optionText: 'Automatic garbage collection and heap allocation management', isCorrect: true },
            { optionText: 'Manual bitwise memory leaks by default', isCorrect: false },
            { optionText: 'Stack overflow prevention by disabling recursion', isCorrect: false },
            { optionText: 'Direct hardware pointer corruption', isCorrect: false },
          ],
          explanation: 'Modern runtime engines automatically manage garbage collection and dynamic heap memory.',
          marks: difficulty === 'hard' ? 5 : difficulty === 'medium' ? 3 : 2,
        },
      ];

      for (let i = 0; i < numCount; i++) {
        const item = templates[i % templates.length];
        generatedItems.push({
          ...item,
          category: topic,
          difficulty,
          questionType: 'single',
        });
      }
    } else {
      const codingTemplates = [
        {
          title: `${topic} — Maximum Subarray Sum`,
          description: `Given an array of integers \`nums\`, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum. Solve using Kadane's Algorithm in $O(N)$ time complexity.`,
          inputFormat: 'Line 1: Space-separated integers representing nums.',
          outputFormat: 'Single integer representing the maximum subarray sum.',
          constraints: '$-10^4 \\le nums[i] \\le 10^4$, $1 \\le N \\le 10^5$',
          difficulty,
          category: topic,
          marks: difficulty === 'hard' ? 30 : difficulty === 'medium' ? 20 : 10,
          timeLimit: 2,
          memoryLimit: 128,
          examples: [
            { input: '-2 1 -3 4 -1 2 1 -5 4', output: '6', explanation: 'Subarray [4, -1, 2, 1] has maximum sum = 6.' },
            { input: '1', output: '1', explanation: 'Single element subarray.' },
          ],
          hiddenTestCases: [
            { input: '-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6', isHidden: true, points: 10 },
            { input: '5 4 -1 7 8', expectedOutput: '23', isHidden: true, points: 10 },
          ],
          starterCode: [
            { language: 'python', code: 'def solve(nums):\n    # Write solution\n    pass' },
            { language: 'javascript', code: 'function solve(nums) {\n  // Write solution\n}' },
          ],
        },
        {
          title: `${topic} — Valid Anagram String Check`,
          description: `Given two strings \`s\` and \`t\`, return \`true\` if \`t\` is an anagram of \`s\`, and \`false\` otherwise. An anagram is formed by rearranging the letters of a word using all original letters exactly once.`,
          inputFormat: 'Line 1: String s. Line 2: String t.',
          outputFormat: 'Output "true" or "false".',
          constraints: '$1 \\le |s|, |t| \\le 5 \\times 10^4$',
          difficulty,
          category: topic,
          marks: difficulty === 'hard' ? 25 : difficulty === 'medium' ? 15 : 10,
          timeLimit: 2,
          memoryLimit: 128,
          examples: [
            { input: 'anagram\nagaram', output: 'true', explanation: 'Both strings contain identical character counts.' },
            { input: 'rat\ncar', output: 'false', explanation: 'Character distributions do not match.' },
          ],
          hiddenTestCases: [
            { input: 'anagram\nagaram', expectedOutput: 'true', isHidden: true, points: 10 },
            { input: 'rat\ncar', expectedOutput: 'false', isHidden: true, points: 10 },
          ],
          starterCode: [
            { language: 'python', code: 'def isAnagram(s, t):\n    # Write solution\n    pass' },
            { language: 'javascript', code: 'function isAnagram(s, t) {\n  // Write solution\n}' },
          ],
        },
      ];

      for (let i = 0; i < numCount; i++) {
        const item = codingTemplates[i % codingTemplates.length];
        generatedItems.push(item);
      }
    }

    res.status(200).json({
      success: true,
      count: generatedItems.length,
      topic,
      type,
      difficulty,
      items: generatedItems,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Save AI Generated Questions directly into database
// @route   POST /api/ai/save-generated-questions
// @access  Private (Faculty, Admin)
exports.saveAIGeneratedQuestions = async (req, res, next) => {
  try {
    const { questions = [], codingProblems = [] } = req.body;
    const savedQuestions = [];
    const savedCoding = [];

    if (questions.length > 0) {
      for (const q of questions) {
        q.createdBy = req.user._id;
        const created = await Question.create(q);
        savedQuestions.push(created);
      }
    }

    if (codingProblems.length > 0) {
      for (const cp of codingProblems) {
        cp.createdBy = req.user._id;
        const created = await CodingProblem.create(cp);
        savedCoding.push(created);
      }
    }

    res.status(201).json({
      success: true,
      message: `Saved ${savedQuestions.length} MCQs and ${savedCoding.length} Coding Problems to database`,
      questions: savedQuestions,
      codingProblems: savedCoding,
    });
  } catch (err) {
    next(err);
  }
};
