// src/components/interview/VideoAnalysisShared.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSharedMedia } from './SharedMediaManager';

interface VideoAnalysisProps {
  isActive: boolean;
  onAnalysisUpdate?: (analysis: VideoAnalysisData) => void;
  showPreview?: boolean;
}

interface VideoAnalysisData {
  posture: {
    score: number;
    faceCentered: boolean;
    faceVisible: boolean;
    appropriateDistance: boolean;
  };
  movement: {
    score: number;
    fidgetingLevel: number;
    stability: number;
  };
  audioQuality: {
    score: number;
    volumeLevel: number;
    clarity: number;
    consistency: number;
  };
  overall: {
    score: number;
    timestamp: number;
  };
}

const VideoAnalysisShared: React.FC<VideoAnalysisProps> = ({
  isActive,
  onAnalysisUpdate,
  showPreview = true
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<VideoAnalysisData | null>(null);
  const [analysisCount, setAnalysisCount] = useState(0);

  // Previous frame data for movement detection
  const [previousFrameData, setPreviousFrameData] = useState<ImageData | null>(null);

  // Use shared media stream
  const { stream, hasPermissions, requestAccess, error: mediaError } = useSharedMedia();

  // Initialize video when stream is available
  useEffect(() => {
    if (stream && videoRef.current && !isVideoReady) {
      videoRef.current.srcObject = stream;
      
      const handleLoadedMetadata = () => {
        if (videoRef.current) {
          videoRef.current.play()
            .then(() => {
              setIsVideoReady(true);
              initializeAudioAnalysis(stream);
            })
            .catch(error => {
              console.error('Video play failed:', error);
            });
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

  // Request access when component mounts
  useEffect(() => {
    if (!hasPermissions && !mediaError) {
      requestAccess();
    }
  }, [hasPermissions, mediaError, requestAccess]);

  const initializeAudioAnalysis = useCallback((mediaStream: MediaStream) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(mediaStream);
      
      analyser.fftSize = 256;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
    } catch (err) {
      console.error('Audio analysis error:', err);
    }
  }, []);

  const analyzeFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isActive || !isVideoReady) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    try {
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const currentFrameData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Analyze posture
      const postureAnalysis = analyzePosture(currentFrameData, canvas.width, canvas.height);
      
      // Analyze movement
      const movementAnalysis = analyzeMovement(currentFrameData, previousFrameData);
      
      // Analyze audio quality
      const audioAnalysis = analyzeAudioQuality();

      // Calculate overall score
      const overallScore = Math.round(
        (postureAnalysis.score + movementAnalysis.score + audioAnalysis.score) / 3
      );

      const analysis: VideoAnalysisData = {
        posture: postureAnalysis,
        movement: movementAnalysis,
        audioQuality: audioAnalysis,
        overall: {
          score: overallScore,
          timestamp: Date.now()
        }
      };

      setCurrentAnalysis(analysis);
      setAnalysisCount(prev => prev + 1);
      onAnalysisUpdate?.(analysis);
      setPreviousFrameData(currentFrameData);
      
    } catch (error) {
      console.error('Analysis error:', error);
    }
  }, [isActive, previousFrameData, onAnalysisUpdate, analysisCount, isVideoReady]);

  const analyzePosture = useCallback((frameData: ImageData, width: number, height: number) => {
    const data = frameData.data;
    let skinPixels = 0;
    let totalBrightness = 0;
    let faceRegionPixels = 0;
    
    const faceLeft = Math.floor(width * 0.3);
    const faceRight = Math.floor(width * 0.7);
    const faceTop = Math.floor(height * 0.2);
    const faceBottom = Math.floor(height * 0.6);

    for (let y = faceTop; y < faceBottom; y++) {
      for (let x = faceLeft; x < faceRight; x++) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        faceRegionPixels++;
        
        if (r > 95 && g > 40 && b > 20 && 
            Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
            Math.abs(r - g) > 15 && r > g && r > b) {
          skinPixels++;
        }
        
        totalBrightness += (r + g + b) / 3;
      }
    }

    const skinRatio = skinPixels / faceRegionPixels;
    const avgBrightness = totalBrightness / faceRegionPixels;
    
    const faceVisible = skinRatio > 0.1;
    const faceCentered = skinRatio > 0.05;
    const appropriateDistance = avgBrightness > 50 && avgBrightness < 200;
    
    let score = 0;
    if (faceVisible) score += 4;
    if (faceCentered) score += 3;
    if (appropriateDistance) score += 3;

    return {
      score: Math.min(score, 10),
      faceCentered,
      faceVisible,
      appropriateDistance
    };
  }, []);

  const analyzeMovement = useCallback((currentFrame: ImageData, previousFrame: ImageData | null) => {
    if (!previousFrame) {
      return {
        score: 8,
        fidgetingLevel: 0,
        stability: 10
      };
    }

    const current = currentFrame.data;
    const previous = previousFrame.data;
    let totalDifference = 0;
    let significantChanges = 0;

    for (let i = 0; i < current.length; i += 40) {
      const diff = Math.abs(current[i] - previous[i]) + 
                  Math.abs(current[i + 1] - previous[i + 1]) + 
                  Math.abs(current[i + 2] - previous[i + 2]);
      
      totalDifference += diff;
      if (diff > 30) significantChanges++;
    }

    const avgDifference = totalDifference / (current.length / 40);
    const changeRatio = significantChanges / (current.length / 40);
    
    const stability = Math.max(0, 10 - (avgDifference / 10));
    const fidgetingLevel = Math.min(10, changeRatio * 100);
    
    const score = Math.max(0, 10 - fidgetingLevel);

    return {
      score: Math.round(score),
      fidgetingLevel: Math.round(fidgetingLevel),
      stability: Math.round(stability)
    };
  }, []);

  const analyzeAudioQuality = useCallback(() => {
    if (!analyserRef.current) {
      return {
        score: 5,
        volumeLevel: 5,
        clarity: 5,
        consistency: 5
      };
    }

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    const volume = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
    
    const midRangeStart = Math.floor(bufferLength * 0.1);
    const midRangeEnd = Math.floor(bufferLength * 0.6);
    const midRangeSum = dataArray.slice(midRangeStart, midRangeEnd)
      .reduce((sum, value) => sum + value, 0);
    const clarity = midRangeSum / (midRangeEnd - midRangeStart);

    const volumeLevel = Math.min(10, Math.max(0, (volume / 25.6)));
    const clarityScore = Math.min(10, Math.max(0, (clarity / 25.6)));
    const consistency = Math.min(10, volumeLevel > 2 ? 8 : 4);

    const overallScore = Math.round((volumeLevel + clarityScore + consistency) / 3);

    return {
      score: overallScore,
      volumeLevel: Math.round(volumeLevel),
      clarity: Math.round(clarityScore),
      consistency: Math.round(consistency)
    };
  }, []);

  // Start/stop analysis interval
  useEffect(() => {
    if (isActive && isVideoReady) {
      analysisIntervalRef.current = setInterval(analyzeFrame, 3000); // Every 3 seconds
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
  }, [isActive, isVideoReady, analyzeFrame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Handle media errors
  if (mediaError) {
    return (
      <div className="video-analysis-container">
        <div className="video-analysis-error">
          <div className="alert">
            <div className="alert-icon">❌</div>
            <div>
              <strong>Erreur d'accès caméra:</strong> {mediaError}
              <br />
              <button onClick={requestAccess} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                🔄 Réessayer
              </button>
            </div>
          </div>
        </div>
        
        <style jsx>{`
          .video-analysis-container {
            width: 100%;
            text-align: center;
          }
          
          .video-analysis-error {
            padding: 1rem;
          }
          
          .alert {
            background: #fef2f2;
            border: 2px solid #ef4444;
            padding: 1rem;
            border-radius: 8px;
            display: flex;
            align-items: flex-start;
            gap: 0.5rem;
            text-align: left;
          }
          
          .alert-icon {
            font-size: 1.2rem;
          }
          
          .btn {
            padding: 0.5rem 1rem;
            border: 2px solid var(--black);
            background: var(--yellow);
            color: var(--black);
            font-weight: 600;
            cursor: pointer;
            border-radius: 0;
            font-family: inherit;
          }
          
          .btn:hover {
            background: var(--yellow-dark);
            transform: translateY(-1px);
          }
        `}</style>
      </div>
    );
  }

  if (!hasPermissions) {
    return (
      <div className="video-analysis-container">
        <div className="video-analysis-setup">
          <div className="permission-message">
            <h4>📹 Autorisation Caméra Requise</h4>
            <p>Pour une évaluation complète de votre entretien, nous analysons votre présentation visuelle et votre expression orale.</p>
            <button 
              onClick={requestAccess}
              className="btn btn-primary"
            >
              🔓 Autoriser Caméra & Microphone
            </button>
            <p className="privacy-note">
              <small>🔒 Vos données restent privées et ne sont jamais stockées</small>
            </p>
          </div>
        </div>
        
        <style jsx>{`
          .video-analysis-container {
            width: 100%;
            text-align: center;
          }
          
          .video-analysis-setup {
            padding: 1rem;
          }
          
          .permission-message {
            background: var(--yellow-light, #fef3c7);
            border: 2px solid var(--yellow, #f59e0b);
            padding: 2rem;
            border-radius: 8px;
          }
          
          .permission-message h4 {
            margin-bottom: 1rem;
            color: var(--black, #000);
          }
          
          .permission-message p {
            margin-bottom: 1.5rem;
            color: var(--gray-700, #374151);
          }
          
          .privacy-note {
            margin-top: 1rem;
            margin-bottom: 0;
          }
          
          .privacy-note small {
            color: var(--gray-600, #4b5563);
            font-style: italic;
          }
          
          .btn {
            padding: 0.75rem 1.5rem;
            border: 2px solid var(--black, #000);
            background: var(--yellow, #f59e0b);
            color: var(--black, #000);
            font-weight: 600;
            cursor: pointer;
            border-radius: 0;
            font-family: inherit;
            font-size: 1rem;
          }
          
          .btn:hover {
            background: var(--yellow-dark, #d97706);
            transform: translateY(-2px);
            box-shadow: 4px 4px 0 var(--black, #000);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="video-analysis-container">
      {showPreview && (
        <div className="video-preview-section">
          <div className="video-preview">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="preview-video"
            />
            <canvas
              ref={canvasRef}
              style={{ display: 'none' }}
            />
            
            {/* Camera status overlay */}
            <div className="camera-overlay">
              <div className="status-indicator">
                <div className={`status-dot ${isActive ? 'active' : 'paused'}`}></div>
                <span className="status-text">
                  {isActive ? 'Analyse en cours' : 'En attente'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="camera-info">
            <p className="camera-description">
              📹 Votre présentation est analysée en temps réel pour vous donner des conseils personnalisés
            </p>
          </div>
        </div>
      )}

      {/* Simple status indicator - no scores shown */}
      {currentAnalysis && isActive && (
        <div className="analysis-active">
          <div className="analysis-indicator">
            <div className="pulse-indicator"></div>
            <span>Analyse comportementale active</span>
          </div>
          <p className="analysis-note">
            Continuez à répondre naturellement. Les résultats détaillés seront disponibles à la fin.
          </p>
        </div>
      )}

      <style jsx>{`
        .video-analysis-container {
          width: 100%;
          text-align: center;
        }

        .video-preview-section {
          background: var(--gray-50);
          border: 2px solid var(--gray-300);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1rem;
        }

        .video-preview {
          position: relative;
          width: 280px;
          height: 210px;
          margin: 0 auto;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .preview-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scaleX(-1);
          background: #000;
        }

        .camera-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to bottom, rgba(0,0,0,0.7), transparent);
          padding: 0.75rem;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: white;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #6b7280;
        }

        .status-dot.active {
          background: #10b981;
          animation: pulse 2s infinite;
        }

        .status-dot.paused {
          background: #f59e0b;
        }

        .camera-info {
          margin-top: 1rem;
        }

        .camera-description {
          color: var(--gray-600);
          font-size: 0.9rem;
          margin: 0;
          font-style: italic;
        }

        .analysis-active {
          background: #f0fdf4;
          border: 2px solid #16a34a;
          border-radius: 8px;
          padding: 1rem;
          margin: 1rem 0;
        }

        .analysis-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          color: #166534;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .pulse-indicator {
          width: 10px;
          height: 10px;
          background: #16a34a;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }

        .analysis-note {
          color: #166534;
          font-size: 0.85rem;
          margin: 0;
          font-style: italic;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.1);
          }
        }

        @media (max-width: 768px) {
          .video-preview {
            width: 240px;
            height: 180px;
          }
          
          .video-preview-section {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default VideoAnalysisShared;