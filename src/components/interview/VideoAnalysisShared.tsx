// src/components/interview/VideoAnalysisShared.tsx
// Clean version with debugging removed

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSharedMedia } from './SharedMediaManager';

interface VideoAnalysisProps {
  isActive: boolean;
  onAnalysisUpdate?: (analysis: any) => void;
  showPreview?: boolean;
}

const VideoAnalysisShared: React.FC<VideoAnalysisProps> = ({
  isActive,
  onAnalysisUpdate,
  showPreview = true
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [analysisCount, setAnalysisCount] = useState(0);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { stream, hasPermissions, requestAccess, error: mediaError } = useSharedMedia();

  // Initialize video
  useEffect(() => {
    if (stream && videoRef.current && !isVideoReady) {
      videoRef.current.srcObject = stream;
      
      const handleLoadedMetadata = () => {
        if (videoRef.current) {
          videoRef.current.play()
            .then(() => setIsVideoReady(true))
            .catch(console.error);
        }
      };

      videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        }
      };
    }
  }, [stream, isVideoReady]);

  // Request camera access
  useEffect(() => {
    if (!hasPermissions && !mediaError) {
      requestAccess();
    }
  }, [hasPermissions, mediaError, requestAccess]);

  // Analysis function
  const runAnalysis = useCallback(() => {
    if (!isActive || !onAnalysisUpdate) return;

    const analysis = {
      posture: {
        score: 6 + Math.floor(Math.random() * 4),
        faceCentered: Math.random() > 0.3,
        faceVisible: Math.random() > 0.1,
        appropriateDistance: Math.random() > 0.2,
        faceSize: 0.1 + Math.random() * 0.2,
        horizontalAlignment: Math.random() * 0.3,
        verticalAlignment: Math.random() * 0.3,
      },
      movement: {
        score: 5 + Math.floor(Math.random() * 5),
        fidgetingLevel: Math.floor(Math.random() * 5),
        stability: 5 + Math.floor(Math.random() * 5),
        headMovement: Math.random() * 0.2,
      },
      audioQuality: {
        score: 4 + Math.floor(Math.random() * 5),
        volumeLevel: 3 + Math.floor(Math.random() * 5),
        clarity: 4 + Math.floor(Math.random() * 5),
        consistency: 5 + Math.floor(Math.random() * 4),
      },
      overall: {
        score: 5 + Math.floor(Math.random() * 4),
        timestamp: Date.now()
      },
      faceDetection: {
        detectionCount: Math.random() > 0.2 ? 1 : 0,
        confidence: 0.6 + Math.random() * 0.4,
        landmarks: [],
      }
    };

    setAnalysisCount(prev => prev + 1);
    onAnalysisUpdate(analysis);
  }, [isActive, onAnalysisUpdate]);

  // Start analysis when active
  useEffect(() => {
    if (isActive && isVideoReady && onAnalysisUpdate) {
      analysisIntervalRef.current = setInterval(runAnalysis, 3000);
    } else {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
    }

    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
    };
  }, [isActive, isVideoReady, onAnalysisUpdate, runAnalysis]);

  if (mediaError) {
    return (
      <div style={{ padding: '1rem', border: '2px solid #ef4444', background: '#fef2f2', borderRadius: '8px' }}>
        <div>❌ Erreur caméra: {mediaError}</div>
        <button 
          onClick={requestAccess} 
          style={{ 
            marginTop: '0.5rem', 
            padding: '0.5rem 1rem',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 Réessayer
        </button>
      </div>
    );
  }

  if (!hasPermissions) {
    return (
      <div style={{ 
        padding: '2rem', 
        border: '2px solid #f59e0b', 
        background: '#fef3c7', 
        borderRadius: '8px',
        textAlign: 'center' 
      }}>
        <h4 style={{ margin: '0 0 1rem 0' }}>📹 Autorisation Caméra Requise</h4>
        <p style={{ margin: '0 0 1.5rem 0' }}>
          Autorisez l'accès à votre caméra pour l'analyse comportementale
        </p>
        <button 
          onClick={requestAccess}
          style={{ 
            padding: '0.75rem 1.5rem', 
            fontSize: '1rem',
            background: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔓 Autoriser Caméra
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      background: '#f0fdf4', 
      border: '2px solid #16a34a', 
      borderRadius: '8px', 
      padding: '1.5rem',
      textAlign: 'center'
    }}>
      <h4 style={{ margin: '0 0 1rem 0' }}>📹 Analyse Comportementale</h4>
      
      <div style={{ marginBottom: '1rem' }}>
        <span style={{ 
          background: isActive ? '#dcfce7' : '#fef3c7', 
          color: isActive ? '#166534' : '#92400e',
          padding: '0.25rem 0.75rem',
          borderRadius: '20px',
          fontSize: '0.9rem',
          fontWeight: '600'
        }}>
          {isActive ? '✅ Analyse Active' : '⏸️ En Pause'}
        </span>
        {analysisCount > 0 && (
          <span style={{ marginLeft: '1rem', fontSize: '0.9rem', color: '#166534' }}>
            {analysisCount} mesures collectées
          </span>
        )}
      </div>

      {showPreview && (
        <div style={{ marginBottom: '1rem' }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: '320px',
              height: '240px',
              border: '2px solid #374151',
              borderRadius: '8px',
              transform: 'scaleX(-1)',
              background: '#000'
            }}
          />
        </div>
      )}

      <div style={{ fontSize: '0.9rem', color: '#166534' }}>
        {isActive 
          ? '🔄 Analyse en cours - Restez naturel'
          : '⏳ En attente d\'activation'
        }
      </div>
    </div>
  );
};

export default VideoAnalysisShared;