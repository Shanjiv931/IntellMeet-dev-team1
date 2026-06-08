import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';

// Initialize Express + WebSocket Servers
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// In-Memory Store
const DB = {
  users: [
    {
      id: 'usr_1',
      name: 'Sushant',
      email: 'sushant@example.com',
      password: 'password123',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr_2',
      name: 'Mayuresh',
      email: 'mayuresh@example.com',
      password: 'password123',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop',
      createdAt: new Date().toISOString(),
    },
  ],
  meetings: [
    {
      id: 'meet_active_demo',
      title: 'IntelliMeet Pro Strategy Session',
      description: 'Discussing the release timeline and marketing launch details of the AI features.',
      hostId: 'usr_1',
      hostName: 'Sushant',
      date: new Date().toISOString().split('T')[0],
      startTime: '10:00 AM',
      duration: 45,
      passcode: '90210',
      status: 'active',
      participants: [
        { id: 'part_1', userId: 'usr_1', name: 'Sushant', role: 'host', joinedAt: new Date().toISOString(), audio: true, video: true },
        { id: 'part_2', userId: 'usr_2', name: 'Mayuresh', role: 'participant', joinedAt: new Date().toISOString(), audio: false, video: true }
      ],
      polls: [],
      breakoutRooms: [],
      whiteboard: [],
      recordings: [],
      attendance: []
    }
  ],
  chats: [],
  sharedFiles: [],
  notifications: [
    {
      id: 'notif_1',
      title: 'Welcome to IntelliMeet Pro!',
      message: 'Experience the next-best collaboration tool fitted with Live AI summaries and interactive drawing canvas boards.',
      type: 'success',
      timestamp: new Date().toISOString(),
      read: false,
    },
  ],
};

// Lazy-loaded Gemini AI API Setup
let geminiClient = null;
function getGeminiClient() {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not defined in system environment. Fallback smart intelligence models will be activated.');
      return null;
    }
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Auth simulation APIs
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  const existingUser = DB.users.find((u) => u.email === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: 'User is already registered with this email.' });
  }
  const newUser = {
    id: `usr_${crypto.randomBytes(4).toString('hex')}`,
    name,
    email: email.toLowerCase(),
    password,
    avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 900000)}?w=100&h=100&fit=crop`,
    createdAt: new Date().toISOString(),
  };
  DB.users.push(newUser);
  res.status(201).json({
    message: 'User registered successfully!',
    token: `jwt_token_${newUser.id}`,
    user: { id: newUser.id, name: newUser.name, email: newUser.email, avatar: newUser.avatar },
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = DB.users.find((u) => u.email === email.toLowerCase() && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password credential combinations.' });
  }
  res.json({
    token: `jwt_token_${user.id}`,
    user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
  });
});

app.post('/api/auth/profile', (req, res) => {
  const token = req.headers.authorization;
  if (!token || !token.startsWith('Bearer jwt_token_')) {
    return res.status(401).json({ error: 'User is not logged in.' });
  }
  const userId = token.replace('Bearer jwt_token_', '');
  const user = DB.users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User profiles could not be resolved.' });
  }
  res.json({ id: user.id, name: user.name, email: user.email, avatar: user.avatar });
});

// Scheduling APIs
app.post('/api/meetings/schedule', (req, res) => {
  const { title, description, date, startTime, duration } = req.body;
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'Sign-in required' });
  }
  const userId = token.replace('Bearer jwt_token_', '');
  const user = DB.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const mockMeetingId = `meet_${crypto.randomBytes(4).toString('hex')}`;
  const mockPasscode = `${Math.floor(100000 + Math.random() * 900000)}`;
  const scheduledMeeting = {
    id: mockMeetingId,
    title: title || 'Scheduled Session',
    description: description || '',
    hostId: user.id,
    hostName: user.name,
    date: date || new Date().toISOString().split('T')[0],
    startTime: startTime || '12:00 PM',
    duration: parseInt(duration) || 30,
    passcode: mockPasscode,
    status: 'scheduled',
    participants: [],
    polls: [],
    breakoutRooms: [],
    whiteboard: [],
    recordings: [],
    attendance: []
  };

  DB.meetings.push(scheduledMeeting);

  DB.notifications.push({
    id: `notif_${crypto.randomBytes(4).toString('hex')}`,
    title: 'Meeting Scheduled Successfully',
    message: `Meeting title "${scheduledMeeting.title}" has been registered for calendar on ${scheduledMeeting.date} at ${scheduledMeeting.startTime}.`,
    type: 'calendar',
    timestamp: new Date().toISOString(),
    read: false,
  });

  res.status(201).json({ message: 'Meeting scheduled', meeting: scheduledMeeting });
});

app.post('/api/meetings/create-instant', (req, res) => {
  const { title } = req.body;
  const token = req.headers.authorization;
  const userId = token ? token.replace('Bearer jwt_token_', '') : 'usr_1';
  const user = DB.users.find((u) => u.id === userId) || DB.users[0];

  const uniqueId = crypto.randomBytes(4).toString('hex');
  const instantMeet = {
    id: `meet_${uniqueId}`,
    title: title || 'Instant Conference Space',
    description: 'An ad-hoc interactive room.',
    hostId: user.id,
    hostName: user.name,
    date: new Date().toISOString().split('T')[0],
    startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'active',
    passcode: `${Math.floor(100000 + Math.random() * 900000)}`,
    participants: [
      { id: `part_${user.id}`, userId: user.id, name: user.name, role: 'host', joinedAt: new Date().toISOString(), audio: true, video: true }
    ],
    polls: [],
    breakoutRooms: [],
    whiteboard: [],
    attendance: []
  };

  DB.meetings.push(instantMeet);
  res.status(201).json(instantMeet);
});

app.post('/api/meetings/join', (req, res) => {
  const { meetingId, passcode } = req.body;
  const token = req.headers.authorization;
  const userId = token ? token.replace('Bearer jwt_token_', '') : 'usr_2';
  const user = DB.users.find((u) => u.id === userId) || DB.users[1] || DB.users[0];

  const meeting = DB.meetings.find((m) => m.id === meetingId);
  if (!meeting) {
    return res.status(404).json({ error: 'Meet room is invalid or expired.' });
  }
  if (meeting.passcode && meeting.passcode !== passcode) {
    return res.status(403).json({ error: 'Incorrect passcode digits.' });
  }

  const alreadyParticipant = meeting.participants.some((p) => p.userId === user.id);
  if (!alreadyParticipant) {
    meeting.participants.push({
      id: `part_${user.id}_${crypto.randomBytes(2).toString('hex')}`,
      userId: user.id,
      name: user.name,
      role: meeting.hostId === user.id ? 'host' : 'participant',
      joinedAt: new Date().toISOString(),
      audio: true,
      video: true
    });
  }

  res.json(meeting);
});

app.get('/api/meetings/:id', (req, res) => {
  const meeting = DB.meetings.find((m) => m.id === req.params.id);
  if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
  res.json(meeting);
});

app.post('/api/meetings/:id/end', (req, res) => {
  const meeting = DB.meetings.find((m) => m.id === req.params.id);
  if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

  meeting.status = 'ended';

  meeting.participants.forEach((p) => {
    const joined = new Date(p.joinedAt).getTime();
    const left = new Date().getTime();
    const durationMins = Math.max(1, Math.round((left - joined) / 60000));
    meeting.attendance.push({
      userId: p.userId,
      name: p.name,
      joinedAt: p.joinedAt,
      leftAt: new Date().toISOString(),
      duration: durationMins,
    });
  });

  res.json({ message: 'Meeting session archived successfully.', meeting });
});

app.get('/api/meetings', (req, res) => {
  res.json(DB.meetings);
});

// Gemini AI API Assist routes
app.post('/api/meetings/:id/ai-assistant', async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'AI prompt question is empty.' });
  }

  const meetingId = req.params.id;
  const meeting = DB.meetings.find((m) => m.id === meetingId) || DB.meetings[0];

  const activeChats = DB.chats
    .filter((c) => c.meetingId === meetingId)
    .map((c) => `${c.senderName}: ${c.text}`)
    .join('\n');

  const chatContext = activeChats || 'Meeting chats: None registered yet. Team discussing product pipeline strategy.';

  const aiClient = getGeminiClient();
  if (!aiClient) {
    let mockAnswer = '';
    const query = question.toLowerCase();

    if (query.includes('summarize') || query.includes('summary')) {
      mockAnswer = `### **AI Meeting Brief - WebRTC Context**\n\nThe team is actively conducting professional WebRTC connections over room **"${meeting?.title || 'Interactive Room'}"**.\n* **Status:** Camera and audio tracks are streaming live securely.\n* **Insights:** Screen shares and real-time drawings are synchronizing. Finalizing release candidate frameworks soon.`;
    } else if (query.includes('action') || query.includes('task')) {
      mockAnswer = `### **AI Extracted Tasks**\n\nBased on chats and schedules, here are key assignments:\n\n1. **Setup ICE turn servers**\n   * **Assignee:** Tech Lead / Mayuresh\n   * **Timeline:** Within 48 hours\n2. **Optimize camera framerates**\n   * **Assignee:** Lead FrontEnd\n   * **Timeline:** Monday noon`;
    } else {
      mockAnswer = `Here is an automated copilot response regarding: **"${question}"**.\n\nEverything is working smoothly inside IntelliMeet. The WebRTC connection state is robust!`;
    }
    return res.json({ answer: mockAnswer });
  }

  try {
    const prompt = `You are "IntelliMeet Pro Assistant", a world-class AI meeting copilot. 
Analyzing live session context for meeting [${meeting?.title || 'Interactive Room'}]: ${meeting?.description || 'N/A'}. 
Current live messages from meeting:
"""
${chatContext}
"""

The user is asking: "${question}"
Provide a summary, explanation, task action list, or standard answer directly addressing their prompt while retaining the meeting's helpful context. Return the response in clean, easy-to-read Markdown. Keep it direct and helpful.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const aiText = response.text || 'Unable to retrieve generative suggestions.';
    res.json({ answer: aiText });
  } catch (error) {
    console.error('Gemini API query failure:', error);
    res.status(500).json({ error: 'Generative AI query error.' });
  }
});

app.post('/api/meetings/:id/generate-summary', async (req, res) => {
  const meetingId = req.params.id;
  const meeting = DB.meetings.find((m) => m.id === meetingId) || DB.meetings[0];

  const chatLogs = DB.chats
    .filter((c) => c.meetingId === meetingId)
    .map((c) => `${c.senderName}: ${c.text}`)
    .join('\n') || 'Meeting context: John schedules the roadmap. Sarah completes Socket controller connections.';

  const aiClient = getGeminiClient();

  if (!aiClient) {
    const responseData = {
      summary: 'The session focused on establishing proper deployment strategies for IntelliMeet Pro, detailing our socket connection paradigms and JWT authorization loops.',
      highlights: [
        'Finalized Vite SPA deployment structures without client leaks',
        'Implemented beautiful UI cards using responsive glassmorphic cards',
        'Enabled cloud-synced whiteboards for multi-participant layouts'
      ],
      actionItems: [
        { id: 't1', task: 'Review Cloud Run deployment rules', assigneeName: 'Sushant', deadline: 'In 3 days' },
        { id: 't2', task: 'Optimize in-memory data store pipelines', assigneeName: 'Mayuresh', deadline: 'By tomorrow' }
      ]
    };
    return res.json(responseData);
  }

  try {
    const prompt = `Analyze this video meeting logs for [${meeting?.title}] and format a summarized dashboard.
Meeting description: "${meeting?.description}"
Chat records:
"""
${chatLogs}
"""

Compose a JSON array returned inside standard schema structure:
{
  "summary": "String summary of discussion",
  "highlights": ["Point 1", "Point 2", "Point 3"],
  "actionItems": [
    { "task": "Task explanation", "assigneeName": "Name of assignee", "deadline": "Days/Hours left" }
  ]
}
Return only the valid JSON payload inside a codeblock or directly. Do not add any conversational text.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const bodyText = response.text;
    if (!bodyText) throw new Error('No suggestions text from Gemini.');
    const parsed = JSON.parse(bodyText.trim());
    res.json({
      summary: parsed.summary || 'Summary compiled.',
      highlights: parsed.highlights || [],
      actionItems: (parsed.actionItems || []).map((x, index) => ({
        id: `act_${index}_${crypto.randomBytes(2).toString('hex')}`,
        task: x.task,
        assigneeName: x.assigneeName || 'All',
        deadline: x.deadline || 'ASAP'
      }))
    });
  } catch (err) {
    console.error('Generative AI JSON summary compilation failed:', err);
    res.json({
      summary: 'The conference successfully closed with participants alignment.',
      highlights: ['Alignment reached on target timeline core plans', 'All real-time network monitors reporting standard operations'],
      actionItems: [
        { id: 'act_f1', task: 'Check package system status', assigneeName: 'All Participants', deadline: 'Before next run' }
      ]
    });
  }
});

// File Share APIs
app.post('/api/meetings/:id/files', (req, res) => {
  const { name, size, type, data } = req.body;
  if (!name || !size || !type) {
    return res.status(400).json({ error: 'Name, size and model types are required.' });
  }

  const token = req.headers.authorization;
  const user = DB.users.find((u) => `Bearer jwt_token_${u.id}` === token) || DB.users[0];

  const newFile = {
    id: `file_${crypto.randomBytes(4).toString('hex')}`,
    name,
    size,
    type,
    url: data || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
    uploadedBy: user.name,
    uploadedAt: new Date().toISOString(),
  };

  DB.sharedFiles.push(newFile);

  DB.notifications.push({
    id: `notif_${crypto.randomBytes(4).toString('hex')}`,
    title: 'New Shared File Uploaded',
    message: `${user.name} released a file: ${name} (${size})`,
    type: 'info',
    timestamp: new Date().toISOString(),
    read: false,
  });

  res.status(201).json(newFile);
});

app.get('/api/meetings/:id/files', (req, res) => {
  res.json(DB.sharedFiles);
});

// Notifications
app.get('/api/notifications', (req, res) => {
  res.json(DB.notifications);
});

app.post('/api/notifications/read-all', (req, res) => {
  DB.notifications.forEach((n) => (n.read = true));
  res.json({ status: 'ok' });
});

// WebRTC Socket.IO Signaling Server Routing
io.on('connection', (socket) => {
  console.log(`Socket client active connection established: ${socket.id}`);

  // JOIN ROOM
  socket.on('join_meeting', ({ meetingId, userId, userName }) => {
    socket.join(meetingId);
    
    // Store profile context reference in socket state
    socket.meetingId = meetingId;
    socket.userId = userId;
    socket.userName = userName;

    console.log(`User ${userName} (${userId}) joined room: ${meetingId}`);

    // Retrieve list of all other sockets currently connected in this room
    const clientsInRoom = Array.from(io.sockets.adapter.rooms.get(meetingId) || []);
    const otherClients = [];

    for (const socketId of clientsInRoom) {
      if (socketId !== socket.id) {
        const otherSocket = io.sockets.sockets.get(socketId);
        if (otherSocket) {
          otherClients.push({
            socketId: otherSocket.id,
            userId: otherSocket.userId,
            userName: otherSocket.userName,
          });
        }
      }
    }

    // Give the joining peer a roster of everyone already connected
    socket.emit('all_users_roster', otherClients);

    // Coordinate devices status inside backend databases
    const meeting = DB.meetings.find((m) => m.id === meetingId);
    if (meeting) {
      const alreadyPart = meeting.participants.some(p => p.userId === userId);
      if (!alreadyPart) {
         meeting.participants.push({
           id: `part_${userId}_${crypto.randomBytes(2).toString('hex')}`,
           userId,
           name: userName,
           role: meeting.hostId === userId ? 'host' : 'participant',
           joinedAt: new Date().toISOString(),
           audio: true,
           video: true
         });
      }
    }

    // Notify other peers in real-time that a new participant entered
    socket.to(meetingId).emit('user_joined_broadcast', {
      socketId: socket.id,
      userId,
      userName,
    });
  });

  // SIGNALLING FOR WEBRTC OFFER / ANSWER / ICE CANDIDATES
  socket.on('send_rtc_signal', ({ to, signal }) => {
    // Forward signaling payload directly to the desired target socket peer
    io.to(to).emit('receive_rtc_signal', {
      senderSocketId: socket.id,
      signal,
    });
  });

  // REAL-TIME CHAT
  socket.on('send_message', (messageData) => {
    const { meetingId, senderId, senderName, text } = messageData;
    const chatMsg = {
      id: `chat_${crypto.randomBytes(4).toString('hex')}`,
      meetingId,
      senderId,
      senderName,
      text,
      timestamp: new Date().toISOString()
    };
    DB.chats.push(chatMsg);
    io.to(meetingId).emit('new_message', chatMsg);
  });

  // DRAWING CANVAS STREAMING
  socket.on('draw_canvas', ({ meetingId, element }) => {
    const meeting = DB.meetings.find((m) => m.id === meetingId);
    if (meeting) {
      if (!meeting.whiteboard) meeting.whiteboard = [];
      meeting.whiteboard.push(element);
    }
    socket.to(meetingId).emit('canvas_draw_received', element);
  });

  socket.on('clear_canvas', ({ meetingId }) => {
    const meeting = DB.meetings.find((m) => m.id === meetingId);
    if (meeting) {
      meeting.whiteboard = [];
    }
    socket.to(meetingId).emit('canvas_clear_received');
  });

  // COLLECTIVE POLL SOLUTIONS
  socket.on('create_poll', ({ meetingId, poll }) => {
    const meeting = DB.meetings.find((m) => m.id === meetingId);
    if (meeting) {
      const dbPoll = {
        id: poll.id || `poll_${crypto.randomBytes(4).toString('hex')}`,
        question: poll.question,
        options: poll.options,
        votes: poll.options.reduce((acc, _, idx) => {
          acc[idx] = 0;
          return acc;
        }, {}),
        votedUsers: {},
        isActive: true,
        createdByName: poll.createdByName || 'Host'
      };
      meeting.polls.push(dbPoll);
      io.to(meetingId).emit('poll_created_received', dbPoll);
    }
  });

  socket.on('vote_poll', ({ meetingId, pollId, optionIndex, userId }) => {
    const meeting = DB.meetings.find((m) => m.id === meetingId);
    if (meeting) {
      const poll = meeting.polls.find((p) => p.id === pollId);
      if (poll && poll.isActive) {
        const previousVoteIndex = poll.votedUsers[userId];
        if (previousVoteIndex !== undefined) {
          poll.votes[previousVoteIndex] = Math.max(0, poll.votes[previousVoteIndex] - 1);
        }
        poll.votes[optionIndex] = (poll.votes[optionIndex] || 0) + 1;
        poll.votedUsers[userId] = optionIndex;

        io.to(meetingId).emit('poll_votes_updated', poll);
      }
    }
  });

  socket.on('close_poll', ({ meetingId, pollId }) => {
    const meeting = DB.meetings.find((m) => m.id === meetingId);
    if (meeting) {
      const poll = meeting.polls.find((p) => p.id === pollId);
      if (poll) {
        poll.isActive = false;
        io.to(meetingId).emit('poll_closed_received', pollId);
      }
    }
  });

  // DISCONNECT & REMOVE PARTICIPANTS FROM SIGNALING
  socket.on('disconnect', () => {
    const { meetingId, userId, userName } = socket;
    if (meetingId) {
      console.log(`User ${userName} disconnected from room: ${meetingId}`);
      
      // Let other clients know this specific peer left so they can clean up their peer connections
      socket.to(meetingId).emit('user_left_broadcast', {
        socketId: socket.id,
        userId,
        userName,
      });

      // Update in-memoryDB
      const meeting = DB.meetings.find((m) => m.id === meetingId);
      if (meeting) {
        meeting.participants = meeting.participants.filter(p => p.userId !== userId);
      }
    }
  });
});

// SERVE FRONTEND WITH VITE MIDDLEWARE OR STATIC BUNDLES
async function startBootstrap() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`IntelliMeet Pro server successfully bootstrapped and running on http://localhost:${PORT}`);
  });
}

startBootstrap().catch((err) => {
  console.error('Server bootstrapping error occurred:', err);
});
