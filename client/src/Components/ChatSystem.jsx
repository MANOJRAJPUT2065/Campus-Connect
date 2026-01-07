import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  FaUsers,
  FaUserPlus,
  FaSearch,
  FaPaperPlane,
  FaSmile,
  FaImage,
  FaFile,
  FaPhone,
  FaVideo,
  FaInfoCircle,
} from "react-icons/fa";
import { toast } from "react-toastify";
import axios from "axios";
import { buildApiUrl } from "../config/api";
import { jwtDecode } from "jwt-decode";

const ChatSystem = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);

  // file upload
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // 🔹 Get current user from JWT
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const decoded = jwtDecode(token);
        setCurrentUser({
          id: decoded.email || decoded.usn,
          email: decoded.email,
          name: decoded.username || "User",
          role: decoded.role,
          avatar: `https://ui-avatars.com/api/?name=${decoded.username || "User"}&background=random`,
        });
        fetchChats(decoded.email || decoded.usn);
        fetchUsers();
      } else {
        toast.error("Please log in first");
      }
    } catch (error) {
      console.error("Error parsing token:", error);
      toast.error("Authentication error");
    }
  }, []);

  // 🔹 Fetch chats for current user
  const fetchChats = async (userId) => {
    try {
      const response = await fetch(buildApiUrl(`/api/messages/chats?userId=${userId}`), {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.ok) {
        const data = await response.json();
        setChats(Array.isArray(data) ? data : data.chats || []);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  };

  // 🔹 Fetch all users for starting new chat
  const fetchUsers = async () => {
    try {
      const response = await fetch(buildApiUrl("/api/users/all"), {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // 🔹 Load messages when chat is selected
  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat);
    }
  }, [selectedChat]);

  // 🔹 Fetch messages for selected chat
  const fetchMessages = async (chat) => {
    try {
      setLoading(true);
      const response = await fetch(
        buildApiUrl(`/api/messages/getMessages?senderId=${currentUser.id}&receiverId=${chat.participantId}`),
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(Array.isArray(data) ? data : data.messages || []);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔹 Send text message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !currentUser) return;

    try {
      setLoading(true);
      const response = await fetch(buildApiUrl("/api/messages/send"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId: selectedChat.participantId,
          message: newMessage,
        }),
      });

      if (response.ok) {
        const message = {
          senderId: currentUser.id,
          receiverId: selectedChat.participantId,
          message: newMessage,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, message]);
        setNewMessage("");
        toast.success("Message sent!");
      } else {
        toast.error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Error sending message");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Upload file (Cloudinary example)
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ml_default"); // replace with your preset
    const res = await axios.post(
      "https://api.cloudinary.com/v1_1/your_cloud_name/upload",
      formData
    );
    return res.data.secure_url;
  };

  const handleFileUploadEnhanced = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const url = await uploadToCloudinary(file);
      const message = {
        id: `msg${Date.now()}`,
        sender: currentUser?.id || "user1",
        senderName: currentUser?.name || "Current User",
        content: `File: ${file.name}`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        type: "file",
        file: { url, name: file.name },
      };
      setMessages((prev) => [...prev, message]);
      toast.success(`${file.name} uploaded!`);
    } catch (error) {
      toast.error("File upload failed!");
    }
    event.target.value = "";
  };

  const handleImageUploadEnhanced = async (event) => {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select an image");
      return;
    }

    try {
      const url = await uploadToCloudinary(file);
      const message = {
        id: `msg${Date.now()}`,
        sender: currentUser?.id || "user1",
        senderName: currentUser?.name || "Current User",
        content: url,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        type: "image",
      };
      setMessages((prev) => [...prev, message]);
      toast.success(`${file.name} uploaded!`);
    } catch (error) {
      toast.error("Image upload failed!");
    }
    event.target.value = "";
  };

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🔹 Start new chat
  const startNewChat = async (user) => {
    const newChat = {
      participantId: user.email,
      name: user.username,
      email: user.email,
      avatar: `https://ui-avatars.com/api/?name=${user.username}&background=random`,
      lastMessage: 'No messages yet',
      timestamp: new Date(),
      isGroup: false,
    };
    
    setSelectedChat(newChat);
    setShowNewChat(false);
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto h-screen flex">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h1 className="text-xl font-bold">Messages</h1>
            <button
              onClick={() => setShowNewChat(!showNewChat)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <FaUserPlus />
            </button>
          </div>

          {/* Search */}
          <div className="p-2">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          {/* Chat list */}
          <div className="flex-1 overflow-y-auto">
            {filteredChats.length > 0 ? (
              filteredChats.map((chat) => (
                <motion.div
                  key={chat.participantId || chat.id}
                  whileHover={{ backgroundColor: "#f9fafb" }}
                  onClick={() => setSelectedChat(chat)}
                  className={`p-4 border-b cursor-pointer ${
                    selectedChat?.participantId === chat.participantId ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={chat.avatar}
                      alt={chat.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{chat.name}</h3>
                      <p className="text-sm text-gray-600 truncate">
                        {chat.lastMessage}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No chats yet. Start a new conversation!
              </div>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat header */}
              <div className="p-4 border-b flex items-center justify-between bg-white">
                <div className="flex items-center space-x-3">
                  <img
                    src={selectedChat.avatar}
                    alt={selectedChat.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h2 className="font-semibold">
                      {selectedChat.name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedChat.isGroup
                        ? `${selectedChat.members.length} members`
                        : "Online"}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <FaPhone />
                  <FaVideo />
                  <FaInfoCircle />
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((msg, idx) => (
                    <motion.div
                      key={msg._id || idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${
                        msg.senderId === currentUser?.id
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`px-3 py-2 rounded-lg max-w-xs shadow ${
                          msg.senderId === currentUser?.id
                            ? "bg-blue-600 text-white"
                            : "bg-white text-black"
                        }`}
                      >
                        <p>{msg.message}</p>
                        <p className="text-xs text-right opacity-70 mt-1">
                          {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex justify-center items-center h-full text-gray-500">
                    No messages yet. Start the conversation!
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t bg-white flex items-center space-x-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <FaFile />
                </button>
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <FaImage />
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleSendMessage()
                  }
                  className="flex-1 border px-3 py-2 rounded-lg"
                />
                <button
                  onClick={handleSendMessage}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <FaPaperPlane />
                </button>
              </div>

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUploadEnhanced}
                className="hidden"
              />
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUploadEnhanced}
                className="hidden"
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a chat to start messaging
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-96"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Start New Chat</h2>
              <button
                onClick={() => setShowNewChat(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <input
              type="text"
              placeholder="Search users..."
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg mb-4"
            />
            <div className="overflow-y-auto max-h-64 space-y-2">
              {users
                .filter(
                  (u) =>
                    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((user) => (
                  <div
                    key={user.email}
                    onClick={() =>
                      startNewChat(user)
                    }
                    className="p-3 border rounded-lg hover:bg-blue-50 cursor-pointer"
                  >
                    <p className="font-semibold">{user.username}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <p className="text-xs text-blue-600">{user.role}</p>
                  </div>
                ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ChatSystem;
