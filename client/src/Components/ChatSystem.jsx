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

  // file upload
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // 🔹 Load sample data
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        setCurrentUser({
          id: decoded.id || "user1",
          name: decoded.name || "Current User",
          email: decoded.email || "user@example.com",
          avatar: decoded.avatar || "https://via.placeholder.com/40",
        });
      }
    } catch (error) {
      console.error("Error parsing token:", error);
    }

    const sampleChats = [
      {
        id: "chat1",
        name: "Study Group - Algorithms",
        lastMessage: "Anyone up for a quick review?",
        timestamp: "2 min ago",
        unreadCount: 3,
        avatar: "https://via.placeholder.com/40/4F46E5/FFFFFF?text=SG",
        isGroup: true,
        members: ["user1", "user2", "user3", "user4"],
      },
      {
        id: "chat2",
        name: "John Doe",
        lastMessage: "Thanks for the notes!",
        timestamp: "1 hour ago",
        unreadCount: 0,
        avatar: "https://via.placeholder.com/40/10B981/FFFFFF?text=JD",
        isGroup: false,
        members: ["user1", "user2"],
      },
    ];
    setChats(sampleChats);

    const sampleUsers = [
      {
        id: "user2",
        name: "John Doe",
        email: "john@example.com",
        avatar:
          "https://via.placeholder.com/40/10B981/FFFFFF?text=JD",
      },
      {
        id: "user3",
        name: "Jane Smith",
        email: "jane@example.com",
        avatar:
          "https://via.placeholder.com/40/8B5CF6/FFFFFF?text=JS",
      },
    ];
    setUsers(sampleUsers);
  }, []);

  // 🔹 Load messages when chat is selected
  useEffect(() => {
    if (selectedChat) {
      const sampleMessages = [
        {
          id: "msg1",
          sender: "user2",
          senderName: "John Doe",
          content: "Hey everyone! How's the studying going?",
          timestamp: "10:30 AM",
          type: "text",
        },
        {
          id: "msg2",
          sender: "user1",
          senderName: "Current User",
          content: "Pretty good! Just finished the algorithms chapter.",
          timestamp: "10:32 AM",
          type: "text",
        },
      ];
      setMessages(sampleMessages);
    }
  }, [selectedChat]);

  // 🔹 Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔹 Send text message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;

    const message = {
      id: `msg${Date.now()}`,
      sender: currentUser?.id || "user1",
      senderName: currentUser?.name || "Current User",
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: "text",
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage("");
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === selectedChat.id
          ? { ...chat, lastMessage: newMessage, timestamp: "Just now" }
          : chat
      )
    );
    toast.success("Message sent!");
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
            {filteredChats.map((chat) => (
              <motion.div
                key={chat.id}
                whileHover={{ backgroundColor: "#f9fafb" }}
                onClick={() => setSelectedChat(chat)}
                className={`p-4 border-b cursor-pointer ${
                  selectedChat?.id === chat.id ? "bg-blue-50" : ""
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
                    <p className="text-sm text-gray-600">
                      {chat.lastMessage}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
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
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${
                      msg.sender === currentUser?.id
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`px-3 py-2 rounded-lg max-w-xs shadow ${
                        msg.sender === currentUser?.id
                          ? "bg-blue-600 text-white"
                          : "bg-white text-black"
                      }`}
                    >
                      {msg.type === "text" && <p>{msg.content}</p>}
                      {msg.type === "image" && (
                        <img
                          src={msg.content}
                          alt="shared"
                          className="max-w-[200px] rounded"
                        />
                      )}
                      {msg.type === "file" && (
                        <div className="flex items-center space-x-2">
                          <FaFile />
                          <span>{msg.file?.name}</span>
                        </div>
                      )}
                      <p className="text-xs text-right opacity-70 mt-1">
                        {msg.timestamp}
                      </p>
                    </div>
                  </motion.div>
                ))}
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
    </div>
  );
};

export default ChatSystem;
