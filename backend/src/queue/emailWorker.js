const { Worker } = require('bullmq');
const EmailClassification = require('../models/EmailClassification');
const User = require('../models/User');
const { classifyEmailBatch } = require('../services/aiService');
const { connection } = require('./emailQueue');
const { markEmailAsRead } = require('../services/gmailService');

const emailWorker = new Worker('EmailProcessingQueue', async job => {
  const { userId, emails } = job.data; // Now expects batch array 'emails'

  console.log(`Processing BATCH of ${emails.length} emails for user ${userId}`);

  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Call the Batched AI Endpoint (1 API token overhead for up to 5 emails!)
    const resultsArray = await classifyEmailBatch(emails, user.botPreferences);

    // Strict 10-second delay per processing job loop to respect Rate Limits
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Iterate through AI responses and safely map back mapping email context
    for (const aiResult of resultsArray) {
      if(!aiResult || !aiResult.emailId) continue;
      
      const originalEmail = emails.find(e => e.emailId === aiResult.emailId);
      if(!originalEmail) continue; 

      try {
        await EmailClassification.create({
          emailId: originalEmail.emailId,
          userId: user._id,
          sender: originalEmail.sender,
          subject: originalEmail.subject,
          snippet: originalEmail.snippet,
          priority: aiResult.priority || 'none',
          category: aiResult.category || 'misc',
          summary: aiResult.summary || 'Summary unavailable.',
          actionableAdvice: aiResult.actionableAdvice || '',
          status: 'processed'
        });
        console.log(`Successfully mapped and saved ${originalEmail.emailId}`);
      } catch (err) {
         if (err.code === 11000) {
            // duplicate, silently ignore
         } else {
           console.error("Failed to map item:", err.message);
         }
      }
    }

    console.log(`Successfully finished batch job of ${emails.length} emails.`);
  } catch (error) {
     console.error(`Failed to process BATCH job ID ${job.id}:`, error.message);
     throw error;
  }
}, { connection, concurrency: 1 });

emailWorker.on('completed', job => {
  console.log(`Job ${job.id} completed successfully`);
});

emailWorker.on('failed', (job, err) => {
  console.log(`Job ${job.id} failed with error ${err.message}`);
});

module.exports = emailWorker;
