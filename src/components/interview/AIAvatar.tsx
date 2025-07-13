// src/components/interview/AIAvatar.tsx
import React, { useState, useEffect } from 'react';

interface AIAvatarProps {
  isListening?: boolean;
  isSpeaking?: boolean;
  isThinking?: boolean;
  avatarStyle?: 'professional' | 'friendly' | 'modern';
  size?: 'small' | 'medium' | 'large';
}

const AIAvatar: React.FC<AIAvatarProps> = ({
  isListening = false,
  isSpeaking = false,
  isThinking = false,
  avatarStyle = 'professional',
  size = 'medium'
}) => {
  const [blinkAnimation, setBlinkAnimation] = useState(false);

  // Random blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (!isSpeaking && !isThinking) {
        setBlinkAnimation(true);
        setTimeout(() => setBlinkAnimation(false), 150);
      }
    }, Math.random() * 3000 + 2000); // Random blink every 2-5 seconds

    return () => clearInterval(blinkInterval);
  }, [isSpeaking, isThinking]);

  const getAvatarSize = () => {
    switch (size) {
      case 'small': return '80px';
      case 'large': return '200px';
      default: return '120px';
    }
  };

  const getStatusColor = () => {
    if (isSpeaking) return 'var(--yellow)';
    if (isListening) return '#10b981';
    if (isThinking) return '#6366f1';
    return 'var(--gray-300)';
  };

  const getStatusText = () => {
    if (isSpeaking) return 'Pose une question...';
    if (isListening) return 'Écoute votre réponse...';
    if (isThinking) return 'Réfléchit...';
    return 'En attente';
  };

  const getAvatarExpression = () => {
    if (isSpeaking) return '😊'; // Friendly speaking
    if (isListening) return '👂'; // Listening
    if (isThinking) return '🤔'; // Thinking
    return '😐'; // Neutral
  };

  return (
    <div className="ai-avatar-container">
      <div className="avatar-wrapper">
        {/* Status Ring */}
        <div className={`status-ring ${isSpeaking ? 'speaking' : ''} ${isListening ? 'listening' : ''}`}>
          
          {/* Main Avatar */}
          <div className="avatar-main">
            {/* Background Circle */}
            <div className="avatar-bg">
              
              {/* Avatar Face */}
              <div className="avatar-face">
                {avatarStyle === 'professional' ? (
                  <div className="professional-avatar">
                    {/* Eyes */}
                    <div className={`eyes ${blinkAnimation ? 'blinking' : ''}`}>
                      <div className="eye left-eye"></div>
                      <div className="eye right-eye"></div>
                    </div>
                    
                    {/* Mouth */}
                    <div className={`mouth ${isSpeaking ? 'speaking' : ''}`}></div>
                    
                    {/* AI Indicator */}
                    <div className="ai-indicator">AI</div>
                  </div>
                ) : avatarStyle === 'friendly' ? (
                  <div className="friendly-avatar">
                    <div className="emoji-face">{getAvatarExpression()}</div>
                  </div>
                ) : (
                  <div className="modern-avatar">
                    {/* Geometric AI design */}
                    <div className="geometric-face">
                      <div className={`dot dot-1 ${isSpeaking ? 'active' : ''}`}></div>
                      <div className={`dot dot-2 ${isSpeaking ? 'active' : ''}`}></div>
                      <div className={`dot dot-3 ${isSpeaking ? 'active' : ''}`}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Voice Waves (when speaking) */}
          {isSpeaking && (
            <div className="voice-waves">
              <div className="wave wave-1"></div>
              <div className="wave wave-2"></div>
              <div className="wave wave-3"></div>
            </div>
          )}
        </div>
      </div>
      
      {/* Status Text */}
      <div className="avatar-status">
        <div className="status-text">{getStatusText()}</div>
        <div className="status-subtitle">IA Recruteur</div>
      </div>

      <style jsx>{`
        .ai-avatar-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
        }

        .avatar-wrapper {
          position: relative;
          width: ${getAvatarSize()};
          height: ${getAvatarSize()};
        }

        .status-ring {
          width: 100%;
          height: 100%;
          border: 3px solid ${getStatusColor()};
          border-radius: 50%;
          position: relative;
          transition: all 0.3s ease;
          animation: ${isSpeaking ? 'pulse 1.5s infinite' : 'none'};
        }

        .status-ring.speaking {
          border-color: var(--yellow);
          box-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
        }

        .status-ring.listening {
          border-color: #10b981;
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
        }

        .avatar-main {
          width: calc(100% - 8px);
          height: calc(100% - 8px);
          margin: 4px;
          border-radius: 50%;
          overflow: hidden;
          position: relative;
        }

        .avatar-bg {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, var(--gray-100), var(--white));
          border: 2px solid var(--black);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .avatar-face {
          width: 80%;
          height: 80%;
          position: relative;
        }

        /* Professional Avatar */
        .professional-avatar {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .eyes {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 60%;
          height: 20%;
          position: absolute;
          top: 30%;
          left: 50%;
          transform: translateX(-50%);
        }

        .eye {
          width: 8px;
          height: 8px;
          background: var(--black);
          border-radius: 50%;
          transition: all 0.1s ease;
        }

        .eyes.blinking .eye {
          height: 2px;
          border-radius: 50%;
        }

        .mouth {
          width: 20px;
          height: 10px;
          border: 2px solid var(--black);
          border-top: none;
          border-radius: 0 0 20px 20px;
          position: absolute;
          top: 55%;
          left: 50%;
          transform: translateX(-50%);
          transition: all 0.2s ease;
        }

        .mouth.speaking {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid var(--black);
          animation: mouthMove 0.3s infinite alternate;
        }

        .ai-indicator {
          position: absolute;
          bottom: 5%;
          right: 5%;
          background: var(--black);
          color: var(--white);
          padding: 2px 4px;
          border-radius: 4px;
          font-size: 8px;
          font-weight: bold;
        }

        /* Friendly Avatar */
        .friendly-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }

        .emoji-face {
          font-size: 2rem;
          animation: ${isSpeaking ? 'bounce 0.6s infinite alternate' : 'none'};
        }

        /* Modern Avatar */
        .modern-avatar {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .geometric-face {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .dot {
          width: 8px;
          height: 8px;
          background: var(--black);
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .dot.active {
          background: var(--yellow);
          animation: dotPulse 0.6s infinite alternate;
        }

        .dot-2.active {
          animation-delay: 0.2s;
        }

        .dot-3.active {
          animation-delay: 0.4s;
        }

        /* Voice Waves */
        .voice-waves {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 140%;
          height: 140%;
          pointer-events: none;
        }

        .wave {
          position: absolute;
          border: 2px solid var(--yellow);
          border-radius: 50%;
          opacity: 0;
          animation: waveExpand 1.5s infinite;
        }

        .wave-1 {
          width: 100%;
          height: 100%;
          animation-delay: 0s;
        }

        .wave-2 {
          width: 100%;
          height: 100%;
          animation-delay: 0.5s;
        }

        .wave-3 {
          width: 100%;
          height: 100%;
          animation-delay: 1s;
        }

        /* Status Display */
        .avatar-status {
          text-align: center;
        }

        .status-text {
          font-weight: 600;
          color: var(--black);
          font-size: 0.9rem;
          margin-bottom: 0.25rem;
        }

        .status-subtitle {
          font-size: 0.75rem;
          color: var(--gray-600);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Animations */
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        @keyframes mouthMove {
          0% { transform: translateX(-50%) scale(1); }
          100% { transform: translateX(-50%) scale(1.1); }
        }

        @keyframes bounce {
          0% { transform: translateY(0); }
          100% { transform: translateY(-4px); }
        }

        @keyframes dotPulse {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(1.3); opacity: 1; }
        }

        @keyframes waveExpand {
          0% {
            transform: scale(0.8);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }

        @media (max-width: 768px) {
          .avatar-wrapper {
            width: ${size === 'large' ? '150px' : size === 'small' ? '60px' : '100px'};
            height: ${size === 'large' ? '150px' : size === 'small' ? '60px' : '100px'};
          }

          .emoji-face {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AIAvatar;