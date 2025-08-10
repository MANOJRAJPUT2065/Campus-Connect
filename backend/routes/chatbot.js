import express from 'express';
import OpenAI from 'openai';

const router = express.Router();

// Initialize OpenAI with the provided API key
let openai = null;
try {
  openai = new OpenAI({
    apiKey: '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',
  });
  console.log('✅ OpenAI initialized successfully with provided API key');
} catch (error) {
  console.log('⚠️  OpenAI initialization failed:', error.message);
}

// Local knowledge base for common student questions
const knowledgeBase = {
  'when is the exam': 'Exam dates are typically announced 2-3 weeks in advance. Please check the official notice board or contact your department.',
  'what is the syllabus': 'The syllabus can be found in your course handbook or on the college website. You can also ask your course coordinator.',
  'where is the library': 'The library is located on the 2nd floor of the main building. It\'s open from 8 AM to 8 PM on weekdays.',
  'how to register for events': 'Event registration can be done through the college portal or by contacting the event organizers directly.',
  'what are the office hours': 'Office hours are typically 9 AM to 5 PM on weekdays. Some departments may have extended hours.',
  'how to contact faculty': 'You can contact faculty through email, during office hours, or by scheduling an appointment.',
  'where to submit assignments': 'Assignments can be submitted online through the learning management system or in person to your course coordinator.',
  'what is the attendance policy': 'The attendance policy requires 75% attendance to be eligible for exams. Please check with your department for specific details.',
  'how to get student id': 'Student ID cards can be collected from the administration office after completing your enrollment.',
  'where is the cafeteria': 'The cafeteria is located on the ground floor near the main entrance. It serves breakfast, lunch, and snacks.'
};

// Function to find best response from knowledge base
function findBestResponse(question) {
  const questionLower = question.toLowerCase();
  
  for (const [key, answer] of Object.entries(knowledgeBase)) {
    if (questionLower.includes(key) || key.includes(questionLower)) {
      return answer;
    }
  }
  
  return null;
}

// POST /api/chatbot/ask - Main chatbot endpoint
router.post('/ask', async (req, res) => {
  try {
    const { question, userId } = req.body;
    
    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Question is required'
      });
    }

    // First try to find answer in local knowledge base
    const localAnswer = findBestResponse(question);
    
    if (localAnswer) {
      return res.json({
        success: true,
        answer: localAnswer,
        source: 'local_knowledge_base',
        timestamp: new Date().toISOString()
      });
    }

    // If no local answer and OpenAI is available, try OpenAI
    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a helpful college student assistant for Meta-Verse University. Provide concise, accurate answers to student questions about college life, academics, and campus services. Keep responses under 100 words and be friendly and helpful. If you don't know something specific about the university, suggest they check their course materials or contact their instructor."
            },
            {
              role: "user",
              content: question
            }
          ],
          max_tokens: 150,
          temperature: 0.7
        });

        const aiAnswer = completion.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';

        return res.json({
          success: true,
          answer: aiAnswer,
          source: 'openai_gpt',
          timestamp: new Date().toISOString()
        });
      } catch (openaiError) {
        console.error('OpenAI API error:', openaiError);
        // Fall back to generic response
        return res.json({
          success: true,
          answer: 'I\'m sorry, I\'m having trouble processing your request right now. Please try asking a different question or contact the college administration for assistance.',
          source: 'fallback_response',
          timestamp: new Date().toISOString()
        });
      }
    }

    // If OpenAI is not available, provide a helpful fallback
    return res.json({
      success: true,
      answer: 'I can help with common questions about exams, syllabus, library, events, office hours, faculty contact, assignments, attendance, student ID, and cafeteria. Please try rephrasing your question or contact the college administration for specific information.',
      source: 'fallback_response',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process your question'
    });
  }
});

// GET /api/chatbot/suggestions - Get quick question suggestions
router.get('/suggestions', (req, res) => {
  try {
    const suggestions = [
      'When is the exam?',
      'What is the syllabus?',
      'Where is the library?',
      'How to register for events?',
      'What are the office hours?',
      'How to contact faculty?',
      'Where to submit assignments?',
      'What is the attendance policy?',
      'How to get student ID?',
      'Where is the cafeteria?'
    ];

    res.json({
      success: true,
      suggestions,
      message: 'Quick question suggestions'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get suggestions'
    });
  }
});

// POST /api/chatbot/feedback - Collect user feedback on responses
router.post('/feedback', (req, res) => {
  try {
    const { questionId, rating, comment, userId } = req.body;
    
    // In a real app, you'd save this to a database
    console.log('Feedback received:', { questionId, rating, comment, userId });
    
    res.json({
      success: true,
      message: 'Feedback received successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to save feedback'
    });
  }
});

// GET /api/chatbot/stats - Get chatbot usage statistics
router.get('/stats', (req, res) => {
  try {
    // In a real app, you'd get this from a database
    const stats = {
      totalQuestions: 0,
      localAnswers: 0,
      openaiAnswers: 0,
      fallbackAnswers: 0,
      averageResponseTime: '0.5s',
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      stats,
      message: 'Chatbot statistics'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
});

export default router;
