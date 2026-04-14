const mongoose = require('mongoose');

const EmailClassificationSchema = new mongoose.Schema({
  emailId: {
    type: String,
    required: true,
    unique: true, // Google's message Id
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: String,
  subject: String,
  snippet: String,
  priority: {
    type: String,
    enum: ['high', 'medium', 'low', 'none'],
    default: 'none'
  },
  category: {
    type: String,
    default: 'general' 
  },
  summary: String,
  actionableAdvice: String,
  status: {
    type: String,
    enum: ['pending', 'processed', 'failed'],
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('EmailClassification', EmailClassificationSchema);
