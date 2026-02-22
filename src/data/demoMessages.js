
export const demoMessages = [
  // User 1 - Admin
  {
    id: "msg_1_1",
    userId: "u1",
    senderName: "Admin User",
    senderEmail: "user1@example.com",
    role: "admin",
    content: "Welcome to the new platform! Let me know if you encounter any issues.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    isRead: true,
    avatarColor: "bg-violet-600"
  },
  {
    id: "msg_1_2",
    userId: "u1",
    senderName: "Admin User",
    senderEmail: "user1@example.com",
    role: "admin",
    content: "We've updated the privacy policy. Please review it when you can.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    isRead: false,
    avatarColor: "bg-violet-600"
  },
  
  // User 2 - Free
  {
    id: "msg_2_1",
    userId: "u2",
    senderName: "Jane Doe",
    senderEmail: "user2@example.com",
    role: "free",
    content: "Hey, I'm having trouble exporting my transcription. Is there a limit?",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    isRead: true,
    avatarColor: "bg-pink-500"
  },

  // Justin Ogala - Member
  {
    id: "msg_11_1",
    userId: "u11",
    senderName: "Justin Ogala",
    senderEmail: "justinoo2001@gmail.com",
    role: "member",
    content: "Hello! I'm testing the chat functionality.",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    isRead: false,
    avatarColor: "bg-cyan-600"
  }
];
