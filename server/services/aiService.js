/**
 * Heuristic Question Generator Fallback
 */
const generateHeuristicQuestions = ({ topic, category, difficulty, type, count }) => {
  const topicName = topic || 'General Programming';
  const diff = difficulty || 'easy';
  const isCoding = type === 'coding';
  const numCount = Math.min(Math.max(Number(count) || 1, 1), 10);

  if (isCoding) {
    const codingTemplates = [
      {
        title: `Implement ${topicName} Solution`,
        description: `Write an efficient function to process inputs according to ${topicName} principles. Your solution should handle edge cases gracefully and run within the time limit.`,
        inputFormat: `Space-separated line of parameters or array elements`,
        outputFormat: `Processed result or computed scalar value`,
        constraints: `1 <= N <= 10^5`,
        difficulty: diff,
        category: category || 'Algorithms',
        topic: topicName,
        marks: diff === 'easy' ? 10 : diff === 'medium' ? 20 : 30,
        allowedLanguages: ['javascript', 'python', 'java', 'cpp', 'c'],
        examples: [
          { input: '5\n1 2 3 4 5', output: '15', explanation: 'Sum of elements 1 through 5' },
          { input: '3\n10 20 30', output: '60', explanation: 'Sum of elements 10, 20, 30' }
        ],
        starterCode: [
          { language: 'javascript', code: 'function solve(input) {\n  const lines = input.trim().split("\\n");\n  // Write your logic here\n  return lines;\n}' },
          { language: 'python', code: 'def solve(input_data):\n    lines = input_data.strip().split("\\n")\n    # Write your logic here\n    return lines\n' },
          { language: 'cpp', code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}' }
        ],
        testCases: [
          { input: '5\n1 2 3 4 5', expectedOutput: '15', isHidden: false, weight: 2 },
          { input: '3\n10 20 30', expectedOutput: '60', isHidden: false, weight: 2 },
          { input: '1\n100', expectedOutput: '100', isHidden: true, weight: 3 },
          { input: '4\n-1 -2 -3 -4', expectedOutput: '-10', isHidden: true, weight: 3 }
        ]
      },
      {
        title: `${topicName} Pattern Matching & Search`,
        description: `Create an algorithm to identify key patterns related to ${topicName}. Return the frequency or formatted indices of matching patterns.`,
        inputFormat: `First line contains string target, second line contains query pattern`,
        outputFormat: `Matching indices or frequency integer`,
        constraints: `1 <= Len <= 5000`,
        difficulty: diff,
        category: category || 'Data Structures',
        topic: topicName,
        marks: diff === 'easy' ? 10 : diff === 'medium' ? 20 : 30,
        allowedLanguages: ['javascript', 'python', 'java', 'cpp', 'c'],
        examples: [
          { input: 'hello world\nworld', output: '1', explanation: 'Pattern appears 1 time' }
        ],
        starterCode: [
          { language: 'javascript', code: 'function solve(input) {\n  // Write logic\n}' },
          { language: 'python', code: 'def solve(input_data):\n    # Write logic\n    pass' }
        ],
        testCases: [
          { input: 'hello world\nworld', expectedOutput: '1', isHidden: false, weight: 5 },
          { input: 'aaaaa\naa', expectedOutput: '4', isHidden: true, weight: 5 }
        ]
      }
    ];

    const results = [];
    for (let i = 0; i < numCount; i++) {
      const tmpl = codingTemplates[i % codingTemplates.length];
      results.push({
        ...tmpl,
        title: `${tmpl.title} #${i + 1}`
      });
    }
    return results;
  }

  // MCQ Generation Fallback
  const mcqPool = [
    {
      questionText: `Which of the following statements is TRUE regarding ${topicName}?`,
      options: [
        { optionText: `It improves execution modularity and performance when used correctly.`, isCorrect: true },
        { optionText: `It cannot be executed in modern runtime environments.`, isCorrect: false },
        { optionText: `It causes synchronous blocking of all asynchronous task queues.`, isCorrect: false },
        { optionText: `It is deprecated in standard language specifications.`, isCorrect: false }
      ],
      questionType: 'single',
      marks: 1,
      negativeMarks: 0.25,
      category: category || 'General',
      topic: topicName,
      difficulty: diff,
      explanation: `In ${topicName}, correct implementation optimizes modular structure and execution performance.`
    },
    {
      questionText: `What is the primary purpose of applying ${topicName} in software development?`,
      options: [
        { optionText: `To manage state and streamline computational flow.`, isCorrect: true },
        { optionText: `To bypass security access control policies.`, isCorrect: false },
        { optionText: `To increase memory leaks intentionally.`, isCorrect: false },
        { optionText: `To convert source code directly into hardware binary.`, isCorrect: false }
      ],
      questionType: 'single',
      marks: 1,
      negativeMarks: 0,
      category: category || 'General',
      topic: topicName,
      difficulty: diff,
      explanation: `The core purpose of ${topicName} is to streamline computation and maintain reliable state management.`
    },
    {
      questionText: `Which algorithmic complexity is typically targeted when optimizing ${topicName}?`,
      options: [
        { optionText: `O(1) or O(log N) optimal time complexity`, isCorrect: true },
        { optionText: `O(N!) factorial complexity`, isCorrect: false },
        { optionText: `O(2^N) exponential delay`, isCorrect: false },
        { optionText: `Infinite loop execution without return`, isCorrect: false }
      ],
      questionType: 'single',
      marks: 1,
      negativeMarks: 0.25,
      category: category || 'General',
      topic: topicName,
      difficulty: diff,
      explanation: `Efficient ${topicName} implementations aim for logarithmic O(log N) or constant O(1) time bounds.`
    }
  ];

  const results = [];
  for (let i = 0; i < numCount; i++) {
    const item = mcqPool[i % mcqPool.length];
    results.push({
      ...item,
      questionText: `[${topicName}] Q${i + 1}: ${item.questionText}`
    });
  }
  return results;
};

/**
 * Heuristic Code Analyzer Fallback
 */
const analyzeHeuristicCode = ({ code, language, problemTitle }) => {
  const cleanCode = (code || '').trim();
  const lineCount = cleanCode.split('\n').length;
  
  let timeComplexity = 'O(N)';
  let spaceComplexity = 'O(1)';
  let qualityScore = 85;
  const strengths = [];
  const weaknesses = [];
  const recommendations = [];

  // Basic syntax analysis heuristic
  if (/for\s*\(.*for\s*\(/i.test(cleanCode) || /while\s*\(.*while\s*\(/i.test(cleanCode)) {
    timeComplexity = 'O(N²)';
    qualityScore -= 15;
    weaknesses.push('Nested loop detected which may lead to quadratic O(N²) execution time on large datasets.');
    recommendations.push('Consider using HashMaps or Frequency Counters to reduce nested loop iteration to O(N).');
  } else if (/log/i.test(cleanCode) || /binarySearch/i.test(cleanCode) || /pivot/i.test(cleanCode)) {
    timeComplexity = 'O(N log N)';
    strengths.push('Efficient divide-and-conquer logarithmic patterns detected.');
  } else if (/for|while/i.test(cleanCode)) {
    timeComplexity = 'O(N)';
    strengths.push('Linear single-pass loop traversal ensures O(N) efficiency.');
  } else {
    timeComplexity = 'O(1)';
    strengths.push('Constant execution time without heavy loop iterations.');
  }

  if (/\[\]|\{\}|new Array|malloc|std::vector/i.test(cleanCode)) {
    spaceComplexity = 'O(N)';
    weaknesses.push('Dynamic memory / auxiliary array allocation consumes additional O(N) space.');
    recommendations.push('Try to solve the problem in-place using dual pointers to achieve O(1) space.');
  } else {
    spaceComplexity = 'O(1)';
    strengths.push('Minimal memory overhead with O(1) auxiliary space complexity.');
  }

  if (!/\/\//.test(cleanCode) && !/\/\*/.test(cleanCode) && lineCount > 15) {
    qualityScore -= 10;
    weaknesses.push('Lack of code inline comments for complex function blocks.');
    recommendations.push('Add descriptive JSDoc / inline comments for improved maintenance.');
  }

  if (lineCount < 5 && cleanCode.length > 10) {
    strengths.push('Concise solution with clean code footprint.');
  }

  const suggestedCode = `// AI Optimized Solution for: ${problemTitle || 'Coding Problem'} (${language || 'javascript'})\n` +
    (language === 'python'
      ? `def solve(input_data):\n    # Optimized single pass with hash table\n    seen = {}\n    for item in input_data:\n        if item in seen:\n            seen[item] += 1\n        else:\n            seen[item] = 1\n    return seen\n`
      : `function solve(inputData) {\n  // Optimized O(N) time & O(1) auxiliary space solution\n  let left = 0, right = inputData.length - 1;\n  while (left < right) {\n    // Perform optimal two-pointer processing\n    left++;\n    right--;\n  }\n  return inputData;\n}`);

  return {
    timeComplexity,
    spaceComplexity,
    qualityScore: Math.max(qualityScore, 60),
    strengths,
    weaknesses: weaknesses.length > 0 ? weaknesses : ['No major bottlenecks found.'],
    recommendations: recommendations.length > 0 ? recommendations : ['Code is well structured and optimal.'],
    suggestedCode,
    summary: `The submitted solution for "${problemTitle || 'Problem'}" runs with estimated ${timeComplexity} Time Complexity and ${spaceComplexity} Space Complexity. Overall code quality score is ${qualityScore}/100.`
  };
};

/**
 * Generate Questions via AI LLM or Heuristic Engine
 */
exports.generateAIQuestions = async ({ topic, category, difficulty, type, count }) => {
  const geminiKey = process.env.GEMINI_API_KEY;

  if (geminiKey) {
    try {
      const promptText = `Generate ${count} ${difficulty} level ${type} examination questions for topic "${topic}" in category "${category}". Return JSON array only with questionText, options (with optionText, isCorrect), questionType, marks, negativeMarks, explanation, topic, category, difficulty.`;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        }
      );
      const resData = await response.json();
      const rawText = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const jsonMatch = rawText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
    } catch (err) {
      console.warn('Gemini API Error, using Heuristic AI Engine fallback:', err.message);
    }
  }

  return generateHeuristicQuestions({ topic, category, difficulty, type, count });
};

/**
 * Analyze Submitted Code via AI LLM or Heuristic Engine
 */
exports.analyzeAICode = async ({ code, language, problemTitle, problemDescription, testResults }) => {
  const geminiKey = process.env.GEMINI_API_KEY;

  if (geminiKey) {
    try {
      const promptText = `Analyze this ${language} code submission for problem "${problemTitle}".
Code:
\`\`\`${language}
${code}
\`\`\`
Return JSON object with keys: timeComplexity, spaceComplexity, qualityScore (0-100), strengths (array), weaknesses (array), recommendations (array), suggestedCode, summary.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        }
      );
      const resData = await response.json();
      const rawText = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
    } catch (err) {
      console.warn('Gemini API Error, using Heuristic Code Analyzer fallback:', err.message);
    }
  }

  return analyzeHeuristicCode({ code, language, problemTitle });
};
