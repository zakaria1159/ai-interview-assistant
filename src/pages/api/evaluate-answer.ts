// src/pages/api/evaluate-answer.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

type EvaluationScores = {
  pertinence: number;
  clarté: number;
  exemples: number;
  compétences: number;
  professionnalisme: number;
};

type EvaluationResult = {
  scores: EvaluationScores;
  feedback: string;
  suggestions: string;
  overall_score: number;
};

type SuccessResponse = {
  success: true;
  evaluation: EvaluationResult;
};

type ErrorResponse = {
  success?: false;
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== 'POST') return res.status(405).end();

  const { question, answer, context } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ error: 'Question et réponse requises' });
  }

  const prompt = `En tant qu'expert RH français avec 15 ans d'expérience, évaluez rigoureusement cette réponse d'entretien d'embauche.

QUESTION POSÉE: ${question}
RÉPONSE DU CANDIDAT: ${answer}

CRITÈRES D'ÉVALUATION STRICTS (notes de 1 à 10):

1. PERTINENCE (1-10):
   - 1-2: Réponse hors sujet, ne répond pas du tout à la question
   - 3-4: Réponse partiellement en rapport mais manque le point principal  
   - 5-6: Réponse correcte mais superficielle
   - 7-8: Réponse bien ciblée et complète
   - 9-10: Réponse parfaitement adaptée et dépassant les attentes

2. CLARTÉ (1-10):
   - 1-2: Incompréhensible, confus, incohérent
   - 3-4: Difficile à suivre, manque de structure
   - 5-6: Compréhensible mais peut être amélioré
   - 7-8: Clair et bien structuré
   - 9-10: Parfaitement articulé et logique

3. EXEMPLES (1-10):
   - 1-2: Aucun exemple ou exemples non pertinents
   - 3-4: Exemples vagues ou peu convaincants
   - 5-6: Exemples corrects mais manquent de détails
   - 7-8: Bons exemples concrets et détaillés
   - 9-10: Exemples exceptionnels, très convaincants

4. COMPÉTENCES (1-10):
   - 1-2: Aucune compétence démontrée
   - 3-4: Compétences faibles ou mal exprimées
   - 5-6: Compétences de base démontrées
   - 7-8: Bonnes compétences techniques/métier
   - 9-10: Compétences exceptionnelles et leadership

5. PROFESSIONNALISME (1-10):
   - 1-2: Langage inapproprié, attitude non professionnelle
   - 3-4: Quelques problèmes de ton ou d'expression
   - 5-6: Professionnalisme de base respecté
   - 7-8: Très professionnel dans l'expression
   - 9-10: Professionnalisme exemplaire

RÈGLES IMPORTANTES:
- Si la réponse ne répond PAS à la question posée, la pertinence doit être ≤ 3
- Si la réponse répète simplement la question, tous les scores doivent être ≤ 2
- Si la réponse est incohérente ou hors sujet, aucun score ne peut dépasser 4
- Soyez rigoureux: un score de 7+ nécessite une réelle qualité
- Un score de 9+ est exceptionnel et rare

Calculez l'overall_score comme la moyenne des 5 scores.

Répondez UNIQUEMENT avec ce format JSON exact:
{
  "scores": {
    "pertinence": X,
    "clarté": X,
    "exemples": X,
    "compétences": X,
    "professionnalisme": X
  },
  "feedback": "Analyse détaillée en français expliquant pourquoi ces scores ont été attribués",
  "suggestions": "Conseils concrets et spécifiques pour améliorer cette réponse",
  "overall_score": X.X
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.1, // Reduced for more consistent scoring
    });

    const raw = response.choices[0]?.message?.content ?? '';

    try {
      const parsed: EvaluationResult = JSON.parse(raw);
      
      // Validation to ensure scores are within range
      const validatedScores = {
        pertinence: Math.max(1, Math.min(10, parsed.scores.pertinence)),
        clarté: Math.max(1, Math.min(10, parsed.scores.clarté)),
        exemples: Math.max(1, Math.min(10, parsed.scores.exemples)),
        compétences: Math.max(1, Math.min(10, parsed.scores.compétences)),
        professionnalisme: Math.max(1, Math.min(10, parsed.scores.professionnalisme)),
      };

      // Recalculate overall score to ensure accuracy
      const overall = (
        validatedScores.pertinence +
        validatedScores.clarté +
        validatedScores.exemples +
        validatedScores.compétences +
        validatedScores.professionnalisme
      ) / 5;

      const validatedEvaluation: EvaluationResult = {
        scores: validatedScores,
        feedback: parsed.feedback || "Feedback non disponible",
        suggestions: parsed.suggestions || "Suggestions non disponibles",
        overall_score: Math.round(overall * 10) / 10, // Round to 1 decimal
      };

      res.status(200).json({ success: true, evaluation: validatedEvaluation });
    } catch (parseError) {
      console.error('JSON parsing error:', parseError, 'Raw response:', raw);
      res.status(200).json({
        success: true,
        evaluation: {
          scores: {
            pertinence: 1,
            clarté: 1,
            exemples: 1,
            compétences: 1,
            professionnalisme: 1,
          },
          feedback: "Erreur d'évaluation: impossible d'analyser la réponse correctement.",
          suggestions: "Veuillez reformuler votre réponse de manière plus claire et structurée.",
          overall_score: 1.0,
        },
      });
    }
  } catch (error) {
    console.error('OpenAI error:', error);
    res.status(500).json({ error: "Erreur lors de l'évaluation" });
  }
}