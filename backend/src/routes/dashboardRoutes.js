const express = require('express');
const router = express.Router();
const EmailClassification = require('../models/EmailClassification');
const User = require('../models/User');
const { fetchRecentEmails, markEmailAsRead } = require('../services/gmailService');
const { addEmailProcessJobs } = require('../queue/emailQueue');

// Trigger fetching and queuing jobs
router.post('/sync/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.accessToken) return res.status(400).json({ error: 'User not authenticated with Google' });

    // 1. Fetch recent unread emails
    const emails = await fetchRecentEmails(user.accessToken, user.refreshToken, 10);
    
    if (emails.length === 0) {
      return res.json({ message: 'No new emails to process.' });
    }

    // 2. Add to BullMQ
    await addEmailProcessJobs(user._id, emails);

    res.json({ message: `Queued ${emails.length} emails for processing.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to sync emails' });
  }
});

// Get summarized data for a user
router.get('/:userId', async (req, res) => {
  try {
    const results = await EmailClassification.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(50);
      
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve dashboard data' });
  }
});

// Dismiss / Archive an email from the dashboard AND mutually clear Gmail unread flags
router.delete('/:id', async (req, res) => {
  try {
    const classification = await EmailClassification.findById(req.params.id);
    if (!classification) return res.status(404).json({ error: 'Not Found' });

    // Mark as read natively in Gmail if we have user credentials
    const user = await User.findById(classification.userId);
    if (user && user.accessToken) {
      await markEmailAsRead(user.accessToken, user.refreshToken, classification.emailId).catch(err => {
        console.error(`Silent UI Dismiss fail on Inbox ${classification.emailId}:`, err.message);
      });
    }

    // Safely purge from Dashboard UI memory
    await EmailClassification.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Email dismissed and marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to dismiss email' });
  }
});

module.exports = router;
