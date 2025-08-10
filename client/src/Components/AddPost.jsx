// import React, { useState } from 'react';
// import { toast } from 'react-toastify';
// import { buildApiUrl } from '../config/api';
// import axios from 'axios';

// const AddPost = ({ onPostAdded }) => {
//   const [formData, setFormData] = useState({
//     title: '',
//     content: '',
//     image: null
//   });
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [previewImage, setPreviewImage] = useState(null);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setFormData(prev => ({ ...prev, image: file }));
      
//       // Create preview
//       const reader = new FileReader();
//       reader.onload = () => {
//         setPreviewImage(reader.result);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!formData.title.trim() || !formData.content.trim()) {
//       toast.error('Please fill in both title and content');
//       return;
//     }

//     setIsSubmitting(true);
    
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         toast.error('Please login to create a post');
//         return;
//       }

//       const postData = new FormData();
//       postData.append('title', formData.title.trim());
//       postData.append('content', formData.content.trim());
//       if (formData.image) {
//         postData.append('image', formData.image);
//       }

//       const response = await axios.post(buildApiUrl('/api/posts'), postData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//           'Authorization': `Bearer ${token}`
//         }
//       });

//       if (response.data.success) {
//         toast.success('Post created successfully!');
//         setFormData({ title: '', content: '', image: null });
//         setPreviewImage(null);
//         if (onPostAdded) {
//           onPostAdded();
//         }
//       } else {
//         toast.error(response.data.message || 'Failed to create post');
//       }
//     } catch (error) {
//       console.error('Error creating post:', error);
//       toast.error(error.response?.data?.message || 'Failed to create post');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const clearForm = () => {
//     setFormData({ title: '', content: '', image: null });
//     setPreviewImage(null);
//   };

//   return (
//     <div className="bg-white rounded-lg shadow-md p-6">
//       <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Post</h2>
      
//       <form onSubmit={handleSubmit} className="space-y-4">
//         {/* Title Input */}
//         <div>
//           <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
//             Title
//           </label>
//           <input
//             type="text"
//             id="title"
//             name="title"
//             value={formData.title}
//             onChange={handleChange}
//             placeholder="What's on your mind?"
//             className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             required
//           />
//         </div>

//         {/* Content Input */}
//         <div>
//           <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
//             Content
//           </label>
//           <textarea
//             id="content"
//             name="content"
//             value={formData.content}
//             onChange={handleChange}
//             placeholder="Share your thoughts..."
//             rows="4"
//             className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
//             required
//           />
//         </div>

//         {/* Image Upload */}
//         <div>
//           <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
//             Image (Optional)
//           </label>
//           <input
//             type="file"
//             id="image"
//             name="image"
//             accept="image/*"
//             onChange={handleImageChange}
//             className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           />
//         </div>

//         {/* Image Preview */}
//         {previewImage && (
//           <div className="mt-2">
//             <img 
//               src={previewImage} 
//               alt="Preview" 
//               className="w-32 h-32 object-cover rounded-lg border"
//             />
//           </div>
//         )}

//         {/* Action Buttons */}
//         <div className="flex justify-end space-x-3 pt-4">
//           <button
//             type="button"
//             onClick={clearForm}
//             className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
//             disabled={isSubmitting}
//           >
//             Clear
//           </button>
//           <button
//             type="submit"
//             disabled={isSubmitting}
//             className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {isSubmitting ? 'Creating...' : 'Create Post'}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default AddPost;



import { useState } from 'react';
import axios from 'axios';
import {jwtDecode} from 'jwt-decode';
import { toast } from 'react-toastify';
import BASE_API from '../api.js';
import { useNavigate } from 'react-router-dom';

const AddPostForm = () => 
{
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  const token = localStorage.getItem('token');
  const userData = jwtDecode(token);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handlePost = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('image', image);
      formData.append('email', userData.email);
      formData.append('username', userData.username);

      // await axios.post(`${BASE_API}/post`, formData, {
        await axios.post(`http://localhost:7071/api/post`, formData, {
        //http://localhost:7071
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success('Posted Successfully');
      setTimeout(() => {
        navigate('/');
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error posting:', error);
      toast.error('Error posting. Please try again.');
    }
  };

  return (
<div className="flex justify-center mt-8 w-full p-8 rounded-lg shadow-lg">
  <div className="flex justify-center gap-8 flex-wrap items-center w-full max-w-screen-lg bg-white p-8 rounded-lg shadow-lg">
    <div className="w-1/2 min-w-[400px] p-4 bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Add Post</h2>
      <form className="space-y-6" onSubmit={handlePost}>
        <label className="block">
          <span className="text-lg font-semibold text-gray-700">Title </span>
          <span className="text-gray-500">(max 50 words):</span>
          <input
            type="text"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50 text-gray-800 bg-white p-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength="50"
            required
          />
        </label>
        <label className="block">
          <span className="text-lg font-semibold text-gray-700">Content </span>
          <span className="text-gray-500">(max 800 words):</span>
          <textarea
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50 text-gray-800 bg-white p-2"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength="800"
            minLength="30"
            required
          ></textarea>
        </label>
        <label className="block">
          <span className="text-lg font-semibold text-gray-700">Image </span>
          <span className="text-gray-500">(optional)</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-1 block w-full text-gray-800 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-teal-500 hover:file:bg-purple-100 p-2"
          />
        </label>
        <button
          type="submit"
          className="mt-6 w-full btn btn-sm btn-accent text-white font-semibold py-2 rounded-mdtransition duration-200"
        >
         Add Post
        </button>
      </form>
    </div>
    <div className="w-2/5 min-w-[400px] p-4 bg-gray-100 rounded-lg shadow-md">
      <div className="border border-gray-300 rounded-lg p-4">
        <h3 className="text-lg font-bold mb-2 text-center text-gray-800">Preview:</h3>
        {title && <h4 className="text-xl font-semibold mb-2 text-gray-700">{title}</h4>}
        {image && <img src={previewImage} alt="Preview" className="max-w-full h-auto mb-4 rounded-lg shadow-lg" />}
        {content && (
          <p className="text-gray-700">
            {content.substring(0, 300)}{content.length > 300 && '...'}
          </p>
        )}
      </div>
    </div>
  </div>
</div>


  );
};

export default AddPostForm;