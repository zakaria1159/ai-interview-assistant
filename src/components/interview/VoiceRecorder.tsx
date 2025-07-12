// src/components/interview/VoiceRecorder.tsx
import React, { useState, useRef, useEffect } from 'react';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  onRecordingChange: (isRecording: boolean) => void;
  isProcessing: boolean;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscription,
  onRecordingChange,
  isProcessing
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      // Check if browser supports media recording
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Votre navigateur ne supporte pas l\'enregistrement audio.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });

      // Check supported MIME types
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus'
      ];
      
      const supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
      
      if (!supportedMimeType) {
        throw new Error('Aucun format audio supporté trouvé.');
      }

      console.log('Using MIME type:', supportedMimeType);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: supportedMimeType
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          console.log('Audio chunk received:', event.data.size, 'bytes');
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { 
          type: supportedMimeType 
        });
        
        console.log('Final audio blob:', audioBlob.size, 'bytes', audioBlob.type);
        
        stream.getTracks().forEach(track => track.stop());
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start(1000); // Record in 1s chunks for better reliability
      setIsRecording(true);
      onRecordingChange(true);
      setRecordingTime(0);

      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur: Impossible d\'accéder au microphone.';
      alert(`${errorMessage} Vérifiez les permissions de votre navigateur.`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
    onRecordingChange(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    
    try {
      // Check if recording is too short (less than 1 second)
      if (recordingTime < 1) {
        throw new Error('Enregistrement trop court. Parlez pendant au moins 2 secondes.');
      }

      // Check if audio blob is too small
      if (audioBlob.size < 1000) { // Less than 1KB
        throw new Error('Enregistrement vide ou trop court. Veuillez réessayer.');
      }

      console.log('Audio blob size:', audioBlob.size, 'bytes');
      console.log('Recording duration:', recordingTime, 'seconds');

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('Transcription response:', data);

      if (data.success && data.transcription) {
        onTranscription(data.transcription);
      } else {
        throw new Error(data.error || 'Erreur de transcription');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la transcription. Veuillez réessayer.';
      alert(errorMessage);
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const canStartRecording = !isRecording && !isTranscribing && !isProcessing;
  const canStopRecording = isRecording && !isTranscribing;

  return (
    <div className="voice-recorder">
      <div className="recorder-controls">
        {!isRecording && !isTranscribing ? (
          <button
            onClick={startRecording}
            disabled={!canStartRecording}
            className="record-button start"
            title="Commencer l'enregistrement vocal"
          >
            🎤 Enregistrer
          </button>
        ) : (
          <button
            onClick={stopRecording}
            disabled={!canStopRecording}
            className="record-button stop"
            title="Arrêter l'enregistrement"
          >
            ⏹️ Arrêter
          </button>
        )}
      </div>

      {isRecording && (
        <div className="recording-status">
          <div className="recording-indicator">
            <div className="pulse-dot"></div>
            <span>Enregistrement en cours...</span>
          </div>
          <div className="recording-time">
            {formatTime(recordingTime)}
          </div>
        </div>
      )}

      {isTranscribing && (
        <div className="transcribing-status">
          <div className="spinner"></div>
          <span>Transcription en cours...</span>
        </div>
      )}

      <style jsx>{`
        .voice-recorder {
          margin: 1rem 0;
          padding: 1rem;
          border: 2px dashed #e5e7eb;
          border-radius: 8px;
          text-align: center;
          background: #f9fafb;
        }

        .recorder-controls {
          margin-bottom: 1rem;
        }

        .record-button {
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
        }

        .record-button.start {
          background: #10b981;
          color: white;
        }

        .record-button.start:hover:not(:disabled) {
          background: #059669;
        }

        .record-button.stop {
          background: #ef4444;
          color: white;
        }

        .record-button.stop:hover:not(:disabled) {
          background: #dc2626;
        }

        .record-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .recording-status {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 1rem;
          background: white;
          border-radius: 6px;
          margin-top: 0.5rem;
        }

        .recording-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }

        .recording-time {
          font-family: monospace;
          font-weight: bold;
          color: #ef4444;
        }

        .transcribing-status {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.5rem;
          color: #6b7280;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #e5e7eb;
          border-top: 2px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default VoiceRecorder;