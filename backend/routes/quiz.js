import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Sample quiz database with different topics and question types
const quizDatabase = {
  // Programming & Computer Science
  programming: [
    {
      id: uuidv4(),
      question: "What is the time complexity of binary search?",
      type: "multiple_choice",
      options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
      correctAnswer: 1,
      explanation: "Binary search divides the search space in half with each iteration, resulting in logarithmic time complexity.",
      difficulty: "medium",
      topic: "algorithms",
      tags: ["algorithms", "search", "complexity"]
    },
    {
      id: uuidv4(),
      question: "Which data structure follows LIFO principle?",
      type: "multiple_choice",
      options: ["Queue", "Stack", "Tree", "Graph"],
      correctAnswer: 1,
      explanation: "Stack follows Last In First Out (LIFO) principle where the last element added is the first one to be removed.",
      difficulty: "easy",
      topic: "data_structures",
      tags: ["data_structures", "stack", "lifo"]
    },
    {
      id: uuidv4(),
      question: "What does HTML stand for?",
      type: "multiple_choice",
      options: ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink and Text Markup Language"],
      correctAnswer: 0,
      explanation: "HTML stands for Hyper Text Markup Language, which is the standard markup language for creating web pages.",
      difficulty: "easy",
      topic: "web_development",
      tags: ["html", "web", "markup"]
    },
    {
      id: uuidv4(),
      question: "Complete the code: function fibonacci(n) { if (n <= 1) return n; return fibonacci(n-1) + fibonacci(n-2); }",
      type: "code_completion",
      code: "function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n-1) + fibonacci(n-2);\n}",
      correctAnswer: "The function is already complete and correctly implements the Fibonacci sequence using recursion.",
      explanation: "This is a classic recursive implementation of the Fibonacci sequence. The base cases are n <= 1, and for larger values, it recursively calls itself with n-1 and n-2.",
      difficulty: "medium",
      topic: "recursion",
      tags: ["recursion", "fibonacci", "algorithms"]
    },
    {
      id: uuidv4(),
      question: "What is the output of: console.log(typeof [])?",
      type: "multiple_choice",
      options: ["array", "object", "undefined", "null"],
      correctAnswer: 1,
      explanation: "In JavaScript, arrays are objects. The typeof operator returns 'object' for arrays because they are special types of objects.",
      difficulty: "easy",
      topic: "javascript",
      tags: ["javascript", "arrays", "typeof"]
    }
  ],

  // Mathematics
  mathematics: [
    {
      id: uuidv4(),
      question: "What is the derivative of x²?",
      type: "multiple_choice",
      options: ["x", "2x", "x²", "2x²"],
      correctAnswer: 1,
      explanation: "The derivative of x² is 2x, using the power rule: d/dx(x^n) = n*x^(n-1).",
      difficulty: "medium",
      topic: "calculus",
      tags: ["calculus", "derivatives", "power_rule"]
    },
    {
      id: uuidv4(),
      question: "Solve: 2x + 5 = 13",
      type: "multiple_choice",
      options: ["x = 3", "x = 4", "x = 5", "x = 6"],
      correctAnswer: 1,
      explanation: "2x + 5 = 13 → 2x = 8 → x = 4",
      difficulty: "easy",
      topic: "algebra",
      tags: ["algebra", "linear_equations", "solving"]
    },
    {
      id: uuidv4(),
      question: "What is the area of a circle with radius 5?",
      type: "multiple_choice",
      options: ["25π", "50π", "75π", "100π"],
      correctAnswer: 0,
      explanation: "Area of circle = πr² = π(5)² = 25π",
      difficulty: "easy",
      topic: "geometry",
      tags: ["geometry", "circles", "area"]
    }
  ],

  // Science
  science: [
    {
      id: uuidv4(),
      question: "What is the chemical symbol for gold?",
      type: "multiple_choice",
      options: ["Ag", "Au", "Fe", "Cu"],
      correctAnswer: 1,
      explanation: "Au comes from the Latin word 'aurum' which means gold.",
      difficulty: "easy",
      topic: "chemistry",
      tags: ["chemistry", "elements", "symbols"]
    },
    {
      id: uuidv4(),
      question: "Which planet is known as the Red Planet?",
      type: "multiple_choice",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      correctAnswer: 1,
      explanation: "Mars is called the Red Planet due to its reddish appearance, caused by iron oxide (rust) on its surface.",
      difficulty: "easy",
      topic: "astronomy",
      tags: ["astronomy", "planets", "mars"]
    }
  ],

  // General Knowledge
  general: [
    {
      id: uuidv4(),
      question: "Who wrote 'Romeo and Juliet'?",
      type: "multiple_choice",
      options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
      correctAnswer: 1,
      explanation: "William Shakespeare wrote the famous tragedy 'Romeo and Juliet' in the late 16th century.",
      difficulty: "easy",
      topic: "literature",
      tags: ["literature", "shakespeare", "plays"]
    },
    {
      id: uuidv4(),
      question: "What is the capital of Japan?",
      type: "multiple_choice",
      options: ["Beijing", "Seoul", "Tokyo", "Bangkok"],
      correctAnswer: 2,
      explanation: "Tokyo is the capital and largest city of Japan.",
      difficulty: "easy",
      topic: "geography",
      tags: ["geography", "capitals", "japan"]
    }
  ],

  // Engineering
  engineering: [
    {
      id: uuidv4(),
      question: "What is Ohm's Law?",
      type: "multiple_choice",
      options: ["V = IR", "P = VI", "F = ma", "E = mc²"],
      correctAnswer: 0,
      explanation: "Ohm's Law states that voltage (V) equals current (I) times resistance (R): V = IR",
      difficulty: "medium",
      topic: "electrical",
      tags: ["electrical", "ohms_law", "circuits"]
    },
    {
      id: uuidv4(),
      question: "What is the SI unit of force?",
      type: "multiple_choice",
      options: ["Joule", "Watt", "Newton", "Pascal"],
      correctAnswer: 2,
      explanation: "The Newton (N) is the SI unit of force, defined as the force needed to accelerate 1 kg at 1 m/s².",
      difficulty: "easy",
      topic: "physics",
      tags: ["physics", "force", "si_units"]
    }
  ]
};

// Function to get random questions by topic
const getRandomQuestionsByTopic = (topic, count = 5, difficulty = null) => {
  let questions = [];
  
  if (topic === 'all') {
    // Get questions from all topics
    Object.values(quizDatabase).forEach(topicQuestions => {
      questions.push(...topicQuestions);
    });
  } else if (quizDatabase[topic]) {
    questions = [...quizDatabase[topic]];
  }
  
  // Filter by difficulty if specified
  if (difficulty && difficulty !== 'all') {
    questions = questions.filter(q => q.difficulty === difficulty);
  }
  
  // Shuffle and return requested count
  const shuffled = questions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, questions.length));
};

// Function to get questions by tags
const getQuestionsByTags = (tags, count = 5) => {
  let questions = [];
  Object.values(quizDatabase).forEach(topicQuestions => {
    questions.push(...topicQuestions);
  });
  
  // Filter by tags
  questions = questions.filter(q => 
    q.tags && q.tags.some(tag => tags.includes(tag))
  );
  
  const shuffled = questions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, questions.length));
};

// GET /api/quiz/topics - Get all available topics
router.get('/topics', (req, res) => {
  try {
    const topics = Object.keys(quizDatabase).map(topic => ({
      id: topic,
      name: topic.charAt(0).toUpperCase() + topic.slice(1),
      questionCount: quizDatabase[topic].length,
      difficulties: [...new Set(quizDatabase[topic].map(q => q.difficulty))]
    }));
    
    res.json({
      success: true,
      topics: topics,
      totalTopics: topics.length
    });
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/quiz/questions/:topic - Get random questions by topic
router.get('/questions/:topic', (req, res) => {
  try {
    const { topic } = req.params;
    const { count = 5, difficulty = 'all' } = req.query;
    
    if (!quizDatabase[topic] && topic !== 'all') {
      return res.status(400).json({
        success: false,
        error: 'Invalid topic. Available topics: ' + Object.keys(quizDatabase).join(', ')
      });
    }
    
    const questions = getRandomQuestionsByTopic(topic, parseInt(count), difficulty);
    
    res.json({
      success: true,
      topic: topic,
      difficulty: difficulty,
      questions: questions,
      total: questions.length,
      requested: parseInt(count)
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/quiz/random - Get completely random questions
router.get('/random', (req, res) => {
  try {
    const { count = 10, difficulty = 'all' } = req.query;
    
    let allQuestions = [];
    Object.values(quizDatabase).forEach(topicQuestions => {
      allQuestions.push(...topicQuestions);
    });
    
    // Filter by difficulty if specified
    if (difficulty && difficulty !== 'all') {
      allQuestions = allQuestions.filter(q => q.difficulty === difficulty);
    }
    
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    const randomQuestions = shuffled.slice(0, Math.min(parseInt(count), allQuestions.length));
    
    res.json({
      success: true,
      questions: randomQuestions,
      total: randomQuestions.length,
      requested: parseInt(count),
      difficulty: difficulty
    });
  } catch (error) {
    console.error('Error fetching random questions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/quiz/tags - Get questions by tags
router.get('/tags', (req, res) => {
  try {
    const { tags, count = 5 } = req.query;
    
    if (!tags) {
      return res.status(400).json({
        success: false,
        error: 'Tags parameter is required'
      });
    }
    
    const tagArray = tags.split(',').map(tag => tag.trim());
    const questions = getQuestionsByTags(tagArray, parseInt(count));
    
    res.json({
      success: true,
      tags: tagArray,
      questions: questions,
      total: questions.length,
      requested: parseInt(count)
    });
  } catch (error) {
    console.error('Error fetching questions by tags:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/quiz/difficulty/:level - Get questions by difficulty level
router.get('/difficulty/:level', (req, res) => {
  try {
    const { level } = req.params;
    const { count = 10, topic = 'all' } = req.query;
    
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(level)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid difficulty level. Use: easy, medium, or hard'
      });
    }
    
    const questions = getRandomQuestionsByTopic(topic, parseInt(count), level);
    
    res.json({
      success: true,
      difficulty: level,
      topic: topic,
      questions: questions,
      total: questions.length,
      requested: parseInt(count)
    });
  } catch (error) {
    console.error('Error fetching questions by difficulty:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/quiz/search - Search questions by text
router.get('/search', (req, res) => {
  try {
    const { q, topic = 'all', difficulty = 'all', count = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    let questions = [];
    if (topic === 'all') {
      Object.values(quizDatabase).forEach(topicQuestions => {
        questions.push(...topicQuestions);
      });
    } else if (quizDatabase[topic]) {
      questions = [...quizDatabase[topic]];
    }
    
    // Filter by difficulty
    if (difficulty && difficulty !== 'all') {
      questions = questions.filter(q => q.difficulty === difficulty);
    }
    
    // Search in question text and tags
    const searchLower = q.toLowerCase();
    const searchResults = questions.filter(question => 
      question.question.toLowerCase().includes(searchLower) ||
      (question.tags && question.tags.some(tag => tag.toLowerCase().includes(searchLower)))
    );
    
    const shuffled = searchResults.sort(() => 0.5 - Math.random());
    const limitedResults = shuffled.slice(0, Math.min(parseInt(count), searchResults.length));
    
    res.json({
      success: true,
      query: q,
      topic: topic,
      difficulty: difficulty,
      questions: limitedResults,
      total: limitedResults.length,
      totalFound: searchResults.length,
      requested: parseInt(count)
    });
  } catch (error) {
    console.error('Error searching questions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/quiz/stats - Get quiz statistics
router.get('/stats', (req, res) => {
  try {
    let totalQuestions = 0;
    let difficultyStats = { easy: 0, medium: 0, hard: 0 };
    let topicStats = {};
    let typeStats = {};
    
    Object.entries(quizDatabase).forEach(([topic, questions]) => {
      topicStats[topic] = questions.length;
      totalQuestions += questions.length;
      
      questions.forEach(question => {
        difficultyStats[question.difficulty]++;
        typeStats[question.type] = (typeStats[question.type] || 0) + 1;
      });
    });
    
    res.json({
      success: true,
      stats: {
        totalQuestions,
        byDifficulty: difficultyStats,
        byTopic: topicStats,
        byType: typeStats,
        topics: Object.keys(quizDatabase)
      }
    });
  } catch (error) {
    console.error('Error fetching quiz stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/quiz/submit - Submit quiz answers for scoring
router.post('/submit', (req, res) => {
  try {
    const { answers, timeTaken } = req.body;
    
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: 'Answers array is required'
      });
    }
    
    let score = 0;
    let totalQuestions = answers.length;
    let correctAnswers = 0;
    let detailedResults = [];
    
    answers.forEach(answer => {
      const { questionId, selectedAnswer, question } = answer;
      
      // Find the question in our database
      let foundQuestion = null;
      Object.values(quizDatabase).forEach(topicQuestions => {
        const found = topicQuestions.find(q => q.id === questionId);
        if (found) foundQuestion = found;
      });
      
      if (foundQuestion) {
        const isCorrect = selectedAnswer === foundQuestion.correctAnswer;
        if (isCorrect) {
          score++;
          correctAnswers++;
        }
        
        detailedResults.push({
          questionId,
          question: foundQuestion.question,
          selectedAnswer,
          correctAnswer: foundQuestion.correctAnswer,
          isCorrect,
          explanation: foundQuestion.explanation
        });
      }
    });
    
    const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    
    res.json({
      success: true,
      results: {
        score: correctAnswers,
        totalQuestions,
        percentage: Math.round(percentage * 100) / 100,
        timeTaken: timeTaken || 0,
        detailedResults
      }
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
