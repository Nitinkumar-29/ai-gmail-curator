const { GoogleGenerativeAI } = require('@google/generative-ai');
const { classificationPrompt, batchClassificationPrompt } = require('../prompts/emailPrompts');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * AI Service to classify an email using Gemini
 */
const classifyEmail = async (emailData, userPreferences) => {
  try {
    const prompt = classificationPrompt(emailData, userPreferences);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", 
      systemInstruction: "You are a helpful, accurate, JSON-outputting assistant trained to classify emails strictly into JSON objects.",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    });

    const result = await model.generateContent(prompt);
    const parsedContent = JSON.parse(result.response.text());
    
    return parsedContent;
  } catch (error) {
    console.error('Error classifying email with AI:', error.message);
    throw error;
  }
};

const classifyEmailBatch = async (emailsArray, userPreferences) => {
  try {
    const prompt = batchClassificationPrompt(emailsArray, userPreferences);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", 
      systemInstruction: "You are a helpful, accurate, JSON-outputting assistant trained to classify emails strictly into a JSON Array of objects.",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Sometimes Gemini wraps JSON in markdown blocks even with mime type set
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedArray = JSON.parse(cleanedText);
    
    return Array.isArray(parsedArray) ? parsedArray : [parsedArray];
  } catch (error) {
    console.error('Error classifying email BATCH with AI:', error.message);
    throw error;
  }
};

module.exports = {
  classifyEmail,
  classifyEmailBatch
};
