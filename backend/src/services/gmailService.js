const { google } = require('googleapis');

/**
 * Creates an OAuth2 client configured for Google API
 */
const getOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

/**
 * Fetch unread or recent emails using Gmail API
 */
const fetchRecentEmails = async (accessToken, refreshToken, maxResults = 10) => {
  const oauth2Client = getOAuth2Client();
  
  // Set credentials
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  try {
    // List messages
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: 'is:unread' // Only fetch unread messages as MVP rule
    });

    const messages = response.data.messages || [];
    
    // Fetch individual email details
    const emailDetails = await Promise.all(
      messages.map(async (msg) => {
        const msgDetail = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'full'
        });
        
        return extractEmailData(msgDetail.data);
      })
    );

    return emailDetails;

  } catch (error) {
    console.error('Error fetching emails from Gmail:', error.message);
    throw error;
  }
};

/**
 * Helper to extract sender, subject, body from Gmail response payload
 */
const extractEmailData = (message) => {
  const headers = message.payload.headers;
  
  const subjectHeader = headers.find(h => h.name === 'Subject');
  const fromHeader = headers.find(h => h.name === 'From');
  
  const subject = subjectHeader ? subjectHeader.value : 'No Subject';
  const sender = fromHeader ? fromHeader.value : 'Unknown Sender';
  
  let body = '';
  
  const getBodyParts = (parts) => {
    parts.forEach(part => {
      // Prioritize plain text parsing for LLMs to reduce tokens
      if (part.mimeType === 'text/plain' && part.body.data) {
        body += Buffer.from(part.body.data, 'base64').toString('utf8');
      } else if (part.parts) {
        getBodyParts(part.parts);
      }
    });
  };

  if (message.payload.parts) {
    getBodyParts(message.payload.parts);
  } else if (message.payload.body && message.payload.body.data) {
    body = Buffer.from(message.payload.body.data, 'base64').toString('utf8');
  }

  return {
    emailId: message.id,
    snippet: message.snippet,
    subject,
    sender,
    body: body.trim()
  };
};

/**
 * Removes the UNREAD label from a specific email
 */
const markEmailAsRead = async (accessToken, refreshToken, emailId) => {
  const oauth2Client = getOAuth2Client();
  
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  try {
    await gmail.users.messages.modify({
      userId: 'me',
      id: emailId,
      requestBody: {
        removeLabelIds: ['UNREAD']
      }
    });
    console.log(`Successfully removed UNREAD label from Gmail: ${emailId}`);
  } catch (error) {
    console.error(`Failed to mark email ${emailId} as read:`, error.message);
    throw error;
  }
};

module.exports = {
  getOAuth2Client,
  fetchRecentEmails,
  markEmailAsRead
};
