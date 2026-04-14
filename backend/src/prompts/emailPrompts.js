const classificationPrompt = (emailContent, userPreferences) => `
You are an intelligent email processing assistant. Your task is to analyze the following email and output a strictly formatted JSON object.

USER PREFERENCES:
- Prioritize: ${userPreferences.prioritizeTypes.join(', ')}
- Ignore: ${userPreferences.ignoreTypes.join(', ')}

EMAIL DATA:
Sender: ${emailContent.sender}
Subject: ${emailContent.subject}
Snippet/Body: ${emailContent.body.substring(0, 1000)}...

Based on the email data and user preferences, please provide a JSON response evaluating the email. Do not include any text outside the JSON. The JSON structure should be:
{
  "priority": "high" | "medium" | "low" | "none",
  "category": "string", // Best single-word fitting class (e.g. "job", "newsletter", "promotion", "personal")
  "summary": "string", // A 1-2 sentence maximum summary of the email
  "actionableAdvice": "string" // A brief suggested action (e.g., "Reply to schedule interview", "Ignore", "Read later")
}
`;

const batchClassificationPrompt = (emailsArray, userPreferences) => `
You are an intelligent email processing assistant. Your task is to analyze the following batch of emails and output a strictly formatted JSON array containing exactly one mapped evaluation object per email.

USER PREFERENCES:
- Prioritize: ${userPreferences.prioritizeTypes.join(', ')}
- Ignore: ${userPreferences.ignoreTypes.join(', ')}

EMAILS BATCH:
${emailsArray.map((e, idx) => `
[Email Index: ${idx}]
Email ID: ${e.emailId}
Sender: ${e.sender}
Subject: ${e.subject}
Snippet/Body: ${Math.max(10, e.body ? e.body.length : 0) ? e.body.substring(0, 600) : ''}...
`).join('\n---\n')}

Based on the batch of emails and user preferences, please provide a JSON Array response evaluating EACH email. Your output MUST be a valid JSON array of objects. Do not include any text outside the JSON array. The JSON array structure should perfectly match:
[
  {
    "emailId": "exact_email_id_from_above",
    "priority": "high" | "medium" | "low" | "none",
    "category": "string",
    "summary": "string",
    "actionableAdvice": "string"
  }
]
`;

module.exports = {
  classificationPrompt,
  batchClassificationPrompt
};
