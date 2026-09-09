import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Cloudinary Configuration
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for base64 images
  app.use(express.json({ limit: '50mb' }));

  // API Route: Process Image (Cloudinary + Gemini)
  app.post("/api/analyze-hazard", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      
      if (!imageBase64) {
        return res.status(400).json({ error: "No image provided" });
      }

      let imageUrl = null;
      
      // 1. Meaningful Cloudinary Implementation
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        try {
          console.log("Uploading to Cloudinary...");
          const uploadResult = await cloudinary.uploader.upload(imageBase64, {
            folder: "civic-connect/reports",
            resource_type: "image"
          });
          imageUrl = uploadResult.secure_url;
        } catch (cloudinaryErr) {
          console.error("Cloudinary upload failed:", cloudinaryErr);
          // Continue with base64 for AI if upload fails
        }
      }

      // 2. Gemini Analysis
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const prompt = `Analyze this image of a potential civic or urban hazard (like a pothole, damaged road, blocked road, graffiti, broken streetlight, or illegal waste dumping).
Respond ONLY with a valid JSON object (do NOT wrap in markdown blocks like \`\`\`json) with the following three keys:
- "category": A short, 1-3 word classification of the issue (e.g., "Pothole", "Waste Dumping", "Road Damage", "Graffiti").
- "priority": Only one of: "Low", "Medium", or "High". Assess this based on the danger to public safety.
- "desc": A one-sentence description of the hazard and its apparent severity.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [prompt, { inlineData: { data: base64Data, mimeType: 'image/jpeg' } }]
      });

      const rawText = response.text().trim();
      let parsed;
      try {
        parsed = JSON.parse(rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
      } catch (e) {
        parsed = { category: "Unclassified Hazard", priority: "Medium", desc: "Analysis failed." };
      }

      // Return both AI analysis and the secure Cloudinary URL
      res.json({ ...parsed, uploadedUrl: imageUrl });
    } catch (error) {
      console.error("Error analyzing image:", error);
      res.status(500).json({ error: "Failed to analyze image" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
