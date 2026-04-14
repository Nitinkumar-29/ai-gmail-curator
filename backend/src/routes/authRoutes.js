const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { getOAuth2Client } = require('../services/gmailService');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Step 1: Redirect to Google
router.get('/google', (req, res) => {
  const oauth2Client = getOAuth2Client();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.modify', 'profile', 'email'],
    prompt: 'consent' // Forces refresh token generation
  });
  res.redirect(authUrl);
});

// Step 2: Handle OAuth Callback
router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    
    oauth2Client.setCredentials(tokens);

    // Get user profile info
    const oauth2 = require('googleapis').google.oauth2({
      auth: oauth2Client,
      version: 'v2'
    });
    const userInfo = await oauth2.userinfo.get();
    
    // Save to DB
    let user = await User.findOne({ googleId: userInfo.data.id });
    if (!user) {
      user = await User.create({
        googleId: userInfo.data.id,
        email: userInfo.data.email,
        displayName: userInfo.data.name,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      });
    } else {
      user.accessToken = tokens.access_token;
      if (tokens.refresh_token) user.refreshToken = tokens.refresh_token;
      await user.save();
    }

    // Route based on onboarding status
    if (user.isSetupComplete) {
      res.redirect(`${FRONTEND_URL}/dashboard?userId=${user._id}`);
    } else {
      res.redirect(`${FRONTEND_URL}/onboarding?userId=${user._id}`);
    }
  } catch (error) {
    console.error('Auth Error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

module.exports = router;
