import express from 'express';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize AI providers
let gemini = null;
let useGemini = false;
const AI_PROVIDER = 'gemini'; // Force using Gemini only

// Initialize Gemini (Google AI Studio)
try {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    console.log('⚠️  GEMINI_API_KEY is not set in environment variables');
  } else {
    gemini = new GoogleGenerativeAI(geminiKey);
    useGemini = true;
    console.log('✅ Google AI Studio (Gemini) initialized successfully');
  }
} catch (error) {
  console.error('❌ Gemini initialization failed:', error.message);
  console.error('Stack:', error.stack);
}

// OpenAI is disabled to avoid quota issues
console.log('ℹ️  OpenAI is disabled to avoid quota issues');

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

    // If Gemini configured, use it first (primary provider)
    if (useGemini && gemini) {
      try {
        const modelName = process.env.GEMINI_MODEL || 'gemini-pro';
        const model = gemini.getGenerativeModel({ model: modelName });
        
        const prompt = `You are a helpful college student assistant for Campus Connect. Provide concise, accurate, and friendly answers to student questions about college life, academics, and campus services. Keep responses under 120 words, be conversational, and include clear next steps if appropriate. If you don't know something specific, suggest checking course materials or contacting the instructor.

Student Question: ${question}

Provide a helpful answer:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const aiAnswer = response.text().trim();
        
        if (aiAnswer) {
          return res.json({ 
            success: true, 
            answer: aiAnswer, 
            source: 'google_ai_studio', 
            model: modelName,
            timestamp: new Date().toISOString() 
          });
        }
      } catch (gemErr) {
        console.error('Google AI Studio (Gemini) API error:', gemErr?.message || gemErr);
        // Continue to fallback
      }
    }

    // OpenAI fallback is disabled to avoid quota issues
    console.log('ℹ️  OpenAI fallback is disabled to avoid quota issues');

    // Final fallback if no AI provider worked
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
      provider: AI_PROVIDER,
      openai: !!openai,
      google_ai_studio: useGemini,
      gemini_model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
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
