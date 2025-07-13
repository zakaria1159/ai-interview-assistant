// src/components/interview/VideoAnalysisDebug.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSharedMedia } from './SharedMediaManager';

interface VideoAnalysisProps {
  isActive: boolean;
  onAnalysisUpdate?: (analysis: any) => void;
  showPreview?: boolean;
}

const VideoAnalysisDebug: React.FC<VideoAnalysisProps> = ({
  isActive,
  onAnalysisUpdate,
  showPreview = true
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Use shared media stream
  const { stream, hasPermissions, requestAccess, error: mediaError } = useSharedMedia();

  const addDebugLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setDebugInfo(prev => [...prev.slice(-6), logMessage]);
  }, []);

  // Initialize video when stream is available
  useEffect(() => {
    if (stream && videoRef.current && !isInitialized) {
      addDebugLog('📹 Initializing video with shared stream...');
      
      videoRef.current.srcObject = stream;
      
      const handleLoadedMetadata = () => {
        addDebugLog('✅ Video metadata loaded');
        if (videoRef.current) {
          videoRef.current.play()
            .then(() => {
              addDebugLog('▶️ Video playing successfully');
              setIsInitialized(true);
            })
            .catch(error => {
              addDebugLog(`❌ Video play failed: ${error}`);
            });
        }
      };

      const handleVideoError = (error: Event) => {
        addDebugLog(`❌ Video error: ${error}`);
      };

      videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoRef.current.addEventListener('error', handleVideoError);

      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
          videoRef.current.removeEventListener('error', handleVideoError);
        }
      };
    }
  }, [stream, isInitialized, addDebugLog]);

  // Request access when component mounts
  useEffect(() => {
    if (!hasPermissions && !mediaError) {
      addDebugLog('🔐 Requesting shared media access...');
      requestAccess();
    }
  }, [hasPermissions, mediaError, requestAccess, addDebugLog]);

  // Handle analysis state changes
  useEffect(() => {
    addDebugLog(`🎯 isActive changed to: ${isActive} (initialized: ${isInitialized})`);
    
    if (isActive && isInitialized) {
      addDebugLog('🔄 Starting mock analysis interval...');
      analysisIntervalRef.current = setInterval(() => {
        const mockAnalysis = {
          posture: { score: 8, faceCentered: true, faceVisible: true, appropriateDistance: true },
          movement: { score: 7, fidgetingLevel: 3, stability: 7 },
          audioQuality: { score: 6, volumeLevel: 6, clarity: 6, consistency: 6 },
          overall: { score: 7, timestamp: Date.now() }
        };
        
        addDebugLog('📊 Mock analysis generated');
        onAnalysisUpdate?.(mockAnalysis);
      }, 5000);
    } else {
      if (analysisIntervalRef.current) {
        addDebugLog('⏹️ Stopping analysis interval');
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
  }, [isActive, isInitialized, onAnalysisUpdate, addDebugLog]);

  // Only cleanup when component is actually unmounting (not just when isActive changes)
  useEffect(() => {
    return () => {
      addDebugLog('🔚 VideoAnalysisDebug component unmounting');
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
      // Don't stop the shared stream here - let SharedMediaManager handle it
    };
  }, [addDebugLog]);

  return (
    <div className="video-analysis">
      {/* Enhanced Debug Information */}
      <div className="debug-panel">
        <h5>🔧 Analysis Debug</h5>
        <div className="debug-stats">
          <span>Permissions: {hasPermissions ? '✅' : '❌'}</span>
          <span>Initialized: {isInitialized ? '✅' : '❌'}</span>
          <span>Active: {isActive ? '✅' : '❌'}</span>
          <span>Stream: {stream ? '✅' : '❌'}</span>
          <span>Interval: {analysisIntervalRef.current ? '🔄' : '⏹️'}</span>
        </div>
        
        <div className="debug-logs">
          {debugInfo.map((log, index) => (
            <div key={index} className="debug-log">{log}</div>
          ))}
        </div>
      </div>

      {/* Manual Permission Request */}
      {!hasPermissions && !mediaError && (
        <div className="permission-request">
          <div className="permission-message">
            <h4>📹 Autorisation Caméra Requise</h4>
            <p>Pour analyser votre comportement pendant l'entretien, nous avons besoin d'accéder à votre caméra et microphone.</p>
            <button 
              onClick={requestAccess}
              className="btn btn-primary"
            >
              🔓 Autoriser la Caméra
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {mediaError && (
        <div className="analysis-error">
          <div className="alert">
            <div className="alert-icon">❌</div>
            <div>
              <strong>Erreur:</strong> {mediaError}
              <br />
              <small>
                Solutions:
                <br />• Actualisez la page et réessayez
                <br />• Vérifiez l'icône 🔒 dans la barre d'adresse
                <br />• Assurez-vous d'utiliser HTTPS
              </small>
            </div>
          </div>
        </div>
      )}

      {/* Video Preview */}
      {showPreview && hasPermissions && isInitialized && (
        <div className="video-preview">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="preview-video"
          />
          <div className="video-status">
            {isActive ? '✅ Analyse active' : '⏸️ Analyse en pause'}
          </div>
        </div>
      )}

      {/* Analysis Status */}
      {hasPermissions && isInitialized && (
        <div className={`analysis-status ${isActive ? 'active' : 'paused'}`}>
          <div className="status-message">
            <span className="status-icon">{isActive ? '🟢' : '🟡'}</span>
            <span>{isActive ? 'Analyse comportementale en cours' : 'Analyse en pause'}</span>
          </div>
        </div>
      )}

      <style jsx>{`
        .video-analysis {
          width: 100%;
        }

        .debug-panel {
          background: #f0f0f0;
          border: 1px solid #ccc;
          padding: 1rem;
          margin-bottom: 1rem;
          font-size: 0.8rem;
        }

        .debug-panel h5 {
          margin: 0 0 0.5rem 0;
          color: #333;
        }

        .debug-stats {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          flex-wrap: wrap;
        }

        .debug-stats span {
          background: white;
          padding: 0.25rem 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.7rem;
        }

        .debug-logs {
          max-height: 100px;
          overflow-y: auto;
          background: white;
          border: 1px solid #ddd;
          padding: 0.5rem;
        }

        .debug-log {
          font-family: monospace;
          font-size: 0.65rem;
          color: #666;
          margin-bottom: 0.25rem;
        }

        .permission-request {
          background: var(--yellow-light);
          border: 2px solid var(--yellow);
          padding: 2rem;
          text-align: center;
          margin-bottom: 1rem;
        }

        .permission-message h4 {
          margin-bottom: 1rem;
          color: var(--black);
        }

        .permission-message p {
          margin-bottom: 1.5rem;
          color: var(--gray-700);
        }

        .analysis-error {
          margin-bottom: 1rem;
        }

        .alert {
          background: #fef2f2;
          border: 2px solid #ef4444;
          padding: 1rem;
          border-radius: 8px;
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .alert-icon {
          font-size: 1.2rem;
        }

        .video-preview {
          width: 200px;
          height: 150px;
          border: 2px solid var(--gray-300);
          border-radius: 8px;
          overflow: hidden;
          margin: 0 auto 1rem;
          position: relative;
        }

        .preview-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scaleX(-1);
        }

        .video-status {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 0.25rem;
          font-size: 0.7rem;
          text-align: center;
        }

        .analysis-status {
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          text-align: center;
        }

        .analysis-status.active {
          background: #dcfce7;
          border: 2px solid #16a34a;
        }

        .analysis-status.paused {
          background: #fef3c7;
          border: 2px solid #d97706;
        }

        .status-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          justify-content: center;
          font-weight: 600;
        }

        .analysis-status.active .status-message {
          color: #166534;
        }

        .analysis-status.paused .status-message {
          color: #92400e;
        }
      `}</style>
    </div>
  );
};

export default VideoAnalysisDebug;