import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Sample notices database with different categories
const sampleNotices = [
  // Academic Notices
  {
    id: uuidv4(),
    title: "Mid-Term Examination Schedule Released",
    content: "The mid-term examinations for all undergraduate programs will commence from March 15, 2024. Please check your respective department notice boards for detailed schedules. Students are advised to prepare accordingly and report any clashes immediately.",
    category: "academic",
    priority: "high",
    date: new Date().toISOString().split('T')[0],
    author: "Academic Office",
    attachments: ["exam_schedule.pdf", "guidelines.pdf"],
    isActive: true
  },
  {
    id: uuidv4(),
    title: "Library Timings Extended for Exam Season",
    content: "The central library will now operate from 7:00 AM to 11:00 PM during the examination period. Extended hours are to accommodate students preparing for exams. Please maintain silence in study areas.",
    category: "academic",
    priority: "medium",
    date: new Date().toISOString().split('T')[0],
    author: "Library Administration",
    attachments: ["new_timings.pdf"],
    isActive: true
  },
  {
    id: uuidv4(),
    title: "Course Registration Deadline Extended",
    content: "Due to technical issues, the course registration deadline has been extended to March 25, 2024. All students must complete their course selection by this date. Contact your academic advisor for assistance.",
    category: "academic",
    priority: "high",
    date: new Date().toISOString().split('T')[0],
    author: "Student Affairs",
    attachments: ["course_catalog.pdf", "registration_form.pdf"],
    isActive: true
  },
  
  // Event Notices
  {
    id: uuidv4(),
    title: "Annual Tech Fest Registration Open",
    content: "TechNova 2024 - our annual technical festival is now open for registrations. Events include coding competitions, robotics challenges, hackathons, and technical workshops. Last date for registration: March 20, 2024.",
    category: "event",
    priority: "medium",
    date: new Date().toISOString().split('T')[0],
    author: "Tech Club",
    attachments: ["event_brochure.pdf", "registration_form.pdf"],
    isActive: true
  },
  {
    id: uuidv4(),
    title: "Cultural Festival Auditions",
    content: "Auditions for the annual cultural festival will be held on March 18-20, 2024. Categories include music, dance, drama, and literary events. Interested students should register at the cultural office by March 15.",
    category: "event",
    priority: "medium",
    date: new Date().toISOString().split('T')[0],
    author: "Cultural Committee",
    attachments: ["audition_schedule.pdf", "event_categories.pdf"],
    isActive: true
  },
  {
    id: uuidv4(),
    title: "Sports Meet Registration",
    content: "Annual sports meet registration is now open. Events include athletics, team sports, and individual competitions. Last date for registration: March 22, 2024. Physical fitness certificate required.",
    category: "event",
    priority: "low",
    date: new Date().toISOString().split('T')[0],
    author: "Sports Department",
    attachments: ["sports_events.pdf", "medical_form.pdf"],
    isActive: true
  },
  
  // Urgent Notices
  {
    id: uuidv4(),
    title: "Campus Maintenance Work",
    content: "There will be maintenance work in the main academic block from March 5-7, 2024. Students are requested to use alternate routes and cooperate with the maintenance staff. Some classes may be relocated.",
    category: "urgent",
    priority: "high",
    date: new Date().toISOString().split('T')[0],
    author: "Admin Department",
    attachments: ["maintenance_schedule.pdf", "alternate_routes.pdf"],
    isActive: true
  },
  {
    id: uuidv4(),
    title: "Emergency Contact Numbers Update",
    content: "All students are requested to update their emergency contact numbers in the student portal. This information is crucial for campus safety. Please verify your details by March 30, 2024.",
    category: "urgent",
    priority: "high",
    date: new Date().toISOString().split('T')[0],
    author: "Security Office",
    attachments: ["contact_update_form.pdf"],
    isActive: true
  },
  
  // General Notices
  {
    id: uuidv4(),
    title: "Campus WiFi Password Update",
    content: "The campus WiFi password has been updated for security purposes. New passwords are available at the IT helpdesk. Please update your devices with the new credentials.",
    category: "general",
    priority: "low",
    date: new Date().toISOString().split('T')[0],
    author: "IT Department",
    attachments: ["wifi_guide.pdf"],
    isActive: true
  },
  {
    id: uuidv4(),
    title: "Student ID Card Renewal",
    content: "Student ID cards expiring in March 2024 should be renewed by March 25, 2024. Visit the student services office with your old ID card and a recent photograph. Processing time: 2-3 working days.",
    category: "general",
    priority: "medium",
    date: new Date().toISOString().split('T')[0],
    author: "Student Services",
    attachments: ["renewal_form.pdf", "photo_requirements.pdf"],
    isActive: true
  },
  {
    id: uuidv4(),
    title: "Cafeteria Menu Update",
    content: "The cafeteria menu has been updated with new healthy options and extended operating hours. New timings: 7:00 AM to 9:00 PM. Feedback forms available at the counter.",
    category: "general",
    priority: "low",
    date: new Date().toISOString().split('T')[0],
    author: "Cafeteria Management",
    attachments: ["new_menu.pdf", "feedback_form.pdf"],
    isActive: true
  },
  
  // Internship & Career Notices
  {
    id: uuidv4(),
    title: "Internship Opportunity - Tech Giants",
    content: "Multiple internship opportunities are available with leading tech companies. Interested students should submit their resumes to the placement cell by March 10, 2024. Eligibility: 3rd and 4th year students with CGPA > 7.5.",
    category: "career",
    priority: "medium",
    date: new Date().toISOString().split('T')[0],
    author: "Placement Cell",
    attachments: ["company_list.pdf", "application_form.pdf", "resume_template.pdf"],
    isActive: true
  },
  {
    id: uuidv4(),
    title: "Career Counseling Session",
    content: "Free career counseling sessions will be conducted by industry experts on March 28, 2024. Topics include resume building, interview preparation, and career planning. Registration required.",
    category: "career",
    priority: "medium",
    date: new Date().toISOString().split('T')[0],
    author: "Career Development Center",
    attachments: ["session_schedule.pdf", "registration_form.pdf"],
    isActive: true
  },
  
  // Research & Innovation Notices
  {
    id: uuidv4(),
    title: "Research Paper Competition",
    content: "Annual research paper competition is now open for submissions. Categories: Computer Science, Electronics, Mechanical, and Civil Engineering. Cash prizes worth ₹50,000. Deadline: April 15, 2024.",
    category: "research",
    priority: "medium",
    date: new Date().toISOString().split('T')[0],
    author: "Research Committee",
    attachments: ["competition_guidelines.pdf", "submission_form.pdf", "format_template.pdf"],
    isActive: true
  },
  {
    id: uuidv4(),
    title: "Innovation Lab Access",
    content: "The innovation lab is now open for student projects. Equipment available: 3D printers, Arduino kits, robotics components. Book your slot through the online portal. Safety training mandatory.",
    category: "research",
    priority: "low",
    date: new Date().toISOString().split('T')[0],
    author: "Innovation Center",
    attachments: ["lab_equipment_list.pdf", "booking_form.pdf", "safety_guidelines.pdf"],
    isActive: true
  }
];

// Function to get random notices for the day
const getRandomNotices = (count = 8) => {
  const shuffled = [...sampleNotices].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Function to get notices by category
const getNoticesByCategory = (category) => {
  if (category === 'all') {
    return sampleNotices;
  }
  return sampleNotices.filter(notice => notice.category === category);
};

// Function to get notices by priority
const getNoticesByPriority = (priority) => {
  return sampleNotices.filter(notice => notice.priority === priority);
};

// GET /api/notices - Get all notices (with optional filtering)
router.get('/', (req, res) => {
  try {
    const { category, priority, limit, search } = req.query;
    
    let filteredNotices = [...sampleNotices];
    
    // Filter by category
    if (category && category !== 'all') {
      filteredNotices = filteredNotices.filter(notice => notice.category === category);
    }
    
    // Filter by priority
    if (priority) {
      filteredNotices = filteredNotices.filter(notice => notice.priority === priority);
    }
    
    // Search functionality
    if (search) {
      const searchLower = search.toLowerCase();
      filteredNotices = filteredNotices.filter(notice => 
        notice.title.toLowerCase().includes(searchLower) ||
        notice.content.toLowerCase().includes(searchLower) ||
        notice.author.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply limit
    if (limit) {
      filteredNotices = filteredNotices.slice(0, parseInt(limit));
    }
    
    // Sort by priority and date
    filteredNotices.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return new Date(b.date) - new Date(a.date);
    });
    
    res.json({
      success: true,
      notices: filteredNotices,
      total: filteredNotices.length,
      categories: ['academic', 'event', 'urgent', 'general', 'career', 'research'],
      priorities: ['high', 'medium', 'low']
    });
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/notices/random - Get random daily notices
router.get('/random', (req, res) => {
  try {
    const { count = 8 } = req.query;
    const randomNotices = getRandomNotices(parseInt(count));
    
    res.json({
      success: true,
      notices: randomNotices,
      total: randomNotices.length,
      message: 'Random daily notices fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching random notices:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/notices/category/:category - Get notices by category
router.get('/category/:category', (req, res) => {
  try {
    const { category } = req.params;
    const categoryNotices = getNoticesByCategory(category);
    
    res.json({
      success: true,
      notices: categoryNotices,
      total: categoryNotices.length,
      category: category
    });
  } catch (error) {
    console.error('Error fetching category notices:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/notices/priority/:priority - Get notices by priority
router.get('/priority/:priority', (req, res) => {
  try {
    const { priority } = req.params;
    const priorityNotices = getNoticesByPriority(priority);
    
    res.json({
      success: true,
      notices: priorityNotices,
      total: priorityNotices.length,
      priority: priority
    });
  } catch (error) {
    console.error('Error fetching priority notices:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/notices/search - Search notices
router.get('/search', (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    const searchResults = sampleNotices.filter(notice => {
      const searchLower = q.toLowerCase();
      return notice.title.toLowerCase().includes(searchLower) ||
             notice.content.toLowerCase().includes(searchLower) ||
             notice.author.toLowerCase().includes(searchLower) ||
             notice.category.toLowerCase().includes(searchLower);
    });
    
    res.json({
      success: true,
      notices: searchResults,
      total: searchResults.length,
      query: q
    });
  } catch (error) {
    console.error('Error searching notices:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/notices/stats - Get notice statistics
router.get('/stats', (req, res) => {
  try {
    const stats = {
      total: sampleNotices.length,
      byCategory: {
        academic: sampleNotices.filter(n => n.category === 'academic').length,
        event: sampleNotices.filter(n => n.category === 'event').length,
        urgent: sampleNotices.filter(n => n.category === 'urgent').length,
        general: sampleNotices.filter(n => n.category === 'general').length,
        career: sampleNotices.filter(n => n.category === 'career').length,
        research: sampleNotices.filter(n => n.category === 'research').length
      },
      byPriority: {
        high: sampleNotices.filter(n => n.priority === 'high').length,
        medium: sampleNotices.filter(n => n.priority === 'medium').length,
        low: sampleNotices.filter(n => n.priority === 'low').length
      },
      recent: sampleNotices.filter(n => {
        const noticeDate = new Date(n.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return noticeDate >= weekAgo;
      }).length
    };
    
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error fetching notice stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
