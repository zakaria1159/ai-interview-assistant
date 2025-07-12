// src/components/interview/TextToSpeech.tsx
import React, { useState, useEffect, useRef } from 'react';

interface TextToSpeechProps {
  text: string;
  autoPlay?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

// Available OpenAI TTS voices with descriptions
const AVAILABLE_VOICES = [
  { id: 'nova', name: 'Nova', description: 'Voix féminine professionnelle (recommandée)' },
  { id: 'alloy', name: 'Alloy', description: 'Voix neutre polyvalente' },
  { id: 'echo', name: 'Echo', description: 'Voix masculine claire' },
  { id: 'fable', name: 'Fable', description: 'Voix féminine expressive' },
  { id: 'onyx', name: 'Onyx', description: 'Voix masculine profonde' },
  { id: 'shimmer', name: 'Shimmer', description: 'Voix féminine douce' },
];

const TextToSpeech: React.FC<TextToSpeechProps> = ({
  text,
  autoPlay = false,
  onStart,
  onEnd,
  onError
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('nova'); // Professional female voice
  const [speed, setSpeed] = useState(0.9); // Slightly slower for interviews
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (autoPlay && text && !isPlaying && !isGenerating) {
      // Small delay to ensure component is ready
      const timer = setTimeout(() => {
        handleSpeak();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [text, autoPlay]);

  // Cleanup audio URL when component unmounts
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  const generateAudio = async (): Promise<string> => {
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice: selectedVoice,
          speed: speed,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }

      // Get audio blob from response
      const audioBlob = await response.blob();
      
      // Create object URL for the audio
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Clean up previous URL
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      audioUrlRef.current = audioUrl;
      
      return audioUrl;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSpeak = async () => {
    if (!text) {
      onError?.('Aucun texte à lire');
      return;
    }

    try {
      setIsPlaying(true);
      onStart?.();

      // Generate audio
      const audioUrl = await generateAudio();

      // Create and configure audio element
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Set up event listeners
      audio.onended = () => {
        setIsPlaying(false);
        onEnd?.();
      };

      audio.onerror = () => {
        setIsPlaying(false);
        onError?.('Erreur lors de la lecture audio');
      };

      // Play audio
      await audio.play();

    } catch (error) {
      console.error('TTS Error:', error);
      setIsPlaying(false);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la génération audio';
      onError?.(errorMessage);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const isProcessing = isGenerating || isPlaying;

  return (
    <div className="text-to-speech">
      <div className="tts-controls">
        {!isProcessing ? (
          <button
            onClick={handleSpeak}
            className="btn btn-secondary"
            title="Écouter la question avec une voix IA naturelle"
          >
            🔊 Écouter la question
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="btn btn-outline"
            title="Arrêter la lecture"
            disabled={isGenerating}
          >
            ⏹️ Arrêter
          </button>
        )}
      </div>

      {/* Voice and Speed Controls */}
      <div className="tts-settings">
        <div className="voice-selector">
          <label htmlFor="voice-select" className="setting-label">Voix IA:</label>
          <select
            id="voice-select"
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="voice-select"
            disabled={isProcessing}
          >
            {AVAILABLE_VOICES.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.name} - {voice.description}
              </option>
            ))}
          </select>
        </div>

        <div className="speed-selector">
          <label htmlFor="speed-select" className="setting-label">Vitesse:</label>
          <select
            id="speed-select"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="speed-select"
            disabled={isProcessing}
          >
            <option value={0.75}>Lente</option>
            <option value={0.9}>Normale (recommandée)</option>
            <option value={1.0}>Standard</option>
            <option value={1.25}>Rapide</option>
          </select>
        </div>
      </div>

      {/* Status Display */}
      {isGenerating && (
        <div className="tts-status generating">
          <div className="spinner"></div>
          <span>Génération de la voix IA...</span>
        </div>
      )}

      {isPlaying && (
        <div className="tts-status playing">
          <div className="speaking-indicator">
            <div className="wave"></div>
            <div className="wave"></div>
            <div className="wave"></div>
          </div>
          <span>🤖 L'IA vous pose la question...</span>
        </div>
      )}

      <style jsx>{`
        .text-to-speech {
          margin: 1rem 0;
          text-align: center;
        }

        .tts-controls {
          margin-bottom: 1rem;
        }

        .tts-settings {
          display: flex;
          gap: 1rem;
          justify-content: center;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .voice-selector,
        .speed-selector {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .setting-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--gray-600);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .voice-select,
        .speed-select {
          padding: 0.5rem;
          border: 2px solid var(--gray-300);
          background: var(--white);
          font-size: 0.8rem;
          border-radius: 0;
          min-width: 200px;
        }

        .voice-select:focus,
        .speed-select:focus {
          border-color: var(--yellow);
          outline: none;
        }

        .voice-select:disabled,
        .speed-select:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .speed-select {
          min-width: 120px;
        }

        .tts-status {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          font-weight: 600;
          color: var(--black);
        }

        .tts-status.generating {
          background: var(--gray-50);
          border: 2px solid var(--gray-300);
          color: var(--gray-700);
        }

        .tts-status.playing {
          background: var(--yellow-light);
          border: 2px solid var(--yellow);
        }

        .speaking-indicator {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .wave {
          width: 3px;
          height: 12px;
          background: var(--black);
          animation: wave 1.2s infinite ease-in-out;
        }

        .wave:nth-child(2) {
          animation-delay: 0.1s;
        }

        .wave:nth-child(3) {
          animation-delay: 0.2s;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid var(--gray-300);
          border-top: 2px solid var(--gray-600);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes wave {
          0%, 40%, 100% {
            transform: scaleY(0.4);
          }
          20% {
            transform: scaleY(1);
          }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .tts-settings {
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .voice-select {
            min-width: 100%;
            max-width: 300px;
          }
        }
      `}</style>
    </div>
  );
};

export default TextToSpeech;