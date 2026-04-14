const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');

// Load env vars
dotenv.config();

// Connect to Database
connectDB();

// Initialize the background worker
require('./src/queue/emailWorker');

// Initialize the automated cron jobs
require('./src/scheduler');

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Default Route
app.get('/', (req, res) => {
  res.send('AI Email Curator Backend MVP is running');
});

// Import Routes
const authRoutes = require('./src/routes/authRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const userRoutes = require('./src/routes/userRoutes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running on port ${PORT}`));
