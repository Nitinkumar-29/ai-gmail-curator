const { Queue } = require('bullmq');

const connection = {
  url: process.env.REDIS_URI || 'redis://localhost:6379'
};

const emailQueue = new Queue('EmailProcessingQueue', { connection });

const EmailClassification = require('../models/EmailClassification');

const addEmailProcessJobs = async (userId, emails) => {
  const filteredEmails = [];
  
  // Step 1: Pre-filter Loop
  for (const email of emails) {
    const sender = email.sender.toLowerCase();
    const bodyStr = (email.snippet + (email.body || '')).toLowerCase();
    
    // Refined heuristic: Only trap explicit pure marketing domains, leaving no-reply open for Job Platforms
    if (sender.includes('marketing@') || sender.includes('newsletter@')) {
      // It's a standard marketing email. Bypass AI API!
      await EmailClassification.create({
        emailId: email.emailId,
        userId: userId,
        sender: email.sender,
        subject: email.subject,
        snippet: email.snippet,
        priority: 'none',
        category: 'promotion',
        summary: 'System pre-filtered matching standard mass-mailer heuristic patterns (unsubscribe / no-reply).',
        actionableAdvice: 'Ignore',
        status: 'processed'
      }).catch(err => { if(err.code !== 11000) console.error(err) });
      
      console.log(`Pre-filtered obvious mass email: ${email.subject}`);
    } else {
      // Worthy of expensive AI processing
      filteredEmails.push(email);
    }
  }

  // Step 2: Batch the remaining into chunks of 5
  if (filteredEmails.length === 0) return;
  
  const BATCH_SIZE = 5;
  const jobs = [];
  
  for (let i = 0; i < filteredEmails.length; i += BATCH_SIZE) {
    const batch = filteredEmails.slice(i, i + BATCH_SIZE);
    jobs.push({
      name: 'process-email-batch',
      data: { userId, emails: batch }
    });
  }

  await emailQueue.addBulk(jobs);
  console.log(`Queued ${jobs.length} batch jobs to process ${filteredEmails.length} emails securely.`);
};

module.exports = {
  emailQueue,
  connection,
  addEmailProcessJobs
};
