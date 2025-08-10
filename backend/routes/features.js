import express from 'express';

const router = express.Router();

// Mock data for online classes
const mockClasses = [
  {
    id: 1,
    title: "Introduction to Computer Science",
    instructor: "Dr. Sarah Johnson",
    time: "10:00 AM - 11:30 AM",
    date: "2024-01-15",
    duration: "90 min",
    participants: 24,
    maxParticipants: 30,
    status: "upcoming",
    meetingId: "cs101-intro",
    isLive: false
  },
  {
    id: 2,
    title: "Advanced Mathematics",
    instructor: "Prof. Michael Chen",
    time: "2:00 PM - 3:30 PM",
    date: "2024-01-15",
    duration: "90 min",
    participants: 18,
    maxParticipants: 25,
    status: "live",
    meetingId: "math201-advanced",
    isLive: true
  },
  {
    id: 3,
    title: "English Literature",
    instructor: "Dr. Emily Davis",
    time: "4:00 PM - 5:00 PM",
    date: "2024-01-15",
    duration: "60 min",
    participants: 22,
    maxParticipants: 28,
    status: "upcoming",
    meetingId: "eng101-literature",
    isLive: false
  }
];

// GET /api/features/classes
router.get('/classes', (req, res) => {
  try {
    res.json({
      success: true,
      classes: mockClasses,
      total: mockClasses.length
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// POST /api/features/chatbot
router.post('/chatbot', (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message is required' 
      });
    }

    // Simple response logic
    const lowerMessage = message.toLowerCase();
    let response = "I understand your question. Please check your course materials or contact your instructor for the most accurate information.";

    if (lowerMessage.includes('exam') || lowerMessage.includes('test')) {
      response = "Based on the current schedule, the next exam is scheduled for next week. Please check your course calendar for the exact date and time.";
    } else if (lowerMessage.includes('syllabus')) {
      response = "The syllabus for this semester covers the main topics from your course outline. You can find the detailed syllabus in your course materials section.";
    } else if (lowerMessage.includes('deadline') || lowerMessage.includes('due date')) {
      response = "Assignment deadlines are typically posted in your course announcements. The next major assignment is due in 2 weeks.";
    } else if (lowerMessage.includes('grade')) {
      response = "The grading policy is outlined in your course syllabus. Typically, assignments count for 40%, exams for 40%, and participation for 20%.";
    }

    res.json({
      success: true,
      response,
      source: 'knowledge_base'
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// POST /api/features/notifications/subscribe
router.post('/notifications/subscribe', (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required' 
      });
    }

    res.json({
      success: true,
      message: 'Successfully subscribed to notifications',
      userId
    });

  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// POST /api/features/notifications/unsubscribe
router.post('/notifications/unsubscribe', (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required' 
      });
    }

    res.json({
      success: true,
      message: 'Successfully unsubscribed from notifications',
      userId
    });

  } catch (error) {
    console.error('Unsubscription error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// POST /api/features/notifications/test
router.post('/notifications/test', (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required' 
      });
    }

    res.json({
      success: true,
      message: 'Test notification sent successfully',
      userId
    });

  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

export default router;
