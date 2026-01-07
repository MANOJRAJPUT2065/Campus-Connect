// Feed.js
import React, { useState, useEffect } from 'react';
import FeedCard from '../Components/FeedCard';
import AddPost from '../Components/AddPost';
import SessionJoin from '../Components/SessionJoin';
import { postsAPI } from '../services/api';
import { FaVideo } from 'react-icons/fa';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSessions, setShowSessions] = useState(true);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await postsAPI.getPosts();
      if (response && response.data) {
        setPosts(response.data);
        setError(null);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to load posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePostAdded = () => {
    fetchPosts(); // Refresh posts when a new post is added
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <p className="text-gray-500 text-sm mb-4">Make sure MongoDB is connected and the backend server is running.</p>
          <button 
            onClick={fetchPosts}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Live Sessions Section */}
        {showSessions && (
          <div className="mb-8 bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <FaVideo className="text-red-600 text-2xl animate-pulse" />
                <h2 className="text-2xl font-bold text-gray-900">Live Sessions</h2>
              </div>
              <button
                onClick={() => setShowSessions(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            <SessionJoin />
          </div>
        )}

        {/* Feed Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Campus Feed</h1>
          <p className="text-gray-600 text-sm">Student-only space. Share your experiences and connect with peers.</p>
        </div>

        {/* Add Post Section */}
        <div className="mb-8">
          <AddPost onPostAdded={handlePostAdded} />
        </div>

        {/* Posts Section */}
        <div className="space-y-6">
          {posts && posts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500 text-lg">📝 No posts yet. Be the first to share something!</p>
              <p className="text-gray-400 text-sm mt-2">Posts will appear here once created.</p>
            </div>
          ) : (
            (posts || []).map((post) => (
              <FeedCard 
                key={post._id} 
                post={post} 
                onPostUpdated={fetchPosts}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Feed;
