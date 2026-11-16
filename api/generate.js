import Stripe from 'stripe';
import { GoogleGenAI, Type } from '@google/genai';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, tierId, resumeText, targetRole, jobDescription } = req.body;

    // Verify payment with Stripe before running AI
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return res.status(402).json({ error: 'Payment not verified.' });
    }

    const prompt = `You are an elite Executive Recruiter and Certified Professional Resume Writer (CPRW).
Transform the candidate's raw resume for the target role: "${targetRole || 'Target Corporate Role'}".
Package Tier: ${tierId.toUpperCase()} ($24 starter = resume + ATS audit; $49 pro = add tailored cover letter + LinkedIn rewrite; $89 executive = add 30-60-90 day leadership pitch + recruiter outreach messages).
${jobDescription ? `Target Job Description:\n${jobDescription}\n` : ''}
Candidate Raw Resume:\n${resumeText}

Rules:
- Quantify achievements using strong action verbs and STAR/XYZ impact formulas without fabricating fake employers or degrees.
- Optimize cleanly for modern ATS parsers (Workday, Greenhouse, iCIMS).
- Return strict JSON matching the schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            atsBeforeScore: { type: Type.INTEGER },
            atsAfterScore: { type: Type.INTEGER },
            missingKeywordsAdded: { type: Type.ARRAY, items: { type: Type.STRING } },
            recruiterSummary: { type: Type.STRING },
            rewrittenResume: { type: Type.STRING },
            coverLetter: { type: Type.STRING },
            linkedinAboutAndHeadline: { type: Type.STRING },
            thirtySixtyNinetyPitch: { type: Type.STRING },
            recruiterOutreachTemplates: { type: Type.STRING }
          },
          required: ['atsBeforeScore', 'atsAfterScore', 'missingKeywordsAdded', 'recruiterSummary', 'rewrittenResume']
        }
      }
    });

    return res.status(200).json(JSON.parse(response.text));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
