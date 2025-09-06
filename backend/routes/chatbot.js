import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize OpenAI with the provided API key
let openai = null;
let useGemini = false;
let geminiClient = null;
try {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    openai = new OpenAI({ apiKey });
    console.log('✅ OpenAI initialized successfully');
  } else {
    console.log('⚠️  OPENAI_API_KEY not set - chatbot will use local/fallback answers only');
  }
} catch (error) {
  console.log('⚠️  OpenAI initialization failed:', error.message);
}

// Optional: Gemini support via REST if configured
try {
  if ((process.env.AI_PROVIDER || 'openai').toLowerCase() === 'gemini' && process.env.GEMINI_API_KEY) {
    useGemini = true;
    geminiClient = { key: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' };
    console.log('✅ Gemini configured as AI provider');
  }
} catch (e) {
  console.log('⚠️  Gemini init skipped:', e?.message || e);
}

// Local knowledge base for common student questions
const knowledgeBase = {
  'when is the exam': 'Exam dates are typically announced 2-3 weeks in advance. Please check the official notice board or contact your department.',
  'what is the syllabus': 'The syllabus can be found in your course handbook or on the college website. You can also ask your course coordinator.',
  'where is the library': "The library is located on the 2nd floor of the main building. It's open from 8 AM to 8 PM on weekdays.",
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
    const userId = req.body?.userId;
    const question = (req.body && (req.body.question || req.body.message)) || '';
    console.log('[Chatbot] /ask', { hasQuestion: Boolean(question), userId, keys: Object.keys(req.body || {}) });
    
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

    // If Gemini configured, try it first
    if (useGemini && geminiClient) {
      try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiClient.model)}:generateContent?key=${encodeURIComponent(geminiClient.key)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: question }] }] })
        });
        const data = await resp.json();
        const aiAnswer = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (aiAnswer) {
          return res.json({ success: true, answer: aiAnswer, source: 'gemini', timestamp: new Date().toISOString() });
        }
      } catch (gemErr) {
        console.error('Gemini API error:', gemErr?.message || gemErr);
      }
    }

    // If no local answer and OpenAI is available, try OpenAI
    if (openai) {
      try {
        const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
        const completion = await openai.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful college student assistant for Meta-Verse University. Provide concise, accurate answers to student questions about college life, academics, and campus services. Keep responses under 120 words, be friendly, and include clear next steps if appropriate. If you do not know something specific about the university, suggest checking course materials or contacting the instructor.'
            },
            { role: 'user', content: question }
          ],
          max_tokens: 220,
          temperature: 0.7
        });

        const aiAnswer = completion.choices?.[0]?.message?.content?.trim() || "Sorry, I couldn't generate a response.";

        return res.json({
          success: true,
          answer: aiAnswer,
          source: 'openai_gpt',
          timestamp: new Date().toISOString()
        });
      } catch (openaiError) {
        const msg = openaiError?.response?.data || openaiError?.message || openaiError;
        console.error('OpenAI API error:', msg);
        // If Gemini is configured, try Gemini as fallback
        if (useGemini && geminiClient) {
          try {
            const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiClient.model)}:generateContent?key=${encodeURIComponent(geminiClient.key)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: [{ text: question }] }] })
            });
            const data = await resp.json();
            const aiAnswer = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (aiAnswer) {
              return res.json({ success: true, answer: aiAnswer, source: 'gemini_fallback', timestamp: new Date().toISOString() });
            }
          } catch (gemErr) {
            console.error('Gemini fallback error:', gemErr?.message || gemErr);
          }
        }
        // Final fallback
        return res.json({
          success: true,
          answer: "I'm sorry, I'm having trouble processing your request right now. Please try asking a different question or contact the college administration for assistance.",
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
    console.error('Suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/chatbot/status - Check chatbot status
router.get('/status', (req, res) => {
  try {
    res.json({
      success: true,
      status: 'operational',
      openai: !!openai,
      gemini: useGemini,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
