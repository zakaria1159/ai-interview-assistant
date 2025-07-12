// src/pages/api/text-to-speech.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

type ErrorResponse = {
  success: false;
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Buffer | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { text, voice = 'alloy', speed = 1.0 } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Texte requis pour la synthèse vocale'
    });
  }

  if (text.length > 4096) {
    return res.status(400).json({
      success: false,
      error: 'Texte trop long (max 4096 caractères)'
    });
  }

  try {
    console.log('Generating TTS for text:', text.substring(0, 100) + '...');

    // Generate speech using OpenAI TTS
    const response = await openai.audio.speech.create({
      model: 'tts-1', // or 'tts-1-hd' for higher quality (slower)
      voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
      input: text,
      response_format: 'mp3',
      speed: Math.max(0.25, Math.min(4.0, speed)), // Clamp between 0.25 and 4.0
    });

    // Convert response to buffer
    const audioBuffer = Buffer.from(await response.arrayBuffer());

    // Set headers for audio response
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Send audio directly as buffer
    return res.status(200).end(audioBuffer);

  } catch (error: any) {
    console.error('TTS generation error:', error);

    // Handle specific OpenAI errors
    if (error?.error?.code === 'rate_limit_exceeded') {
      return res.status(429).json({
        success: false,
        error: 'Trop de demandes. Veuillez patienter avant de réessayer.'
      });
    }

    if (error?.error?.code === 'insufficient_quota') {
      return res.status(402).json({
        success: false,
        error: 'Quota API dépassé.'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération audio'
    });
  }
}