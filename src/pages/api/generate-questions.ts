import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') return res.status(405).end();

  const { resumeText, jobPosting } = req.body;

  if (!resumeText || !jobPosting) {
    return res.status(400).json({ error: 'CV et offre d\'emploi requis' });
  }

  const prompt = `Tu es un recruteur expérimenté français. Génère 5 questions d'entretien pertinentes en français basées sur ce CV et cette offre d'emploi...

CV du candidat:
${resumeText.substring(0, 2000)}

Offre d'emploi:
${jobPosting.substring(0, 1500)}

Génère des questions qui:
1. Testent les compétences techniques mentionnées
2. Évaluent l'expérience pertinente  
3. Vérifient la motivation
4. Explorent les soft skills
5. Challengent le candidat de manière constructive

Réponds avec exactement 5 questions en français, une par ligne, sans numérotation.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.7,
    });

    const questionsText = response.choices[0].message.content ?? '';
    const questions = questionsText.split('\n').filter((q) => q.trim().length > 0);

    res.status(200).json({ success: true, questions });
  } catch (error) {
    console.error('OpenAI error:', error);
    res.status(500).json({ error: 'Erreur lors de la génération des questions' });
  }
}
