const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { fetchRecentEmails } = require('../services/gmailService');
const { addEmailProcessJobs } = require('../queue/emailQueue');

// Set User Setup Preferences and trigger sync
router.put('/:userId/preferences', async (req, res) => {
  try {
    const { prioritizeTypes, ignoreTypes } = req.body;
    
    // Clean inputs into arrays
    const cleanPrioritize = prioritizeTypes.split(',').map(s => s.trim()).filter(Boolean);
    const cleanIgnore = ignoreTypes.split(',').map(s => s.trim()).filter(Boolean);

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.botPreferences = {
      prioritizeTypes: cleanPrioritize.length ? cleanPrioritize : user.botPreferences.prioritizeTypes,
      ignoreTypes: cleanIgnore.length ? cleanIgnore : user.botPreferences.ignoreTypes
    };
    user.isSetupComplete = true; // Mark onboarding complete
    await user.save();

    // Now actively trigger the first queue fetch!
    setImmediate(async () => {
      try {
        if (user.accessToken) {
            const emails = await fetchRecentEmails(user.accessToken, user.refreshToken, 10);
            if (emails.length > 0) {
              await addEmailProcessJobs(user._id, emails);
              console.log(`Successfully queued ${emails.length} emails after onboarding.`);
            }
        }
      } catch (e) {
        console.error("Background sync after onboarding failed", e.message);
      }
    });

    res.json({ message: 'Preferences saved securely. AI sync started.', user });
  } catch (error) {
    console.error('Preference Error:', error);
    res.status(500).json({ error: 'Failed to save preferences' });
  }
});

module.exports = router;
