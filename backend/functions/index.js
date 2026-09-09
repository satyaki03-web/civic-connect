const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { GoogleGenAI } = require('@google/genai');

admin.initializeApp();

// Initialize the Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.assessIncidentPriority = functions.firestore
  .document('reports/{reportId}')
  .onCreate(async (snap, context) => {
    const reportData = snap.data();
    const description = reportData.description;

    if (!description) {
      console.log('No description provided for priority assessment.');
      return null;
    }

    try {
      // Call Google AI Studio (Gemini)
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are an urban planner assistant. Analyze the following civic issue report description and assess its priority. Respond with ONLY one of these three words: High, Medium, or Low.\n\nDescription: "${description}"`,
      });

      const rawText = response.text().trim();
      
      let priority = 'Medium';
      if (rawText.includes('High')) priority = 'High';
      else if (rawText.includes('Low')) priority = 'Low';

      return snap.ref.update({
        priority: priority,
        aiAssessed: true,
        assessedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
    } catch (error) {
      console.error('Error invoking Gemini API:', error);
      return snap.ref.update({ priority: 'Medium', aiAssessed: false });
    }
  });
