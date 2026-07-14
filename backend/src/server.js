const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const documentRoutes = require('./routes/documentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const otpRoutes = require('./routes/otpRoutes');
const userRoutes = require('./routes/userRoutes');
const { helmetMiddleware, limiter, authLimiter } = require('./middleware/security');

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

// Security middleware
app.use(helmetMiddleware);
app.use(limiter);
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/otp', otpRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Nexus API is running' });
});

// Socket.IO - Video call signaling
const activeUsers = {};

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('register', (userId) => {
    activeUsers[userId] = socket.id;
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  socket.on('call-user', ({ to, offer, from }) => {
    const targetSocket = activeUsers[to];
    if (targetSocket) {
      io.to(targetSocket).emit('incoming-call', { from, offer });
    }
  });

  socket.on('answer-call', ({ to, answer }) => {
    const targetSocket = activeUsers[to];
    if (targetSocket) {
      io.to(targetSocket).emit('call-answered', { answer });
    }
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    const targetSocket = activeUsers[to];
    if (targetSocket) {
      io.to(targetSocket).emit('ice-candidate', { candidate });
    }
  });

  socket.on('end-call', ({ to }) => {
    const targetSocket = activeUsers[to];
    if (targetSocket) {
      io.to(targetSocket).emit('call-ended');
    }
  });

  socket.on('disconnect', () => {
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
