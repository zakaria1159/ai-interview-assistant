// src/components/interview/VoiceRecorderShared.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useSharedMedia } from './SharedMediaManager';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  onRecordingChange: (isRecording: boolean) => void;
  isProcessing: boolean;
}

const VoiceRecorderShared: React.FC<VoiceRecorderProps> = ({
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

  // Use shared media stream
  const { stream, hasPermissions, requestAccess, error: mediaError } = useSharedMedia();

  useEffect(() => {
    // Request access when component mounts
    if (!hasPermissions && !mediaError) {
      requestAccess();
    }
  }, [hasPermissions, mediaError, requestAccess]);

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
    if (!stream) {
      console.error('❌ No media stream available for recording');
      alert('Aucun flux média disponible. Veuillez autoriser l\'accès à la caméra et au microphone.');
      return;
    }

    try {
      console.log('🎙️ Starting voice recording with shared stream...');

      // Get audio tracks from shared stream
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('Aucune piste audio disponible dans le flux partagé');
      }

      // Create audio-only stream from shared stream
      const audioStream = new MediaStream(audioTracks);

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

      console.log('🎵 Using MIME type:', supportedMimeType);

      const mediaRecorder = new MediaRecorder(audioStream, {
        mimeType: supportedMimeType
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Set up event handlers before starting
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          console.log('🎵 Audio chunk received:', event.data.size, 'bytes');
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('🎵 Recording stopped, processing...');
        const audioBlob = new Blob(chunksRef.current, { 
          type: supportedMimeType 
        });
        
        console.log('🎵 Final audio blob:', audioBlob.size, 'bytes', audioBlob.type);
        
        // Process the audio
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.onerror = (event) => {
        console.error('🎵 MediaRecorder error:', event);
        setIsRecording(false);
        onRecordingChange(false);
      };

      // Start recording
      mediaRecorder.start(1000); // 1 second chunks
      setIsRecording(true);
      onRecordingChange(true);
      setRecordingTime(0);

      console.log('✅ Voice recording started successfully');

      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('❌ Error starting recording:', error);
      setIsRecording(false);
      onRecordingChange(false);
      
      const errorMessage = error instanceof Error ? error.message : 'Erreur: Impossible d\'enregistrer.';
      alert(`${errorMessage} Assurez-vous que la caméra et le microphone sont autorisés.`);
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
      // More lenient validation
      if (recordingTime < 1) {
        console.warn('Short recording detected:', recordingTime, 'seconds');
      }

      if (audioBlob.size < 500) {
        throw new Error('Enregistrement vide. Veuillez maintenir le bouton et parler plus longtemps.');
      }

      console.log('🎵 Transcribing audio:', {
        size: audioBlob.size,
        type: audioBlob.type,
        duration: recordingTime
      });

      const formData = new FormData();
      formData.append('audio', audioBlob, `recording-${Date.now()}.webm`);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('🎵 Transcription response:', data);

      if (data.success && data.transcription) {
        console.log('✅ Transcription successful:', data.transcription);
        onTranscription(data.transcription);
      } else {
        console.error('❌ Transcription failed:', data.error);
        throw new Error(data.error || 'Erreur de transcription');
      }
    } catch (error) {
      console.error('❌ Transcription error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la transcription. Veuillez réessayer.';
      
      if (errorMessage.includes('trop court') || errorMessage.includes('vide')) {
        alert('⚠️ Enregistrement trop court. Conseil: Parlez pendant au moins 3 secondes de manière claire.');
      } else if (errorMessage.includes('rate_limit')) {
        alert('⚠️ Trop de demandes. Patientez 10 secondes et réessayez.');
      } else {
        alert(`⚠️ ${errorMessage}\n\nConseils:\n- Parlez plus fort et plus clairement\n- Vérifiez votre connexion internet\n- Réessayez dans quelques secondes`);
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const canStartRecording = hasPermissions && !isRecording && !isTranscribing && !isProcessing && stream;
  const canStopRecording = isRecording && !isTranscribing;

  if (mediaError) {
    return (
      <div className="voice-recorder">
        <div className="recorder-error">
          <p>❌ {mediaError}</p>
          <button onClick={requestAccess} className="btn btn-primary">
            🔄 Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!hasPermissions) {
    return (
      <div className="voice-recorder">
        <div className="recorder-setup">
          <p>🎥 Autorisation caméra/microphone requise</p>
          <button onClick={requestAccess} className="btn btn-primary">
            🔓 Autoriser l'accès
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="voice-recorder">
      <div className="recorder-controls">
        {!isRecording && !isTranscribing ? (
          <button
            onClick={startRecording}
            disabled={!canStartRecording}
            className="record-button start"
            title="Commencer l'enregistrement vocal (utilise le micro partagé)"
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
          padding: 1.5rem;
          border: 2px dashed var(--gray-300);
          background: var(--gray-50);
          text-align: center;
        }

        .recorder-error,
        .recorder-setup {
          padding: 1rem;
          text-align: center;
        }

        .recorder-error p {
          color: #dc2626;
          margin-bottom: 1rem;
        }

        .recorder-setup p {
          color: var(--gray-600);
          margin-bottom: 1rem;
        }

        .recorder-controls {
          margin-bottom: 1rem;
        }

        .record-button {
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          border: 2px solid var(--black);
          border-radius: 0;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 600;
          font-family: var(--font-sans);
        }

        .record-button.start {
          background: var(--yellow);
          color: var(--black);
        }

        .record-button.start:hover:not(:disabled) {
          background: var(--yellow-dark);
          transform: translateY(-2px);
          box-shadow: 4px 4px 0 var(--black);
        }

        .record-button.stop {
          background: var(--gray-800);
          color: var(--white);
        }

        .record-button.stop:hover:not(:disabled) {
          background: var(--black);
          transform: translateY(-2px);
          box-shadow: 4px 4px 0 var(--gray-600);
        }

        .record-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .recording-status {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: var(--white);
          border: 2px solid var(--black);
          margin-top: 0.5rem;
        }

        .recording-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          color: var(--black);
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          background: var(--gray-800);
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }

        .recording-time {
          font-family: monospace;
          font-weight: 700;
          color: var(--black);
          font-size: 1.1rem;
        }

        .transcribing-status {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
          color: var(--gray-600);
          font-weight: 600;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid var(--gray-300);
          border-top: 2px solid var(--black);
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

export default VoiceRecorderShared;