const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

// Import routes
const participantRoutes = require('./routes/participants');
const teamRoutes = require('./routes/teams');

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://mnimidou1:BqFwx3nGzrBnZ8k6@cluster0.5zmlytl.mongodb.net')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });

// Routes
app.use('/api/participants', participantRoutes);
app.use('/api/teams', teamRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Hackathon Registration API');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Server Error'
  });
});

// 404 route
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 