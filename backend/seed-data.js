import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Post from './models/Post.js';
import Event from './models/Event.js';
import User from './models/User.js';
import bcrypt from 'bcrypt';

dotenv.config();

const SAMPLE_POSTS = [
  {
    title: 'Welcome to Campus Connect!',
    content: 'This is the first post on our new platform. Feel free to share your thoughts, updates, and connect with your classmates!',
    author: 'admin@university.edu',
    username: 'Admin User',
    image: null
  },
  {
    title: 'Study Tips for Exams',
    content: 'Here are some effective study strategies: 1) Break your study sessions into 25-30 minute chunks (Pomodoro Technique), 2) Create mind maps for complex topics, 3) Practice with previous year papers, 4) Form study groups with classmates.',
    author: 'student1@university.edu',
    username: 'John Doe',
    image: null
  },
  {
    title: 'Campus Event This Friday',
    content: 'Don\'t forget about the tech symposium happening this Friday at the auditorium! There will be talks from industry experts, networking sessions, and refreshments. Registration is free!',
    author: 'events@university.edu',
    username: 'Events Team',
    image: null
  },
  {
    title: 'JavaScript ES6 Features',
    content: 'Understanding arrow functions, destructuring, and spread operators can significantly improve your code quality. These modern JavaScript features make code more readable and concise. Let\'s discuss best practices!',
    author: 'instructor@university.edu',
    username: 'Prof. Smith',
    image: null
  },
  {
    title: 'How to ace your first internship',
    content: 'Tips from my experience: Be proactive, ask meaningful questions, deliver quality work, build relationships, and document everything you learn. The summer can be a game-changer for your career!',
    author: 'alumni@university.edu',
    username: 'Alumni Success',
    image: null
  }
];

const SAMPLE_EVENTS = [
  {
    title: 'Introduction to Computer Science',
    instructor: 'Dr. Sarah Johnson',
    time: '10:00 AM - 11:30 AM',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    duration: '90 min',
    participants: 24,
    maxParticipants: 50,
    status: 'upcoming',
    description: 'An introductory course covering fundamental concepts of computer science, algorithms, and data structures.'
  },
  {
    title: 'Advanced Web Development with React',
    instructor: 'Prof. Michael Chen',
    time: '2:00 PM - 3:30 PM',
    date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    duration: '90 min',
    participants: 18,
    maxParticipants: 40,
    status: 'upcoming',
    description: 'Deep dive into React.js with hooks, context API, and performance optimization techniques.'
  },
  {
    title: 'Database Design Fundamentals',
    instructor: 'Dr. Emily Davis',
    time: '4:00 PM - 5:00 PM',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    duration: '60 min',
    participants: 22,
    maxParticipants: 35,
    status: 'upcoming',
    description: 'Learn about relational and non-relational databases, normalization, and query optimization.'
  },
  {
    title: 'Cloud Computing with AWS',
    instructor: 'Dr. Alex Rodriguez',
    time: '11:00 AM - 12:30 PM',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    duration: '90 min',
    participants: 15,
    maxParticipants: 50,
    status: 'upcoming',
    description: 'Introduction to AWS services: EC2, S3, Lambda, and RDS. Hands-on lab included.'
  },
  {
    title: 'Machine Learning Basics',
    instructor: 'Prof. Lisa Wang',
    time: '3:00 PM - 4:30 PM',
    date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    duration: '90 min',
    participants: 30,
    maxParticipants: 45,
    status: 'upcoming',
    description: 'Fundamentals of ML: supervised learning, unsupervised learning, and model evaluation.'
  }
];

const SAMPLE_USERS = [
  {
    username: 'Dr. Sarah Johnson',
    usn: 'teacher001',
    email: 'sarah.johnson@university.edu',
    password: 'teacher123',
    role: 'teacher',
    department: 'Computer Science'
  },
  {
    username: 'Prof. Michael Chen',
    usn: 'teacher002',
    email: 'michael.chen@university.edu',
    password: 'teacher123',
    role: 'teacher',
    department: 'Mathematics'
  },
  {
    username: 'Club Coordinator',
    usn: 'coord001',
    email: 'coordinator@university.edu',
    password: 'coord123',
    role: 'coordinator',
    department: 'Student Affairs'
  },
  {
    username: 'Tech Club Lead',
    usn: 'coord002',
    email: 'techclub@university.edu',
    password: 'coord123',
    role: 'coordinator',
    department: 'Clubs & Societies'
  },
  {
    username: 'John Doe',
    usn: 'cs20001',
    email: 'john.doe@university.edu',
    password: 'student123',
    role: 'student',
    semester: 3,
    department: 'Computer Science'
  },
  {
    username: 'Jane Smith',
    usn: 'cs20002',
    email: 'jane.smith@university.edu',
    password: 'student123',
    role: 'student',
    semester: 4,
    department: 'Computer Science'
  },
  {
    username: 'Alex Kumar',
    usn: 'ec20001',
    email: 'alex.kumar@university.edu',
    password: 'student123',
    role: 'student',
    semester: 2,
    department: 'Electronics'
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus-connect', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      Post.deleteMany({}),
      Event.deleteMany({}),
      User.deleteMany({})
    ]);
    console.log('🗑️  Cleared existing data');

    // Seed Users
    const hashedUsers = await Promise.all(
      SAMPLE_USERS.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 10)
      }))
    );
    await User.insertMany(hashedUsers);
    console.log(`✅ Seeded ${SAMPLE_USERS.length} users`);

    // Seed Posts
    await Post.insertMany(SAMPLE_POSTS);
    console.log(`✅ Seeded ${SAMPLE_POSTS.length} posts`);

    // Seed Events
    await Event.insertMany(SAMPLE_EVENTS);
    console.log(`✅ Seeded ${SAMPLE_EVENTS.length} events`);

    console.log('\n✨ Database seeding completed successfully!');
    console.log('\nSample user credentials:');
    console.log('📧 Email: admin@university.edu');
    console.log('🔐 Password: admin123');
    console.log('\nOther test accounts available with pattern: student1@university.edu, etc.');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run seeding
seedDatabase();
