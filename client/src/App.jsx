
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import { useState } from 'react';

import Navbar from './Components/Navbar';
import Feed from './Pages/Feed';
import Events from './Pages/Events';
import Academics from './Pages/Academics';
import Notices from './Pages/Notices';
import Account from './Pages/Account';
import AddPostForm from './Pages/AddPost';
import EventForm from './Components/EventForm';
import MessageSection from './Pages/MessageSection/Message';
import OnlineClasses from './Pages/OnlineClasses';
import VideoCall from './Components/VideoCall';
import AIChatbot from './Components/AIChatbot';
import PushNotifications from './Components/PushNotifications';
import { jwtDecode } from 'jwt-decode';
import SignupForm from '../src/Components/SignupForm';
import LoginForm from '../src/Components/Login';
import QuizPlatform from './Components/QuizPlatform';
import CodeEditor from './Components/CodeEditor';
import ChatSystem from './Components/ChatSystem';

function App() {
  const [showChatbot, setShowChatbot] = useState(false);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10 animate-gradient bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 bg-[length:400%_400%]" />

      <Router>
        <Navbar />
        <div className="content relative px-4 py-6">
          <ToastContainer />
          <Routes>

            <Route path="/" element={<Feed />} />
            <Route path="/signup" element={<SignupForm />} /> {/* ✅ Signup route */}
            <Route path="/login" element={<LoginForm />} /> {/* ✅ Signup route */}
            <Route path="/events" element={<Events />} />
            
            <Route path="/notices" element={<Notices />} />
            
            <Route path="/academics" element={<Academics />} />
            <Route path="/notices" element={<Notices />} />
            <Route path="/online-classes" element={<OnlineClasses />} />
            <Route path="/video-call" element={<VideoCall />} />
            <Route path="/account/:id" element={<Account />} />
            {/* Convenience routes for current user */}
            <Route path="/profile" element={<RedirectToMyAccount />} />
            <Route path="/account" element={<RedirectToMyAccount />} />
            <Route path="/addpost" element={<AddPostForm />} />
            <Route path="/addEvent" element={<EventForm />} />
            <Route path="/message/:recieverId" element={<MessageSection />} />
            {/* Tools */}
            <Route path="/ai-chatbot" element={<AIChatbot />} />
            <Route path="/notifications" element={<PushNotifications />} />
            <Route path="/quiz" element={<QuizPlatform />} />
            <Route path="/code-editor" element={<CodeEditor />} />
            <Route path="/chat" element={<ChatSystem />} />
          </Routes>
        </div>
      </Router>

      {/* Floating AI Chatbot Button */}
      <button
        onClick={() => setShowChatbot(!showChatbot)}
        className="fixed bottom-6 left-6 z-40 p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        title="AI Study Assistant"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
        </svg>
      </button>

      {/* AI Chatbot */}
      {showChatbot && (
        <AIChatbot onClose={() => setShowChatbot(false)} />
      )}
    </div>
  );
}

export default App;

// Helper component to redirect to the logged-in user's account page
function RedirectToMyAccount() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return <LoginForm />;
    }
    const decoded = jwtDecode(token);
    const email = decoded?.email;
    if (!email) {
      return <LoginForm />;
    }
    window.location.replace(`/account/${encodeURIComponent(email)}`);
    return null;
  } catch (e) {
    return <LoginForm />;
  }
}
