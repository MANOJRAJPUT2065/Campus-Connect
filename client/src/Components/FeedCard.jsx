/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import FeedCardRight from './CommentSection';
import FeedCardLeft from './FeedCardLeft.jsx';
import { buildApiUrl } from '../config/api';

const FeedCard = ({ post, onPostUpdated }) => {
  const navigate = useNavigate();
  const [authorPic, setAuthorPic] = useState('');
  const [comment, setComment] = useState('');
  const [key, setKey] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Extract post data
  const { _id: postId, title, content, image, author, username, createdAt } = post || {};

  const handleLike = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You need to be logged in to like a post');
      return;
    }
    const data = jwtDecode(token);
    const userEmail = data.email;
    try {
      await axios.post(buildApiUrl('/api/likes/like'), { postId, userEmail: userEmail });
      setIsLiked(true);
      setLikes(prevLikes => prevLikes + 1);
      if (onPostUpdated) onPostUpdated();
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
    }
  };

  const handleUnlike = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You need to be logged in to unlike a post');
      return;
    }
    const data = jwtDecode(token);
    const userEmail = data.email;
    try {
      await axios.post(buildApiUrl('/api/likes/unlike'), { postId, userEmail: userEmail });
      setIsLiked(false);
      setLikes(prevLikes => prevLikes - 1);
      if (onPostUpdated) onPostUpdated();
    } catch (error) {
      console.error('Error unliking post:', error);
      toast.error('Failed to unlike post');
    }
  };

  const handleBookmark = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You need to be logged in to bookmark a post');
      return;
    }
    const data = jwtDecode(token);
    const userEmail = data.email;
    try {
      const bookmarks = await axios.get(buildApiUrl(`/api/bookmarks/check?postId=${postId}&userEmail=${userEmail}`));
      const bookmarkedPost = bookmarks.data.bookmarked;
      if (bookmarkedPost) {
        await axios.delete(buildApiUrl('/api/bookmarks/remove'), { data: { postId, userEmail: userEmail } });
        setIsBookmarked(false);
      } else {
        await axios.post(buildApiUrl('/api/bookmarks/add'), { postId, userEmail: userEmail });
        setIsBookmarked(true);
      }
      if (onPostUpdated) onPostUpdated();
    } catch (error) {
      console.error('Error bookmarking:', error);
      toast.error('Failed to bookmark post');
    }
  };

  useEffect(() => {
    const checkLikeStatus = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }
      const data = jwtDecode(token);
      const userEmail = data.email;
      try {
        const likes = await axios.get(buildApiUrl(`/api/likes/getLikes?postId=${postId}`));
        const isLikedByUser = likes.data.some(like => like.userEmail === userEmail);
        setIsLiked(isLikedByUser);
        setLikes(likes.data.length);
      } catch (error) {
        console.error('Error fetching likes:', error);
      }
    };

    const checkBookmarkStatus = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }
      const data = jwtDecode(token);
      const userEmail = data.email;
      try {
        const bookmarks = await axios.get(buildApiUrl(`/api/bookmarks/check?postId=${postId}&userEmail=${userEmail}`));
        setIsBookmarked(bookmarks.data.bookmarked);
      } catch (error) {
        console.error('Error fetching bookmark status:', error);
      }
    };

    if (postId) {
      checkLikeStatus();
      checkBookmarkStatus();
    }
  }, [postId]);

  useEffect(() => {
    const fetchAuthorPic = async () => {
      if (author) {
        try {
          const response = await axios.get(buildApiUrl(`/api/auth/getUserDetails?email=${author}`));
          setAuthorPic(response.data.profilePicUrl);
        } catch (error) {
          console.error('Error fetching author pic:', error);
        }
      }
    };

    fetchAuthorPic();
  }, [author]);

  if (!post) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* Post Header */}
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
          <img 
            src={authorPic || '/default-avatar.png'} 
            alt="Author" 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = '/default-avatar.png';
            }}
          />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{username || author}</h3>
          <p className="text-sm text-gray-500">
            {new Date(createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-700 leading-relaxed">{content}</p>
        {image && (
          <div className="mt-4">
            <img 
              src={image} 
              alt="Post" 
              className="w-full h-auto rounded-lg max-h-96 object-cover"
            />
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={isLiked ? handleUnlike : handleLike}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              isLiked 
                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>{isLiked ? '❤️' : '🤍'}</span>
            <span>{likes} {likes === 1 ? 'like' : 'likes'}</span>
          </button>

          <button
            onClick={handleBookmark}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              isBookmarked 
                ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>{isBookmarked ? '🔖' : '📖'}</span>
            <span>Bookmark</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <FeedCardLeft postId={postId} />
          <FeedCardRight postId={postId} />
        </div>
      </div>
    </div>
  );
};

export default FeedCard;
