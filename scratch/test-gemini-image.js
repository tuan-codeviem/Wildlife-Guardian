require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  // Use a known horror image URL
  const testUrl = "https://th.bing.com/th/id/OIP.wR2L4zZ_eLw1wD0Kq_YnGwHaEK?rs=1&pid=ImgDetMain";
  
  console.log("Fetching image from Bing...");
  const resp = await fetch(testUrl);
  if (!resp.ok) {
     console.error("Failed to fetch image!");
     return;
  }
  const buffer = await resp.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  console.log("Base64 length:", base64.length);

  const prompt = `You are a content moderator for a wildlife social network.
Analyze the post content and image (if provided).
Flag the content if it contains:
- Extreme blood, gore, violence, horror, dead bodies, or severe injuries (BOTH human and animal). Allow normal veterinary/rescue pictures only if not excessively gory.
- Hate speech, harassment, severe toxicity, cursing, profanity, or illegal wildlife trade.
- Sexually explicit content.
- Spam or commercial advertisements.

IMPORTANT RULES:
- Do NOT flag pictures of humans with animals (e.g. a woman hugging a puppy) as sensitive. Human presence is safe.
- Do NOT flag normal non-gory animals as sensitive (e.g. monkeys, dogs, cats).

Return ONLY a valid JSON object with the exact following structure:
{
  "isSafe": boolean,
  "violationType": "none" | "violence" | "hate_speech" | "sexual" | "spam" | "illegal_trade" | "other",
  "reason": "short explanation in Vietnamese of why it was flagged or why it is safe"
}`;

  const parts = [
    { text: prompt },
    { text: `Post text content: ""` },
    { inlineData: { mimeType: 'image/jpeg', data: base64 } }
  ];

  try {
    const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: parts }],
      config: {
        responseMimeType: "application/json",
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
        ]
      }
    });
    console.log("Response:", aiResponse.text);
  } catch(e) {
    console.error("Error:", e.message);
  }
}

test();
