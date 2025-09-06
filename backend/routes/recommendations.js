import express from 'express';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import Event from '../models/Event.js';
import Post from '../models/Post.js';
import User from '../models/User.js';

dotenv.config();

const router = express.Router();

let openai = null;
let gemini = null;
const AI_PROVIDER = process.env.AI_PROVIDER || 'openai';

// Initialize AI providers
if (AI_PROVIDER === 'openai' && process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  console.log('✅ OpenAI configured for recommendations');
} else if (AI_PROVIDER === 'gemini' && process.env.GEMINI_API_KEY) {
  gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log('✅ Gemini configured for recommendations');
}

// Get personalized recommendations for a user
router.get('/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { limit = 5 } = req.query;

    // Get user's interests and activity
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Get user's recent posts and interactions
    const userPosts = await Post.find({ author: email })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get upcoming events
    const upcomingEvents = await Event.find({
      startTime: { $gte: new Date() }
    }).sort({ startTime: 1 }).limit(20);

    // Get popular posts
    const popularPosts = await Post.find()
      .sort({ likes: -1, createdAt: -1 })
      .limit(10);

    // Analyze user interests using AI
    const userInterests = await analyzeUserInterests(userPosts, user);
    
    // Generate recommendations
    const recommendations = await generateRecommendations(
      userInterests,
      upcomingEvents,
      popularPosts,
      parseInt(limit)
    );

    res.json({
      success: true,
      recommendations,
      userInterests,
      totalFound: recommendations.length
    });

  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate recommendations' 
    });
  }
});

// Get event recommendations based on interests
router.get('/events', async (req, res) => {
  try {
    const { interests, subject, tags, limit = 10 } = req.query;
    
    let query = { startTime: { $gte: new Date() } };
    
    if (subject) query.subject = { $regex: subject, $options: 'i' };
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    let events = await Event.find(query)
      .sort({ startTime: 1 })
      .limit(parseInt(limit) * 2); // Get more to filter

    if (interests) {
      const interestArray = interests.split(',').map(interest => interest.trim());
      events = events.filter(event => {
        const eventText = `${event.title} ${event.description} ${event.subject} ${event.tags.join(' ')}`.toLowerCase();
        return interestArray.some(interest => 
          eventText.includes(interest.toLowerCase())
        );
      });
    }

    // Limit results
    events = events.slice(0, parseInt(limit));

    res.json({
      success: true,
      events,
      totalFound: events.length
    });

  } catch (error) {
    console.error('Event recommendations error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get event recommendations' 
    });
  }
});

// Get study group recommendations
router.get('/study-groups', async (req, res) => {
  try {
    const { subject, level, interests, limit = 5 } = req.query;
    
    // This would integrate with a study group system
    // For now, we'll return mock recommendations
    const mockStudyGroups = [
      {
        id: 'sg1',
        name: 'Advanced Coding Workshop',
        subject: 'Programming',
        level: 'Intermediate',
        members: 12,
        maxMembers: 20,
        meetingTime: 'Every Saturday 2 PM',
        description: 'Deep dive into advanced programming concepts and projects',
        tags: ['coding', 'programming', 'projects', 'workshop']
      },
      {
        id: 'sg2',
        name: 'Data Science Study Group',
        subject: 'Data Science',
        level: 'Beginner',
        members: 8,
        maxMembers: 15,
        meetingTime: 'Every Sunday 10 AM',
        description: 'Learn data science fundamentals and practical applications',
        tags: ['data-science', 'python', 'statistics', 'machine-learning']
      }
    ];

    let filteredGroups = mockStudyGroups;

    if (subject) {
      filteredGroups = filteredGroups.filter(group => 
        group.subject.toLowerCase().includes(subject.toLowerCase())
      );
    }

    if (level) {
      filteredGroups = filteredGroups.filter(group => 
        group.level.toLowerCase() === level.toLowerCase()
      );
    }

    if (interests) {
      const interestArray = interests.split(',').map(interest => interest.trim());
      filteredGroups = filteredGroups.filter(group => {
        const groupText = `${group.name} ${group.description} ${group.tags.join(' ')}`.toLowerCase();
        return interestArray.some(interest => 
          groupText.includes(interest.toLowerCase())
        );
      });
    }

    filteredGroups = filteredGroups.slice(0, parseInt(limit));

    res.json({
      success: true,
      studyGroups: filteredGroups,
      totalFound: filteredGroups.length
    });

  } catch (error) {
    console.error('Study group recommendations error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get study group recommendations' 
    });
  }
});

// Get personalized content recommendations
router.get('/content', async (req, res) => {
  try {
    const { email, type = 'all', limit = 10 } = req.query;
    
    let recommendations = [];

    if (type === 'all' || type === 'posts') {
      // Get posts based on user's interests
      const userPosts = await Post.find({ author: email })
        .sort({ createdAt: -1 })
        .limit(5);

      if (userPosts.length > 0) {
        const userInterests = await analyzeUserInterests(userPosts, { email });
        const relevantPosts = await Post.find({
          author: { $ne: email },
          $or: [
            { title: { $regex: userInterests.join('|'), $options: 'i' } },
            { content: { $regex: userInterests.join('|'), $options: 'i' } }
          ]
        })
        .sort({ likes: -1, createdAt: -1 })
        .limit(parseInt(limit));

        recommendations.push(...relevantPosts.map(post => ({
          type: 'post',
          id: post._id,
          title: post.title,
          content: post.content.substring(0, 150) + '...',
          author: post.username,
          likes: post.likes,
          relevance: 'high'
        })));
      }
    }

    if (type === 'all' || type === 'events') {
      // Get relevant events
      const upcomingEvents = await Event.find({
        startTime: { $gte: new Date() }
      })
      .sort({ startTime: 1 })
      .limit(parseInt(limit));

      recommendations.push(...upcomingEvents.map(event => ({
        type: 'event',
        id: event._id,
        title: event.title,
        description: event.description,
        startTime: event.startTime,
        subject: event.subject,
        relevance: 'medium'
      })));
    }

    // Sort by relevance and limit
    recommendations = recommendations
      .sort((a, b) => {
        const relevanceOrder = { high: 3, medium: 2, low: 1 };
        return relevanceOrder[b.relevance] - relevanceOrder[a.relevance];
      })
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      recommendations,
      totalFound: recommendations.length
    });

  } catch (error) {
    console.error('Content recommendations error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get content recommendations' 
    });
  }
});

// Helper function to analyze user interests
async function analyzeUserInterests(posts, user) {
  try {
    if (!openai && !gemini) {
      // Fallback: extract basic interests from post content
      const allText = posts.map(post => `${post.title} ${post.content}`).join(' ');
      const commonWords = allText.toLowerCase()
        .match(/\b\w+\b/g)
        .filter(word => word.length > 3)
        .filter(word => !['this', 'that', 'with', 'have', 'will', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'very', 'when', 'been', 'have', 'will', 'that', 'this', 'your', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'very', 'when', 'been', 'have', 'will', 'that', 'this', 'your'].includes(word));
      
      const wordCount = {};
      commonWords.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });
      
      return Object.entries(wordCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([word]) => word);
    }

    const postContent = posts.map(post => `${post.title}: ${post.content}`).join('\n');
    
    const prompt = `Analyze the following user posts and extract 5-7 key interests or topics. Focus on academic subjects, hobbies, skills, or activities mentioned. Return only a comma-separated list of interests:

Posts:
${postContent}

Interests:`;

    let interests = [];

    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100,
          temperature: 0.3
        });
        
        interests = completion.choices[0]?.message?.content
          .split(',')
          .map(interest => interest.trim())
          .filter(interest => interest.length > 0);
      } catch (error) {
        console.error('OpenAI analysis failed:', error);
      }
    }

    if (gemini && interests.length === 0) {
      try {
        const model = gemini.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-pro' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        interests = text
          .split(',')
          .map(interest => interest.trim())
          .filter(interest => interest.length > 0);
      } catch (error) {
        console.error('Gemini analysis failed:', error);
      }
    }

    // Fallback if AI analysis fails
    if (interests.length === 0) {
      interests = ['technology', 'education', 'learning', 'academics', 'events'];
    }

    return interests;

  } catch (error) {
    console.error('Interest analysis error:', error);
    return ['technology', 'education', 'learning', 'academics', 'events'];
  }
}

// Helper function to generate recommendations
async function generateRecommendations(userInterests, events, posts, limit) {
  const recommendations = [];

  // Add relevant events
  events.forEach(event => {
    const eventText = `${event.title} ${event.description} ${event.subject} ${event.tags.join(' ')}`.toLowerCase();
    const relevance = userInterests.filter(interest => 
      eventText.includes(interest.toLowerCase())
    ).length;
    
    if (relevance > 0) {
      recommendations.push({
        type: 'event',
        id: event._id,
        title: event.title,
        description: event.description,
        startTime: event.startTime,
        subject: event.subject,
        relevance: relevance,
        score: relevance * 10 + (event.startTime - new Date()) / (1000 * 60 * 60 * 24) // Higher score for more relevant and sooner events
      });
    }
  });

  // Add relevant posts
  posts.forEach(post => {
    const postText = `${post.title} ${post.content}`.toLowerCase();
    const relevance = userInterests.filter(interest => 
      postText.includes(interest.toLowerCase())
    ).length;
    
    if (relevance > 0) {
      recommendations.push({
        type: 'post',
        id: post._id,
        title: post.title,
        content: post.content.substring(0, 150) + '...',
        author: post.username,
        likes: post.likes,
        relevance: relevance,
        score: relevance * 10 + post.likes * 2 + (new Date() - post.createdAt) / (1000 * 60 * 60 * 24) // Higher score for more relevant, popular, and recent posts
      });
    }
  });

  // Sort by score and return top recommendations
  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export default router;
