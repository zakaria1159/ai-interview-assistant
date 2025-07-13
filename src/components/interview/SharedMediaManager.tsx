// src/components/interview/SharedMediaManager.tsx
import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';

interface MediaContextType {
  stream: MediaStream | null;
  hasPermissions: boolean;
  isInitializing: boolean;
  error: string | null;
  requestAccess: () => Promise<void>;
  stopStream: () => void;
}

const MediaContext = createContext<MediaContextType | null>(null);

export const useSharedMedia = () => {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error('useSharedMedia must be used within MediaProvider');
  }
  return context;
};

interface MediaProviderProps {
  children: React.ReactNode;
}

export const MediaProvider: React.FC<MediaProviderProps> = ({ children }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const requestAccess = useCallback(async () => {
    if (streamRef.current) {
      console.log('📺 Media stream already exists, reusing...');
      return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      console.log('🎥 Requesting shared media access (video + audio)...');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });

      console.log('✅ Shared media stream created successfully');
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setHasPermissions(true);
      
    } catch (err: any) {
      console.error('❌ Shared media access failed:', err);
      let errorMessage = 'Impossible d\'accéder à la caméra et au microphone';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Permission refusée. Autorisez l\'accès à la caméra et au microphone.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'Caméra ou microphone non trouvé.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Caméra/microphone déjà utilisé par une autre application.';
      }
      
      setError(errorMessage);
      setHasPermissions(false);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      console.log('⏹️ Stopping shared media stream...');
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStream(null);
      setHasPermissions(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  const value: MediaContextType = {
    stream,
    hasPermissions,
    isInitializing,
    error,
    requestAccess,
    stopStream
  };

  return (
    <MediaContext.Provider value={value}>
      {children}
    </MediaContext.Provider>
  );
};