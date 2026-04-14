const cron = require('node-cron');
const User = require('./models/User');
const { fetchRecentEmails } = require('./services/gmailService');
const { addEmailProcessJobs } = require('./queue/emailQueue');

// Run every morning at 8:00 AM server time
const BATCH_TIME = '0 8 * * *';

console.log('Daily Cron Scheduler successfully initialized!');

cron.schedule(BATCH_TIME, async () => {
  console.log('Running background Daily Sync for all onboarded users...');
  
  try {
    // Only fetch users who completed setup
    const onboardedUsers = await User.find({ isSetupComplete: true, accessToken: { $exists: true } });
    
    console.log(`Found ${onboardedUsers.length} users configured for Daily AI updates.`);
    
    // Process them securely
    for (const user of onboardedUsers) {
      try {
        console.log(`Pulling background emails for user: ${user.email}`);
        const emails = await fetchRecentEmails(user.accessToken, user.refreshToken, 15); // Daily batch of 15 Unread
        
        if (emails.length > 0) {
            await addEmailProcessJobs(user._id, emails);
            console.log(`Successfully queued ${emails.length} emails for ${user.email}`);
        } else {
            console.log(`Inbox clear. Zero unread target emails for ${user.email}`);
        }
      } catch (err) {
        console.error(`Error processing background sync for user ${user._id}:`, err.message);
        // Continue iterating even if one user token fails
      }
    }
  } catch (error) {
    console.error('Fatal Scheduler Error:', error);
  }
});
