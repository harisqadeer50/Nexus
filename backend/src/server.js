const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const meetingRoutes = require('./routes/meetingRoutes');

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Nexus API is running' });
});

// Track active users: userId -> socketId
const activeUsers = {};

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // User registers themselves when they connect
  socket.on('register', (userId) => {
    activeUsers[userId] = socket.id;
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  // Caller sends offer to another user
  socket.on('call-user', ({ to, offer, from }) => {
    const targetSocket = activeUsers[to];
    if (targetSocket) {
      io.to(targetSocket).emit('incoming-call', { from, offer });
    }
  });

  // Receiver sends answer back to caller
  socket.on('answer-call', ({ to, answer }) => {
    const targetSocket = activeUsers[to];
    if (targetSocket) {
      io.to(targetSocket).emit('call-answered', { answer });
    }
  });

  // ICE candidates exchanged between peers
  socket.on('ice-candidate', ({ to, candidate }) => {
    const targetSocket = activeUsers[to];
    if (targetSocket) {
      io.to(targetSocket).emit('ice-candidate', { candidate });
    }
  });

  // One user ends the call
  socket.on('end-call', ({ to }) => {
    const targetSocket = activeUsers[to];
    if (targetSocket) {
      io.to(targetSocket).emit('call-ended');
    }
  });

  // User disconnects
  socket.on('disconnect', () => {
    // Remove user from activeUsers
    for (const userId in activeUsers) {
      if (activeUsers[userId] === socket.id) {
        delete activeUsers[userId];
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});