// Simple fix: Replace your VideoAnalysisShared component temporarily
// Create a new file: src/components/interview/VideoAnalysisQuickFix.tsx

import React, { useState, useEffect } from 'react';

interface VideoAnalysisQuickFixProps {
  isActive: boolean;
  onAnalysisUpdate?: (analysis: any) => void;
  showPreview?: boolean;
}

const VideoAnalysisQuickFix: React.FC<VideoAnalysisQuickFixProps> = ({
  isActive,
  onAnalysisUpdate,
  showPreview = true
}) => {
  const [analysisCount, setAnalysisCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebug = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log('🎥 QUICK FIX:', logMessage);
    setDebugInfo(prev => [...prev.slice(-5), logMessage]);
  };

  useEffect(() => {
    if (!isActive) {
      addDebug('Not active, skipping analysis');
      return;
    }

    addDebug('Starting analysis interval');
    
    const interval = setInterval(() => {
      const analysis = {
        posture: {
          score: 7 + Math.floor(Math.random() * 3), // 7-9
          faceCentered: true,
          faceVisible: true,
          appropriateDistance: true,
          faceSize: 0.15,
          horizontalAlignment: 0.1,
          verticalAlignment: 0.1,
        },
        movement: {
          score: 6 + Math.floor(Math.random() * 4), // 6-9
          fidgetingLevel: Math.floor(Math.random() * 3), // 0-2
          stability: 7 + Math.floor(Math.random() * 3), // 7-9
          headMovement: Math.random() * 0.1, // 0-0.1
        },
        audioQuality: {
          score: 5 + Math.floor(Math.random() * 4), // 5-8
          volumeLevel: 4 + Math.floor(Math.random() * 4), // 4-7
          clarity: 5 + Math.floor(Math.random() * 4), // 5-8
          consistency: 6 + Math.floor(Math.random() * 3) // 6-8
        },
        overall: {
          score: 6 + Math.floor(Math.random() * 3), // 6-8
          timestamp: Date.now()
        },
        faceDetection: {
          detectionCount: 1,
          confidence: 0.7 + Math.random() * 0.3, // 0.7-1.0
          landmarks: []
        }
      };

      addDebug(`Generated analysis: Overall ${analysis.overall.score}/10`);
      setAnalysisCount(prev => prev + 1);

      if (onAnalysisUpdate) {
        console.log('🎥 QUICK FIX: Calling onAnalysisUpdate with:', analysis);
        onAnalysisUpdate(analysis);
        addDebug('Callback called successfully');
      } else {
        console.error('❌ QUICK FIX: onAnalysisUpdate is undefined!');
        addDebug('ERROR: Callback is undefined');
      }
    }, 3000); // Every 3 seconds

    return () => {
      clearInterval(interval);
      addDebug('Analysis interval cleared');
    };
  }, [isActive, onAnalysisUpdate]);

  return (
    <div style={{ border: '2px solid #28a745', padding: '1rem', background: '#d4edda' }}>
      <h4>🛠️ Quick Fix Video Analysis</h4>
      <div>Active: {isActive ? '✅' : '❌'}</div>
      <div>Analysis Count: {analysisCount}</div>
      <div>Callback Defined: {onAnalysisUpdate ? '✅' : '❌'}</div>
      
      {showPreview && (
        <div style={{ 
          width: '200px', 
          height: '150px', 
          background: '#333', 
          margin: '1rem 0', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          color: 'white',
          fontSize: '1.5rem'
        }}>
          📹
        </div>
      )}
      
      <div style={{ maxHeight: '100px', overflow: 'auto', fontSize: '0.8rem', marginTop: '1rem' }}>
        <strong>Debug Log:</strong>
        {debugInfo.map((log, index) => (
          <div key={index} style={{ margin: '0.25rem 0' }}>{log}</div>
        ))}
      </div>
    </div>
  );
};

export default VideoAnalysisQuickFix;