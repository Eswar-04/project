import React, { useRef, useState, useEffect } from 'react';
import useCamera from '../hooks/useCamera';
import useARCamera from '../hooks/useARCamera';
import CameraView from './CameraView';
import CameraControls from './CameraControls';

interface CameraProps {
  className?: string;
}

const Camera: React.FC<CameraProps> = ({ className = '' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const arCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isARMode, setIsARMode] = useState(false);
  
  // Regular camera functionality
  const {
    stream,
    isActive,
    isLoading,
    error,
    hasMultipleCameras,
    toggleCamera,
    switchCamera,
  } = useCamera();

  // AR functionality
  const {
    isARActive,
    isModelLoading,
    modelLoadError,
    detectedPoses,
    toggleAR,
    canvasRef,
  
  } = useARCamera(videoRef);

  // Connect internal canvas to our ref
  useEffect(() => {
    if (canvasRef.current && arCanvasRef.current) {
      // Copy content from internal canvas to our render canvas
      const ctx = arCanvasRef.current.getContext('2d');
      if (ctx) {
        const copyCanvas = () => {
          if (isARActive && canvasRef.current && arCanvasRef.current) {
            ctx.clearRect(0, 0, arCanvasRef.current.width, arCanvasRef.current.height);
            ctx.drawImage(canvasRef.current, 0, 0);
          }
          requestAnimationFrame(copyCanvas);
        };
        
        requestAnimationFrame(copyCanvas);
      }
    }
  }, [canvasRef, isARActive]);

  // Update canvas dimensions when video dimensions change
  useEffect(() => {
    const updateCanvasDimensions = () => {
      if (videoRef.current && arCanvasRef.current) {
        arCanvasRef.current.width = videoRef.current.videoWidth || 640;
        arCanvasRef.current.height = videoRef.current.videoHeight || 480;
      }
    };

    if (videoRef.current) {
      videoRef.current.addEventListener('loadedmetadata', updateCanvasDimensions);
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('loadedmetadata', updateCanvasDimensions);
      }
    };
  }, []);

  // Handle AR mode toggle
  const handleARToggle = () => {
    if (!isARMode) {
      // Turning AR on
      setIsARMode(true);
      if (isActive && !isARActive) {
        toggleAR(); // Start AR processing
      }
    } else {
      // Turning AR off
      setIsARMode(false);
      if (isARActive) {
        toggleAR(); // Stop AR processing
      }
    }
  };

  // If camera is turned on and AR mode is active, initialize AR
  useEffect(() => {
    if (isActive && isARMode && !isARActive && !isModelLoading) {
      // Small delay to ensure video is ready
      const timer = setTimeout(() => {
        toggleAR();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isActive, isARMode, isARActive, isModelLoading, toggleAR]);

  return (
    <div className={`relative rounded-xl overflow-hidden shadow-xl ${className}`}>
      <div className="relative aspect-video w-full max-w-2xl mx-auto bg-gray-900">
        {/* Original camera view (hidden when AR is active) */}
        <div className={isARActive ? 'hidden' : 'block'}>
          <CameraView stream={stream} isActive={isActive} videoRef={videoRef} />
        </div>
        
        {/* AR canvas overlay (shown when AR is active) */}
        <div className={`absolute inset-0 ${isARActive ? 'block' : 'hidden'}`}>
          <canvas 
            ref={arCanvasRef}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* AR Stats display */}
        {isARActive && detectedPoses.length > 0 && (
          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white text-xs p-2 rounded">
            <div className="font-semibold mb-1">AR Active</div>
            <div>Detected: {detectedPoses.length} {detectedPoses.length === 1 ? 'person' : 'people'}</div>
          </div>
        )}
        
        {/* Error display */}
        {(error || modelLoadError) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/75 text-white p-4">
            <div className="bg-red-500/20 backdrop-blur-md rounded-lg p-4 max-w-md text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto mb-2"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
              <h3 className="text-lg font-semibold mb-1">Error</h3>
              <p className="text-sm text-white/80">{modelLoadError || error}</p>
              <button
                onClick={modelLoadError ? toggleAR : toggleCamera}
                className="mt-3 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-md text-white transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
        
        {/* Loading indicator for AR model */}
        {isModelLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-white">Loading AR models...</p>
            </div>
          </div>
        )}
        
        {/* Camera controls */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
          {/* Regular camera controls */}
          <CameraControls
            isActive={isActive}
            isLoading={isLoading}
            onToggleCamera={toggleCamera}
            onSwitchCamera={switchCamera}
            hasMultipleCameras={hasMultipleCameras}
          />
          
          {/* AR Toggle Button - only shown when camera is active */}
          {isActive && (
            <button
              onClick={handleARToggle}
              disabled={isModelLoading}
              className={`
                flex items-center justify-center w-14 h-14 rounded-full 
                ${isARMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'}
                text-white shadow-lg transition-all duration-300 ease-in-out
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              aria-label={isARMode ? "Disable AR mode" : "Enable AR mode"}
            >
              {isModelLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M3 7v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7"></path>
                  <path d="M15.5 12 9 6.5l1.5 5.5-1.5 5.5L15.5 12Z"></path>
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Camera;