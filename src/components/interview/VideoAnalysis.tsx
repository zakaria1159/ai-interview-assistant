// src/components/interview/VideoAnalysis.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';

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

const VideoAnalysis: React.FC<VideoAnalysisProps> = ({
  isActive,
  onAnalysisUpdate,
  showPreview = true
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<VideoAnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Previous frame data for movement detection
  const [previousFrameData, setPreviousFrameData] = useState<ImageData | null>(null);

  const initializeCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: true
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Initialize audio analysis
        initializeAudioAnalysis(stream);
        
        setHasPermissions(true);
        setIsInitialized(true);
        setError(null);
      }
    } catch (err) {
      console.error('Camera initialization error:', err);
      setError('Impossible d\'accéder à la caméra. Veuillez autoriser l\'accès.');
    }
  }, []);

  const initializeAudioAnalysis = (stream: MediaStream) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
    } catch (err) {
      console.error('Audio analysis initialization error:', err);
    }
  };

  const analyzeFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || video.videoWidth === 0) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const currentFrameData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Analyze posture (basic face detection using pixel analysis)
    const postureAnalysis = analyzePosture(currentFrameData, canvas.width, canvas.height);
    
    // Analyze movement (frame difference)
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
    onAnalysisUpdate?.(analysis);
    setPreviousFrameData(currentFrameData);
  }, [isActive, previousFrameData, onAnalysisUpdate]);

  const analyzePosture = (frameData: ImageData, width: number, height: number) => {
    // Simple face detection using skin tone detection and positioning
    const data = frameData.data;
    let skinPixels = 0;
    let totalBrightness = 0;
    let faceRegionPixels = 0;
    
    // Define face region (center third of the frame)
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
        
        // Simple skin tone detection
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
    
    const faceVisible = skinRatio > 0.1; // At least 10% skin tone in face region
    const faceCentered = skinRatio > 0.05; // Some skin tone detected
    const appropriateDistance = avgBrightness > 50 && avgBrightness < 200; // Good lighting
    
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
  };

  const analyzeMovement = (currentFrame: ImageData, previousFrame: ImageData | null) => {
    if (!previousFrame) {
      return {
        score: 8, // Assume good initially
        fidgetingLevel: 0,
        stability: 10
      };
    }

    const current = currentFrame.data;
    const previous = previousFrame.data;
    let totalDifference = 0;
    let significantChanges = 0;

    // Sample every 10th pixel for performance
    for (let i = 0; i < current.length; i += 40) {
      const diff = Math.abs(current[i] - previous[i]) + 
                  Math.abs(current[i + 1] - previous[i + 1]) + 
                  Math.abs(current[i + 2] - previous[i + 2]);
      
      totalDifference += diff;
      if (diff > 30) significantChanges++;
    }

    const avgDifference = totalDifference / (current.length / 40);
    const changeRatio = significantChanges / (current.length / 40);
    
    // Lower movement = higher stability score
    const stability = Math.max(0, 10 - (avgDifference / 10));
    const fidgetingLevel = Math.min(10, changeRatio * 100);
    
    const score = Math.max(0, 10 - fidgetingLevel);

    return {
      score: Math.round(score),
      fidgetingLevel: Math.round(fidgetingLevel),
      stability: Math.round(stability)
    };
  };

  const analyzeAudioQuality = () => {
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

    // Calculate volume (average of all frequencies)
    const volume = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
    
    // Calculate clarity (presence of mid-range frequencies)
    const midRangeStart = Math.floor(bufferLength * 0.1);
    const midRangeEnd = Math.floor(bufferLength * 0.6);
    const midRangeSum = dataArray.slice(midRangeStart, midRangeEnd)
      .reduce((sum, value) => sum + value, 0);
    const clarity = midRangeSum / (midRangeEnd - midRangeStart);

    // Simple scoring
    const volumeLevel = Math.min(10, Math.max(0, (volume / 25.6)));
    const clarityScore = Math.min(10, Math.max(0, (clarity / 25.6)));
    const consistency = Math.min(10, volumeLevel > 2 ? 8 : 4); // Simplified

    const overallScore = Math.round((volumeLevel + clarityScore + consistency) / 3);

    return {
      score: overallScore,
      volumeLevel: Math.round(volumeLevel),
      clarity: Math.round(clarityScore),
      consistency: Math.round(consistency)
    };
  };

  // Start/stop analysis
  useEffect(() => {
    if (isActive && isInitialized) {
      analysisIntervalRef.current = setInterval(analyzeFrame, 2000); // Analyze every 2 seconds
    } else {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    }

    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, [isActive, isInitialized, analyzeFrame]);

  // Initialize camera when component mounts
  useEffect(() => {
    initializeCamera();

    return () => {
      // Cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [initializeCamera]);

  return (
    <div className="video-analysis">
      {error && (
        <div className="analysis-error">
          <div className="alert">
            <div className="alert-icon">📹</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {showPreview && hasPermissions && (
        <div className="video-preview">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="preview-video"
          />
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {!showPreview && hasPermissions && (
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      )}

      {currentAnalysis && isActive && (
        <div className="analysis-display">
          <div className="analysis-summary">
            <div className="overall-score">
              Score Global: {currentAnalysis.overall.score}/10
            </div>
            <div className="quick-metrics">
              <span className={`metric ${currentAnalysis.posture.faceVisible ? 'good' : 'warning'}`}>
                📹 Position
              </span>
              <span className={`metric ${currentAnalysis.movement.score > 6 ? 'good' : 'warning'}`}>
                🎯 Stabilité
              </span>
              <span className={`metric ${currentAnalysis.audioQuality.score > 5 ? 'good' : 'warning'}`}>
                🎤 Audio
              </span>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .video-analysis {
          width: 100%;
        }

        .analysis-error {
          margin-bottom: 1rem;
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
          transform: scaleX(-1); /* Mirror effect */
        }

        .analysis-display {
          background: var(--gray-50);
          border: 2px solid var(--gray-300);
          padding: 1rem;
          border-radius: 8px;
          margin-top: 1rem;
        }

        .analysis-summary {
          text-align: center;
        }

        .overall-score {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--black);
          margin-bottom: 0.75rem;
        }

        .quick-metrics {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .metric {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .metric.good {
          background: #dcfce7;
          color: #166534;
        }

        .metric.warning {
          background: #fef3c7;
          color: #92400e;
        }

        @media (max-width: 768px) {
          .video-preview {
            width: 150px;
            height: 113px;
          }

          .quick-metrics {
            gap: 0.5rem;
          }

          .metric {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default VideoAnalysis;