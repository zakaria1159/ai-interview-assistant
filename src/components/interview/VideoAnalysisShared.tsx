// src/components/interview/VideoAnalysisShared.tsx
// FIXED MediaPipe Integration with proper error handling and initialization

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSharedMedia } from './SharedMediaManager';

interface VideoAnalysisProps {
  isActive: boolean;
  onAnalysisUpdate?: (analysis: any) => void;
  showPreview?: boolean;
}

// Proper MediaPipe types
interface MediaPipeDetection {
  boundingBox: {
    xCenter: number;
    yCenter: number;
    width: number;
    height: number;
  };
  landmarks?: Array<{ x: number; y: number; z?: number }>;
  score: number;
}

interface MediaPipeResults {
  detections: MediaPipeDetection[];
  image: HTMLVideoElement | HTMLCanvasElement;
}

// Global MediaPipe declaration
declare global {
  interface Window {
    FaceDetection: any;
    drawingUtils: any;
  }
}

const VideoAnalysisShared: React.FC<VideoAnalysisProps> = ({
  isActive,
  onAnalysisUpdate,
  showPreview = true
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // MediaPipe state
  const faceDetectionRef = useRef<any>(null);
  const [isMediaPipeReady, setIsMediaPipeReady] = useState(false);
  const [isMediaPipeLoading, setIsMediaPipeLoading] = useState(false);
  const [mediaPipeError, setMediaPipeError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<string>('');
  
  // Analysis state
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [lastFaceDetections, setLastFaceDetections] = useState<MediaPipeDetection[]>([]);
  const [faceHistory, setFaceHistory] = useState<any[]>([]);

  // Use shared media stream
  const { stream, hasPermissions, requestAccess, error: mediaError } = useSharedMedia();

  // Check if scripts are already loaded
  const areScriptsLoaded = useCallback(() => {
    return !!(
      window.FaceDetection && 
      typeof window.FaceDetection === 'function'
    );
  }, []);

  // Load MediaPipe scripts with better error handling
  const loadMediaPipeScripts = useCallback(async () => {
    if (typeof window === 'undefined') {
      console.log('❌ Window not available (SSR)');
      return;
    }

    if (areScriptsLoaded()) {
      console.log('✅ MediaPipe scripts already loaded');
      await initializeMediaPipe();
      return;
    }

    if (isMediaPipeLoading) {
      console.log('⏳ MediaPipe already loading...');
      return;
    }

    setIsMediaPipeLoading(true);
    setMediaPipeError(null);
    setLoadingProgress('Initializing...');

    try {
      // Function to load script with timeout
      const loadScript = (src: string, name: string): Promise<void> => {
        return new Promise((resolve, reject) => {
          // Check if script already exists
          const existingScript = document.querySelector(`script[src="${src}"]`);
          if (existingScript) {
            console.log(`✅ ${name} already loaded`);
            resolve();
            return;
          }

          setLoadingProgress(`Loading ${name}...`);
          console.log(`📦 Loading ${name} from ${src}`);

          const script = document.createElement('script');
          script.src = src;
          script.crossOrigin = 'anonymous';
          script.async = true;
          
          const timeout = setTimeout(() => {
            reject(new Error(`Timeout loading ${name} (30s)`));
          }, 30000);

          script.onload = () => {
            clearTimeout(timeout);
            console.log(`✅ ${name} loaded successfully`);
            resolve();
          };

          script.onerror = (error) => {
            clearTimeout(timeout);
            console.error(`❌ Failed to load ${name}:`, error);
            reject(new Error(`Failed to load ${name}`));
          };

          document.head.appendChild(script);
        });
      };

      // Load MediaPipe scripts in correct order
      console.log('🤖 Starting MediaPipe script loading...');
      
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js', 'Camera Utils');
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js', 'Drawing Utils');
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/face_detection.js', 'Face Detection');

      setLoadingProgress('Waiting for MediaPipe initialization...');

      // Wait for MediaPipe to be available with exponential backoff
      let attempts = 0;
      const maxAttempts = 30;
      while (attempts < maxAttempts && !areScriptsLoaded()) {
        const delay = Math.min(1000, 100 * Math.pow(1.5, attempts));
        await new Promise(resolve => setTimeout(resolve, delay));
        attempts++;
        
        if (attempts % 5 === 0) {
          console.log(`⏳ Waiting for MediaPipe... (attempt ${attempts}/${maxAttempts})`);
          setLoadingProgress(`Waiting for MediaPipe... (${attempts}/${maxAttempts})`);
        }
      }

      if (!areScriptsLoaded()) {
        throw new Error(`MediaPipe not available after ${maxAttempts} attempts. Check console for script loading errors.`);
      }

      console.log('✅ All MediaPipe scripts loaded successfully');
      setLoadingProgress('Initializing MediaPipe...');
      await initializeMediaPipe();

    } catch (error: any) {
      console.error('❌ MediaPipe loading failed:', error);
      setMediaPipeError(`MediaPipe loading failed: ${error.message}`);
      setIsMediaPipeLoading(false);
      setLoadingProgress('');
    }
  }, [isMediaPipeLoading, areScriptsLoaded]);

  // Initialize MediaPipe Face Detection with proper error handling
  const initializeMediaPipe = useCallback(async () => {
    try {
      console.log('🤖 Initializing MediaPipe Face Detection...');
      setLoadingProgress('Creating Face Detection instance...');

      if (!window.FaceDetection) {
        throw new Error('FaceDetection constructor not available');
      }

      const faceDetection = new window.FaceDetection({
        locateFile: (file: string) => {
          const baseUrl = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection';
          const fullUrl = `${baseUrl}/${file}`;
          console.log(`📁 Loading MediaPipe file: ${fullUrl}`);
          return fullUrl;
        }
      });

      setLoadingProgress('Configuring detection options...');

      // Configure for interview setting with optimal parameters
      await faceDetection.setOptions({
        model: 'short', // Better for close-range (interview setting)
        minDetectionConfidence: 0.6, // Lower threshold for better detection
      });

      setLoadingProgress('Setting up results handler...');

      // Set up results handler
      faceDetection.onResults((results: MediaPipeResults) => {
        try {
          handleMediaPipeResults(results);
        } catch (error) {
          console.error('❌ Error in MediaPipe results handler:', error);
        }
      });

      setLoadingProgress('Initializing MediaPipe engine...');

      // Initialize the detection engine
      await faceDetection.initialize();
      
      faceDetectionRef.current = faceDetection;
      setIsMediaPipeReady(true);
      setIsMediaPipeLoading(false);
      setLoadingProgress('');
      console.log('✅ MediaPipe Face Detection initialized successfully');

    } catch (error: any) {
      console.error('❌ MediaPipe initialization failed:', error);
      setMediaPipeError(`MediaPipe initialization failed: ${error.message}`);
      setIsMediaPipeReady(false);
      setIsMediaPipeLoading(false);
      setLoadingProgress('');
    }
  }, []);

  // Handle MediaPipe detection results with proper error handling
  const handleMediaPipeResults = useCallback((results: MediaPipeResults) => {
    try {
      if (!overlayCanvasRef.current || !videoRef.current) {
        return;
      }

      const canvas = overlayCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;


      // Clear previous overlay
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Store detections
      const detections = results.detections || [];
      setLastFaceDetections(detections);

      const validDetections = detections.map(detection => ({
        ...detection,
        score: typeof detection.score === 'number' && !isNaN(detection.score) 
          ? detection.score 
          : 0.8 // Default fallback confidence
      }));
      
      setLastFaceDetections(validDetections);

      console.log(`👤 MediaPipe detected ${detections.length} faces`);

      // Draw face detection overlay
      if (detections.length > 0 && showPreview) {
        detections.forEach((detection: MediaPipeDetection, index: number) => {
          const bbox = detection.boundingBox;
          if (!bbox) return;

          try {
            // Calculate actual pixel coordinates
            const centerX = bbox.xCenter * canvas.width;
            const centerY = bbox.yCenter * canvas.height;
            const width = bbox.width * canvas.width;
            const height = bbox.height * canvas.height;
            const x = centerX - width / 2;
            const y = centerY - height / 2;

            // Draw bounding box with color based on confidence
            const confidence = detection.score;
            if (confidence > 0.8) {
              ctx.strokeStyle = '#00ff00'; // Green for high confidence
            } else if (confidence > 0.6) {
              ctx.strokeStyle = '#ffff00'; // Yellow for medium confidence
            } else {
              ctx.strokeStyle = '#ff8800'; // Orange for low confidence
            }
            
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, width, height);
            
            // Draw confidence score
            ctx.fillStyle = ctx.strokeStyle;
            ctx.font = 'bold 16px Arial';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 3;
            ctx.fillText(
              `Face ${index + 1}: ${Math.round(confidence * 100)}%`, 
              x, 
              y - 10
            );
            ctx.shadowBlur = 0;

            // Draw center point
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
            ctx.fill();

            // Draw facial landmarks if available
            if (detection.landmarks && detection.landmarks.length > 0) {
              ctx.fillStyle = '#00ffff';
              detection.landmarks.forEach((landmark: any) => {
                const lx = landmark.x * canvas.width;
                const ly = landmark.y * canvas.height;
                ctx.beginPath();
                ctx.arc(lx, ly, 2, 0, 2 * Math.PI);
                ctx.fill();
              });
            }
          } catch (drawError) {
            console.error('❌ Error drawing detection:', drawError);
          }
        });
      }

      // Update face history for movement analysis
      if (detections.length > 0) {
        const primaryFace = detections[0]; // Use most confident detection
        setFaceHistory(prev => [...prev.slice(-20), { // Keep last 20 detections
          timestamp: Date.now(),
          detection: primaryFace,
          bbox: primaryFace.boundingBox,
          confidence: primaryFace.score
        }]);
      }
    } catch (error) {
      console.error('❌ Error handling MediaPipe results:', error);
    }
  }, [showPreview]);

  // Initialize video when stream is available
  useEffect(() => {
    if (stream && videoRef.current && !isVideoReady) {
      console.log('📹 Setting up video stream...');
      videoRef.current.srcObject = stream;
      
      const handleLoadedMetadata = () => {
        const video = videoRef.current;
        if (!video || !overlayCanvasRef.current) return;

        console.log(`📹 Video metadata loaded: ${video.videoWidth}x${video.videoHeight}`);
        
        // Set canvas sizes to match video
        if (canvasRef.current) {
          canvasRef.current.width = video.videoWidth;
          canvasRef.current.height = video.videoHeight;
        }
        
        overlayCanvasRef.current.width = video.videoWidth;
        overlayCanvasRef.current.height = video.videoHeight;

        video.play()
          .then(() => {
            console.log('✅ Video playing successfully');
            setIsVideoReady(true);
            initializeAudioAnalysis(stream);
            // Start loading MediaPipe after video is ready
            loadMediaPipeScripts();
          })
          .catch(error => {
            console.error('❌ Video play failed:', error);
          });
      };

      const handleVideoError = (error: any) => {
        console.error('❌ Video error:', error);
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
  }, [stream, isVideoReady, loadMediaPipeScripts]);

  // Request camera access
  useEffect(() => {
    if (!hasPermissions && !mediaError) {
      console.log('🎥 Requesting camera access...');
      requestAccess();
    }
  }, [hasPermissions, mediaError, requestAccess]);

  // Initialize audio analysis
  const initializeAudioAnalysis = useCallback((mediaStream: MediaStream) => {
    try {
      console.log('🎤 Initializing audio analysis...');
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('⚠️ AudioContext not supported');
        return;
      }

      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(mediaStream);
      
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      console.log('✅ Audio analysis initialized');
    } catch (err) {
      console.error('❌ Audio analysis initialization error:', err);
    }
  }, []);

  // Process MediaPipe frame with error handling
  const processMediaPipeFrame = useCallback(async () => {
    if (!faceDetectionRef.current || !videoRef.current || !isVideoReady) {
      return;
    }

    try {
      const video = videoRef.current;
      if (video.readyState >= 2) { // HAVE_CURRENT_DATA
        await faceDetectionRef.current.send({ image: video });
      }
    } catch (error) {
      console.error('❌ MediaPipe frame processing error:', error);
      // Don't set error state for individual frame failures
    }
  }, [isVideoReady]);

  // Enhanced analysis with MediaPipe data
  const analyzeWithMediaPipe = useCallback(() => {
    if (!isActive || lastFaceDetections.length === 0) {
      return null;
    }

    const primaryFace = lastFaceDetections[0];
    const bbox = primaryFace.boundingBox;
    
    if (!bbox) return null;

    console.log('🤖 Analyzing with MediaPipe data, confidence:', primaryFace.score);

    // REAL posture analysis using MediaPipe data
    const faceSize = bbox.width * bbox.height;
    const centerX = bbox.xCenter;
    const centerY = bbox.yCenter;
    
    // Calculate positioning metrics
    const horizontalAlignment = Math.abs(centerX - 0.5);
    const verticalAlignment = Math.abs(centerY - 0.4); // Slightly above center is ideal
    
    // Face positioning evaluation
    const faceVisible = primaryFace.score > 0.6;
    const faceCentered = horizontalAlignment < 0.2 && verticalAlignment < 0.2;
    const appropriateDistance = faceSize > 0.05 && faceSize < 0.4;
    
    // Calculate posture score based on real MediaPipe data
    let postureScore = 0;
    if (faceVisible) postureScore += 3;
    if (faceCentered) postureScore += 3;
    if (appropriateDistance) postureScore += 2;
    if (primaryFace.score > 0.8) postureScore += 1; // High confidence bonus
    if (horizontalAlignment < 0.1) postureScore += 1; // Very well centered
    
    // REAL movement analysis using face history
    let headMovement = 0;
    let stability = 10;
    
    if (faceHistory.length > 3) {
      const recentHistory = faceHistory.slice(-10);
      
      // Calculate position variance
      const positions = recentHistory.map(h => ({
        x: h.bbox.xCenter,
        y: h.bbox.yCenter,
        timestamp: h.timestamp
      }));
      
      if (positions.length > 1) {
        // Calculate movement variance
        let totalMovement = 0;
        for (let i = 1; i < positions.length; i++) {
          const deltaX = Math.abs(positions[i].x - positions[i-1].x);
          const deltaY = Math.abs(positions[i].y - positions[i-1].y);
          totalMovement += Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        }
        
        headMovement = totalMovement / (positions.length - 1);
        stability = Math.max(0, 10 - (headMovement * 30));
      }
    }
    
    const fidgetingLevel = Math.min(10, headMovement * 25);
    const movementScore = Math.round(Math.max(0, 10 - fidgetingLevel));

    // Analyze audio
    const audioAnalysis = analyzeAudioQuality();

    return {
      posture: {
        score: Math.min(10, Math.round(postureScore)),
        faceCentered,
        faceVisible,
        appropriateDistance,
        faceSize: Math.round(faceSize * 1000) / 1000,
        horizontalAlignment: Math.round(horizontalAlignment * 1000) / 1000,
        verticalAlignment: Math.round(verticalAlignment * 1000) / 1000,
      },
      movement: {
        score: movementScore,
        fidgetingLevel: Math.round(fidgetingLevel),
        stability: Math.round(stability),
        headMovement: Math.round(headMovement * 1000) / 1000,
      },
      audioQuality: audioAnalysis,
      overall: {
        score: Math.round((postureScore + movementScore + audioAnalysis.score) / 3),
        timestamp: Date.now()
      },
      faceDetection: {
        detectionCount: lastFaceDetections.length,
        confidence: Math.round((primaryFace?.score || 0) * 1000) / 1000,
        landmarks: primaryFace.landmarks || [],
        realMediaPipe: true // Flag to show this is real data
      }
    };
  }, [isActive, lastFaceDetections, faceHistory]);

  // Enhanced audio analysis
  const analyzeAudioQuality = useCallback(() => {
    if (!analyserRef.current) {
      return { score: 5, volumeLevel: 5, clarity: 5, consistency: 5 };
    }

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    // Calculate volume (RMS)
    const volume = Math.sqrt(
      dataArray.reduce((sum, value) => sum + value * value, 0) / bufferLength
    );
    
    // Calculate clarity (frequency distribution)
    const midRangeStart = Math.floor(bufferLength * 0.1);
    const midRangeEnd = Math.floor(bufferLength * 0.6);
    const midRangeSum = dataArray.slice(midRangeStart, midRangeEnd)
      .reduce((sum, value) => sum + value, 0);
    const clarity = midRangeSum / (midRangeEnd - midRangeStart);

    const volumeLevel = Math.min(10, Math.max(0, (volume / 20)));
    const clarityScore = Math.min(10, Math.max(0, (clarity / 20)));
    const consistency = Math.min(10, volumeLevel > 2 ? 8 : 4);

    return {
      score: Math.round((volumeLevel + clarityScore + consistency) / 3),
      volumeLevel: Math.round(volumeLevel),
      clarity: Math.round(clarityScore),
      consistency: Math.round(consistency)
    };
  }, []);

  // Main analysis function with fallback
  const analyzeFrame = useCallback(() => {
    if (!isActive || !isVideoReady) return;

    try {
      let analysis = null;

      if (isMediaPipeReady && lastFaceDetections.length > 0) {
        // Use real MediaPipe analysis
        analysis = analyzeWithMediaPipe();
        console.log('✅ Using MediaPipe analysis');
      }
      
      // Fallback to basic analysis if MediaPipe not ready or no face detected
      if (!analysis) {
        const audioAnalysis = analyzeAudioQuality();
        analysis = {
          posture: {
            score: 5,
            faceCentered: false,
            faceVisible: false,
            appropriateDistance: true,
            faceSize: 0,
            horizontalAlignment: 0.5,
            verticalAlignment: 0.5,
          },
          movement: {
            score: 5,
            fidgetingLevel: 3,
            stability: 5,
            headMovement: 0,
          },
          audioQuality: audioAnalysis,
          overall: {
            score: Math.round((5 + 5 + audioAnalysis.score) / 3),
            timestamp: Date.now()
          },
          faceDetection: {
            detectionCount: 0,
            confidence: 0,
            landmarks: [],
            realMediaPipe: false
          }
        };
        console.log('⚠️ Using fallback analysis (MediaPipe not ready)');
      }

      setAnalysisCount(prev => prev + 1);
      
      if (onAnalysisUpdate) {
        onAnalysisUpdate(analysis);
      }

    } catch (error) {
      console.error('❌ Analysis error:', error);
    }
  }, [isActive, isVideoReady, isMediaPipeReady, lastFaceDetections, analyzeWithMediaPipe, analyzeAudioQuality, onAnalysisUpdate]);

  // Start MediaPipe processing when ready
  useEffect(() => {
    let processingInterval: NodeJS.Timeout | null = null;

    if (isVideoReady && isMediaPipeReady && faceDetectionRef.current) {
      console.log('🎬 Starting MediaPipe frame processing at 8 FPS');
      // Process frames at 8 FPS for MediaPipe (balance between performance and accuracy)
      processingInterval = setInterval(processMediaPipeFrame, 125);
    }

    return () => {
      if (processingInterval) {
        clearInterval(processingInterval);
      }
    };
  }, [isVideoReady, isMediaPipeReady, processMediaPipeFrame]);

  // Start analysis interval
  useEffect(() => {
    if (isActive && isVideoReady) {
      console.log('📊 Starting analysis at 5-second intervals');
      analysisIntervalRef.current = setInterval(analyzeFrame, 5000);
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
  }, [isActive, isVideoReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (faceDetectionRef.current) {
        try {
          faceDetectionRef.current.close();
        } catch (error) {
          console.error('Error closing MediaPipe:', error);
        }
      }
    };
  }, []);

  // Handle errors
  if (mediaError) {
    return (
      <div style={{ padding: '1rem', border: '2px solid #ef4444', background: '#fef2f2', borderRadius: '8px' }}>
        <div>❌ Erreur caméra: {mediaError}</div>
        <button onClick={requestAccess} style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          🔄 Réessayer
        </button>
      </div>
    );
  }

  if (!hasPermissions) {
    return (
      <div style={{ padding: '2rem', border: '2px solid #f59e0b', background: '#fef3c7', borderRadius: '8px', textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 1rem 0' }}>📹 Autorisation Caméra Requise</h4>
        <p style={{ margin: '0 0 1.5rem 0' }}>Autorisez l'accès à votre caméra pour l'analyse comportementale IA avec détection faciale MediaPipe</p>
        <button onClick={requestAccess} style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          🔓 Autoriser Caméra
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0fdf4', border: '2px solid #16a34a', borderRadius: '8px', padding: '1.5rem', textAlign: 'center' }}>
      <h4 style={{ margin: '0 0 1rem 0' }}>🤖 Analyse Comportementale IA</h4>
      
      {/* Status indicators */}
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <span style={{ 
          background: isActive ? '#dcfce7' : '#fef3c7', 
          color: isActive ? '#166534' : '#92400e',
          padding: '0.25rem 0.75rem',
          borderRadius: '20px',
          fontSize: '0.8rem',
          fontWeight: '600'
        }}>
          {isActive ? '✅ Actif' : '⏸️ Pause'}
        </span>
        
        <span style={{ 
          background: isMediaPipeReady ? '#dcfce7' : isMediaPipeLoading ? '#fef3c7' : '#fee2e2',
          color: isMediaPipeReady ? '#166534' : isMediaPipeLoading ? '#92400e' : '#dc2626',
          padding: '0.25rem 0.75rem',
          borderRadius: '20px',
          fontSize: '0.8rem',
          fontWeight: '600'
        }}>
          🤖 {isMediaPipeReady ? 'IA MediaPipe Prête' : isMediaPipeLoading ? 'Chargement IA...' : 'IA Non Chargée'}
        </span>

        {lastFaceDetections.length > 0 && (
          <span style={{ 
            background: '#dcfce7',
            color: '#166534',
            padding: '0.25rem 0.75rem',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: '600'
          }}>
            👤 {lastFaceDetections.length} Visage{lastFaceDetections.length > 1 ? 's' : ''} ({Math.round(lastFaceDetections[0].score * 100)}%)
          </span>
        )}
      </div>

      {/* Loading progress */}
      {isMediaPipeLoading && loadingProgress && (
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', padding: '0.5rem', marginBottom: '1rem', borderRadius: '4px', fontSize: '0.8rem', color: '#92400e' }}>
          ⏳ {loadingProgress}
        </div>
      )}

      {/* Error display */}
      {mediaPipeError && (
        <div style={{ background: '#fee2e2', border: '1px solid #dc2626', padding: '0.5rem', marginBottom: '1rem', borderRadius: '4px', fontSize: '0.8rem', color: '#dc2626' }}>
          ⚠️ {mediaPipeError}
          <br />
          <button 
            onClick={loadMediaPipeScripts} 
            style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}
          >
            🔄 Retry MediaPipe
          </button>
        </div>
      )}

      {/* Video preview with overlay */}
      {showPreview && (
        <div style={{ position: 'relative', width: '320px', height: '240px', margin: '0 auto 1rem auto', borderRadius: '8px', overflow: 'hidden', border: '2px solid #374151' }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)',
              background: '#000'
            }}
          />
          
          {/* MediaPipe overlay canvas */}
          <canvas
            ref={overlayCanvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              transform: 'scaleX(-1)'
            }}
          />
          
          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          {/* Debug overlay */}
          {isMediaPipeReady && (
            <div style={{
              position: 'absolute',
              top: '5px',
              left: '5px',
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '5px',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              🤖 MediaPipe Active
              {lastFaceDetections.length > 0 && (
                <div>Faces: {lastFaceDetections.length}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Status text */}
      <div style={{ fontSize: '0.9rem', color: '#166534' }}>
        {isActive ? (
          isMediaPipeReady ? 
            '🤖 Analyse IA MediaPipe en cours - Détection faciale active' :
            isMediaPipeLoading ?
              '⏳ Chargement de l\'IA MediaPipe...' :
              '📊 Analyse de base (MediaPipe non disponible)'
        ) : '⏸️ En attente d\'activation'}
      </div>

      {analysisCount > 0 && (
        <div style={{ fontSize: '0.8rem', color: '#166534', marginTop: '0.5rem' }}>
          {analysisCount} analyses effectuées
          {isMediaPipeReady && lastFaceDetections.length > 0 && (
            <> • Confiance: {Math.round(lastFaceDetections[0].score * 100)}%</>
          )}
        </div>
      )}

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <details style={{ marginTop: '1rem', textAlign: 'left', fontSize: '0.8rem' }}>
          <summary>Debug Info</summary>
          <div style={{ background: '#f8f9fa', padding: '0.5rem', borderRadius: '4px', marginTop: '0.5rem' }}>
            <div>Video Ready: {isVideoReady ? '✅' : '❌'}</div>
            <div>MediaPipe Ready: {isMediaPipeReady ? '✅' : '❌'}</div>
            <div>Face Detections: {lastFaceDetections.length}</div>
            <div>Face History: {faceHistory.length}</div>
            <div>Analysis Count: {analysisCount}</div>
            {lastFaceDetections.length > 0 && (
              <div>
                Last Detection: {Math.round(lastFaceDetections[0].score * 100)}% confidence
                <br />
                Position: ({Math.round(lastFaceDetections[0].boundingBox.xCenter * 100)}%, {Math.round(lastFaceDetections[0].boundingBox.yCenter * 100)}%)
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
};

export default VideoAnalysisShared;