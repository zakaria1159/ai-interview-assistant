// src/pages/api/transcribe.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';
import formidable from 'formidable';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

type SuccessResponse = {
  success: true;
  transcription: string;
  duration?: number;
};

type ErrorResponse = {
  success: false;
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Parse the form data
    const form = formidable({
      maxFileSize: 25 * 1024 * 1024, // 25MB limit
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;

    if (!audioFile) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier audio fourni'
      });
    }

    // Check file size (Whisper has a 25MB limit)
    const stats = fs.statSync(audioFile.filepath);
    if (stats.size > 25 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'Fichier audio trop volumineux (max 25MB)'
      });
    }

    // Create a readable stream for OpenAI
    const audioStream = fs.createReadStream(audioFile.filepath);

    // Transcribe using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioStream,
      model: 'whisper-1',
      language: 'fr', // French language
      prompt: 'Il s\'agit d\'une réponse d\'entretien d\'embauche en français. Veuillez transcrire fidèlement les mots prononcés.',
      response_format: 'json',
      temperature: 0.0, // Most deterministic
    });

    // Clean up the temporary file
    try {
      fs.unlinkSync(audioFile.filepath);
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp file:', cleanupError);
    }

    // Basic validation and cleanup of transcription
    const cleanedText = transcription.text
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n+/g, ' '); // Replace newlines with spaces

    if (!cleanedText || cleanedText.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Transcription trop courte ou vide. Veuillez parler plus clairement.'
      });
    }

    // Optional: Calculate approximate duration (not always available)
    const duration = stats.size / (16000 * 2); // Rough estimate based on 16kHz 16-bit audio

    return res.status(200).json({
      success: true,
      transcription: cleanedText,
      duration: Math.round(duration)
    });

  } catch (error: any) {
    console.error('Transcription error:', error);

    // Handle specific OpenAI errors
    if (error?.error?.code === 'invalid_file_format') {
      return res.status(400).json({
        success: false,
        error: 'Format de fichier audio non supporté'
      });
    }

    if (error?.error?.code === 'file_too_large') {
      return res.status(400).json({
        success: false,
        error: 'Fichier audio trop volumineux'
      });
    }

    if (error?.error?.code === 'rate_limit_exceeded') {
      return res.status(429).json({
        success: false,
        error: 'Trop de demandes. Veuillez patienter avant de réessayer.'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la transcription audio'
    });
  }
}