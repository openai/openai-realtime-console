import React from 'react';
import { Mic } from 'lucide-react';
import { isDev } from '../../utils/dev';

interface CharacterProps {
  isListening: boolean;
  isSpeaking: boolean;
  isConnected: boolean;
  message: string;
  onMicClick: () => Promise<void>;
  isVADMode: boolean;
  onVADToggle: () => Promise<void>;
  disableMic: boolean;
  currentResponse: string;
}

export const Character: React.FC<CharacterProps> = ({
  isListening,
  isSpeaking,
  isConnected,
  message,
  onMicClick,
  isVADMode,
  onVADToggle,
  disableMic,
  currentResponse
}) => {
  React.useEffect(() => {
    console.log('Character state updated:', {
      currentResponse,
      message,
      isListening,
      isSpeaking,
      isConnected
    });
  }, [currentResponse, message, isListening, isSpeaking, isConnected]);

  React.useEffect(() => {
    console.log('Speech bubble content:', {
      message,
      currentResponse,
      isVisible: Boolean(currentResponse || message)
    });
  }, [currentResponse, message]);

  const getAnimationSource = () => {
    if (isDev) {
      console.log('Character state:', { isListening, isSpeaking });
    }
    
    const basePath = '/assets/character';
    let filename;
    
    if (isListening) {
      filename = 'character-listening.gif';
    } else if (isSpeaking) {
      filename = 'character-speaking.gif';
    } else {
      filename = 'character-speaking.gif';
    }
    
    return `${basePath}/${filename}`;
  };

  const getBubbleContent = () => {
    console.log('Bubble content values:', {
      currentResponse,
      message,
      isListening,
      isConnected,
      isSpeaking
    });

    // First priority: Show streaming response
    if (currentResponse) {
      return currentResponse;
    }

    // Second priority: Show completed message
    if (message) {
      return message;
    }

    // Status messages
    if (!isConnected) {
      return "Connect me to start chatting! 👋";
    }
    
    if (isListening) {
      return "I'm listening... 👂";
    }

    if (isSpeaking) {
      return "Thinking...";
    }

    return "Hi there! Let's talk! 😊";
  };

  // Add this useEffect to debug state changes
  React.useEffect(() => {
    console.log('Message state changed:', {
      currentResponse,
      message,
      isListening,
      isSpeaking,
      isConnected
    });
  }, [currentResponse, message, isListening, isSpeaking, isConnected]);

  return (
    <div className="relative w-[500px] h-[600px] flex flex-col items-center justify-center">
      {/* Speech Bubble - Always visible */}
      <div className={`
        absolute 
        top-[-20px] right-[-320px]
        bg-gradient-to-br from-white to-purple-50
        rounded-[30px] p-8
        border-4 ${currentResponse || isSpeaking ? 'border-purple-400' : 'border-purple-400'}
        min-w-[320px] max-w-[400px]
        min-h-[80px]
        text-center z-[100]
        transform
        transition-all duration-300 ease-bounce
        shadow-[0_10px_20px_rgba(147,51,234,0.2)]
        animate-float
      `}>
        <div className="relative">
          {/* Main text with playful typography */}
          <p className="
            text-gray-700 
            text-xl 
            font-comic
            leading-relaxed 
            tracking-wide
            animate-fadeIn
          ">
            {getBubbleContent()}
            {message && (
              <span className="text-sm text-purple-400 block mt-2 animate-fadeIn">
                Complete message
              </span>
            )}
          </p>

          {/* Add more playful decorative elements
          <div className="absolute -right-4 -top-4 text-yellow-400 animate-spin-slow scale-125">
            ⭐
          </div>
          <div className="absolute -left-3 -bottom-3 text-purple-400 animate-bounce-slow scale-125">
            ✨
          </div>
          <div className="absolute right-2 bottom-2 text-pink-400 animate-pulse-slow scale-110">
            🌟
          </div> */}

          {/* Fixed speech bubble tail - now properly positioned and styled */}
          <div className="
            absolute 
            left-[-40px]
            top-1/2 
            -translate-y-1/2
            w-[40px]
            h-[40px]
            overflow-hidden
          ">
            <div className="
              absolute
              top-1/2
              left-1/2
              w-[20px]
              h-[20px]
              bg-gradient-to-br from-white to-purple-50
              border-l-4
              border-b-4
              border-purple-400
              transform 
              rotate-45
              translate-x-1/4
              -translate-y-1/2
            "></div>
          </div>
        </div>
      </div>

      {/* Character Image Container */}
      <div className="relative w-[500px] h-[500px] mt-16 border-2 border-dashed border-purple-300 rounded-lg overflow-hidden">
        <img 
          src={getAnimationSource()}
          alt="Character"
          className="w-full h-full object-contain"
          onError={(e) => {
            if (isDev) {
              console.error('Failed to load image:', e.currentTarget.src);
              console.log('Attempted to load:', e.currentTarget.src);
            }
          }}
        />
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
        {/* VAD Toggle */}
        <button 
          onClick={onVADToggle}
          className={`
            px-4 py-2 rounded-full text-sm
            ${isVADMode ? 'bg-purple-500 text-white' : 'bg-gray-200'}
          `}
        >
          {isVADMode ? 'VAD Mode' : 'Push to Talk'}
        </button>

        {/* Mic Button */}
        <button 
          onClick={onMicClick}
          disabled={disableMic || !isConnected}
          className={`
            w-16 h-16 rounded-full
            flex items-center justify-center
            transition-all duration-300
            ${!isConnected ? 'bg-gray-400' :
              isListening ? 'bg-red-500 animate-pulse' : 'bg-purple-500 hover:bg-purple-600'
            }
            shadow-lg border-4 border-white
          `}
        >
          <Mic className="w-8 h-8 text-white" />
        </button>
      </div>
    </div>
  );
}