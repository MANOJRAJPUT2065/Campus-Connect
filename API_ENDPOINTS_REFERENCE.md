# Complete API Endpoints Reference

## Overview

This document lists all backend API endpoints that the role-based dashboard system uses.

---

## 🔐 Authentication Routes (`/api/auth`)

### Signup User

```
POST /api/auth/signup
Content-Type: application/json

Request:
{
  "username": "john_doe",
  "usn": "CS2024001",
  "email": "john@example.com",
  "password": "hashedPassword",
  "role": "student|teacher|coordinator",
  "department": "CSE" (for teacher),
  "semester": "4" (for teacher)
}

Response:
{
  "success": true,
  "message": "User created successfully",
  "token": "JWT_TOKEN",
  "role": "student|teacher|coordinator"
}
```

### Login User

```
POST /api/auth/login
Content-Type: application/json

Request:
{
  "usn": "CS2024001",
  "password": "userPassword"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "token": "JWT_TOKEN",
  "role": "student|teacher|coordinator"
}
```

---

## 🎓 Session Routes (`/api/sessions`) - For Teachers

### Create Session (Teacher)

```
POST /api/sessions/create
Authorization: Bearer TOKEN
Content-Type: application/json

Request:
{
  "title": "Web Development Class",
  "description": "Class session",
  "instructorId": "teacher@example.com",
  "instructorName": "John Teacher",
  "maxParticipants": 50,
  "duration": "60 min"
}

Response:
{
  "success": true,
  "session": {
    "_id": "session123",
    "title": "Web Development Class",
    "channelName": "session-abc12345",
    "instructorId": "teacher@example.com",
    "status": "scheduled",
    "maxParticipants": 50,
    "participants": [],
    "createdAt": "2024-01-07T..."
  }
}
```

### Get Teacher's Sessions

```
GET /api/sessions/teacher/:instructorId
Authorization: Bearer TOKEN

Response:
{
  "success": true,
  "sessions": [
    {
      "_id": "session123",
      "title": "Web Development Class",
      "channelName": "session-abc12345",
      "status": "live|ended|scheduled",
      "participants": [
        {
          "userId": "student@example.com",
          "userName": "Alice Student",
          "joinedAt": "2024-01-07T..."
        }
      ],
      "maxParticipants": 50,
      "createdAt": "2024-01-07T..."
    }
  ]
}
```

### Start Session (Teacher)

```
POST /api/sessions/:sessionId/start
Authorization: Bearer TOKEN

Response:
{
  "success": true,
  "session": {
    "_id": "session123",
    "status": "live",
    "startTime": "2024-01-07T..."
  }
}
```

### End Session (Teacher)

```
POST /api/sessions/:sessionId/end
Authorization: Bearer TOKEN

Response:
{
  "success": true,
  "session": {
    "_id": "session123",
    "status": "ended",
    "endTime": "2024-01-07T..."
  }
}
```

### Join Session (Student/Teacher)

```
POST /api/sessions/:sessionId/join
Authorization: Bearer TOKEN
Content-Type: application/json

Request:
{
  "userId": "student@example.com",
  "userName": "Alice Student",
  "userRole": "student"
}

Response:
{
  "success": true,
  "session": {
    "_id": "session123",
    "channelName": "session-abc12345",
    "participants": [
      {
        "userId": "student@example.com",
        "userName": "Alice Student",
        "joinedAt": "2024-01-07T...",
        "role": "student"
      }
    ]
  }
}
```

### Get Session Details

```
GET /api/sessions/:sessionId
Authorization: Bearer TOKEN

Response:
{
  "success": true,
  "session": {
    "_id": "session123",
    "title": "Web Development Class",
    "channelName": "session-abc12345",
    "instructorName": "John Teacher",
    "status": "live",
    "maxParticipants": 50,
    "participants": [
      {
        "userId": "student@example.com",
        "userName": "Alice Student"
      }
    ],
    "createdAt": "2024-01-07T...",
    "startTime": "2024-01-07T..."
  }
}
```

### Get Live Sessions

```
GET /api/sessions/live
Authorization: Bearer TOKEN

Response:
{
  "success": true,
  "sessions": [
    {
      "_id": "session123",
      "title": "Web Development Class",
      "channelName": "session-abc12345",
      "instructorName": "John Teacher",
      "status": "live",
      "maxParticipants": 50
    }
  ]
}
```

### Get Session Analytics

```
GET /api/sessions/:sessionId/analytics
Authorization: Bearer TOKEN

Response:
{
  "success": true,
  "analytics": {
    "totalParticipants": 15,
    "duration": "45 min",
    "peakParticipants": 15,
    "recordingUrl": "https://..."
  }
}
```

---

## 📅 Event Routes (`/events`) - For Coordinators

### Create Event

```
POST /events/addEvent
Authorization: Bearer TOKEN
Content-Type: multipart/form-data

Request (FormData):
{
  "title": "Club Meeting",
  "description": "Monthly club meeting",
  "date": "2024-01-15",
  "time": "14:00",
  "duration": "60",
  "maxParticipants": "100",
  "instructor": "John Coordinator",
  "eventImage": <file>
}

Response:
{
  "success": true,
  "event": {
    "_id": "event123",
    "title": "Club Meeting",
    "description": "Monthly club meeting",
    "date": "2024-01-15",
    "time": "14:00",
    "duration": "60",
    "maxParticipants": 100,
    "instructor": "John Coordinator",
    "eventImage": "https://cloudinary-url.jpg",
    "createdAt": "2024-01-07T..."
  }
}
```

### Get All Events

```
GET /events/getEvents
Authorization: Bearer TOKEN

Response:
{
  "success": true,
  "events": [
    {
      "_id": "event123",
      "title": "Club Meeting",
      "description": "Monthly club meeting",
      "date": "2024-01-15",
      "time": "14:00",
      "duration": "60",
      "maxParticipants": 100,
      "participants": [],
      "instructor": "John Coordinator",
      "eventImage": "https://cloudinary-url.jpg",
      "createdAt": "2024-01-07T..."
    }
  ]
}
```

### Get Event by ID

```
GET /events/event/:id
Authorization: Bearer TOKEN

Response:
{
  "success": true,
  "event": {
    "_id": "event123",
    "title": "Club Meeting",
    "description": "Monthly club meeting",
    "date": "2024-01-15",
    "time": "14:00",
    "duration": "60",
    "maxParticipants": 100,
    "participants": [
      {
        "userId": "student@example.com",
        "userName": "Alice Student",
        "registeredAt": "2024-01-07T..."
      }
    ]
  }
}
```

### Delete Event

```
DELETE /events/:id
Authorization: Bearer TOKEN

Response:
{
  "success": true,
  "message": "Event deleted successfully"
}
```

### Update Event

```
PUT /events/:id
Authorization: Bearer TOKEN
Content-Type: application/json

Request:
{
  "title": "Updated Event Title",
  "description": "Updated description",
  "date": "2024-01-20",
  "time": "15:00"
}

Response:
{
  "success": true,
  "event": {
    "_id": "event123",
    "title": "Updated Event Title",
    ...
  }
}
```

### Get Upcoming Events

```
GET /events/upcoming
Authorization: Bearer TOKEN

Response:
{
  "success": true,
  "events": [
    {
      "_id": "event123",
      "title": "Upcoming Event",
      "date": "2024-01-15",
      ...
    }
  ]
}
```

---

## 📝 Post Routes (`/api/posts`) - For Students

### Get All Posts

```
GET /api/posts/getposts

Response:
{
  "success": true,
  "posts": [
    {
      "_id": "post123",
      "title": "Post Title",
      "content": "Post content",
      "author": "John User",
      "authorEmail": "john@example.com",
      "image": "https://cloudinary-url.jpg",
      "likes": 10,
      "comments": 5,
      "createdAt": "2024-01-07T..."
    }
  ]
}
```

### Create Post

```
POST /api/posts/addpost
Authorization: Bearer TOKEN
Content-Type: multipart/form-data

Request (FormData):
{
  "title": "My Post",
  "content": "Post content here",
  "authorEmail": "john@example.com",
  "authorUsername": "john_doe",
  "image": <file>
}

Response:
{
  "success": true,
  "post": {
    "_id": "post123",
    "title": "My Post",
    "content": "Post content here",
    ...
  }
}
```

### Get Post by ID

```
GET /api/posts/:id
Authorization: Bearer TOKEN

Response:
{
  "success": true,
  "post": {
    "_id": "post123",
    "title": "Post Title",
    "content": "Post content",
    ...
  }
}
```

### Delete Post

```
DELETE /api/posts/:id
Authorization: Bearer TOKEN

Response:
{
  "success": true,
  "message": "Post deleted successfully"
}
```

---

## 💬 Message Routes (`/api/messages`) - For Chat

### Send Message

```
POST /api/messages/send
Authorization: Bearer TOKEN
Content-Type: application/json

Request:
{
  "receiverId": "receiver@example.com",
  "message": "Hello, how are you?"
}

Response:
{
  "success": true,
  "message": {
    "_id": "msg123",
    "senderId": "sender@example.com",
    "receiverId": "receiver@example.com",
    "message": "Hello, how are you?",
    "timestamp": "2024-01-07T..."
  }
}
```

### Get Messages

```
GET /api/messages/:userId
Authorization: Bearer TOKEN

Response:
{
  "success": true,
  "messages": [
    {
      "_id": "msg123",
      "senderId": "sender@example.com",
      "message": "Hello, how are you?",
      "timestamp": "2024-01-07T..."
    }
  ]
}
```

---

## 📚 Notes Routes (`/api/notes`) - For Students

### Create Note

```
POST /api/notes/create
Authorization: Bearer TOKEN
Content-Type: application/json

Request:
{
  "title": "Study Notes",
  "content": "Important points to remember",
  "subject": "Web Development",
  "tags": ["javascript", "react"]
}

Response:
{
  "success": true,
  "note": {
    "_id": "note123",
    "title": "Study Notes",
    ...
  }
}
```

### Get All Notes

```
GET /api/notes/getnotes
Authorization: Bearer TOKEN

Response:
{
  "success": true,
  "notes": [
    {
      "_id": "note123",
      "title": "Study Notes",
      "subject": "Web Development",
      ...
    }
  ]
}
```

---

## Socket.IO Events - For Real-Time Communication

### Video Call Events

```javascript
// Client emits
socket.emit("join-video-room", { roomId: "session-abc12345" });
socket.emit("leave-video-room", { roomId: "session-abc12345" });
socket.emit("video-offer", { roomId, offer });
socket.emit("video-answer", { roomId, answer });
socket.emit("ice-candidate", { roomId, candidate });

// Client listens
socket.on("user-joined", (data) => {
  console.log("User joined:", data.userId);
});

socket.on("user-left", (data) => {
  console.log("User left:", data.userId);
});

socket.on("video-offer", (data) => {
  // Handle offer
});

// Chat events
socket.emit("send-message", {
  roomId: "session-abc12345",
  message: "Hello",
  userName: "John",
});

socket.on("new-message", (data) => {
  // Handle new message
});

// Host controls
socket.emit("host-mute-all", { roomId: "session-abc12345" });
socket.on("mute-all-users", (data) => {
  // Mute all audio
});

socket.emit("host-end-meeting", { roomId: "session-abc12345" });
socket.on("meeting-ended", (data) => {
  // Meeting has been ended by host
});

// Reactions
socket.emit("reaction", {
  roomId: "session-abc12345",
  emoji: "👍",
  userName: "John",
});

socket.on("reaction", (data) => {
  // Show reaction emoji
});

// Hand raise
socket.emit("raise-hand", {
  roomId: "session-abc12345",
  userName: "John",
});

socket.on("hand-raised", (data) => {
  // Show raised hand indicator
});
```

---

## Error Responses

### Common Error Format

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes

```
200 OK - Request successful
201 Created - Resource created successfully
400 Bad Request - Missing or invalid parameters
401 Unauthorized - Missing or invalid token
403 Forbidden - User not authorized for this action
404 Not Found - Resource not found
500 Internal Server Error - Server error
```

---

## Authentication Notes

1. **Token Storage**: JWT token stored in `localStorage.token`
2. **Token Format**: `Authorization: Bearer {JWT_TOKEN}`
3. **Token Contents**:
   ```json
   {
     "email": "user@example.com",
     "username": "username",
     "usn": "CS2024001",
     "role": "student|teacher|coordinator",
     "profilePicUrl": "https://..."
   }
   ```
4. **Token Expiration**: Implement refresh token mechanism

---

## Endpoint Summary Table

| Method | Endpoint                  | Authorization | Purpose                |
| ------ | ------------------------- | ------------- | ---------------------- |
| POST   | /api/auth/signup          | -             | Register new user      |
| POST   | /api/auth/login           | -             | Login user             |
| POST   | /api/sessions/create      | ✅            | Create class session   |
| GET    | /api/sessions/teacher/:id | ✅            | Get teacher's sessions |
| POST   | /api/sessions/:id/join    | ✅            | Join session           |
| GET    | /api/sessions/:id         | ✅            | Get session details    |
| GET    | /events/getEvents         | ✅            | Get all events         |
| POST   | /events/addEvent          | ✅            | Create event           |
| DELETE | /events/:id               | ✅            | Delete event           |
| GET    | /api/posts/getposts       | -             | Get all posts          |
| POST   | /api/posts/addpost        | ✅            | Create post            |
| GET    | /api/messages/:userId     | ✅            | Get messages           |
| POST   | /api/messages/send        | ✅            | Send message           |
| GET    | /api/notes/getnotes       | ✅            | Get user notes         |
| POST   | /api/notes/create         | ✅            | Create note            |

---

## Quick Reference

### For TeacherDashboard

```
- GET /api/sessions/teacher/{email}
- POST /api/sessions/create
- POST /api/sessions/{id}/join
```

### For CoordinatorDashboard

```
- GET /events/getEvents
- POST /events/addEvent (multipart/form-data)
- DELETE /events/{id}
```

### For StudentDashboard (Feed)

```
- GET /api/posts/getposts
- GET /events/getEvents
- POST /api/sessions/{id}/join
```

---

**Last Updated**: January 7, 2024
**Status**: ✅ Complete and Verified
