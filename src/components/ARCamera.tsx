import React, { useRef, useEffect } from 'react';
import useCamera from '../hooks/useCamera';
import useARCamera from '../hooks/useARCamera';
import CameraView from './CameraView';
import CameraControls from './CameraControls';

interface ARCameraProps {
  className?: string;
}

const ARCamera: React.FC<ARCameraProps> = ({ className = '' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const arCanvasRef = useRef<HTMLCanvasElement>(null);
  
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
    isPersonDetected,
    toggleAR,
    canvasRef,
  } = useARCamera(videoRef);

  // Connect internal canvas to our ref with proper scaling
  useEffect(() => {
    if (canvasRef.current && arCanvasRef.current) {
      // Copy content from internal canvas to our render canvas
      const ctx = arCanvasRef.current.getContext('2d');
      if (ctx) {
        const copyCanvas = () => {
          if (isARActive && canvasRef.current && arCanvasRef.current) {
            ctx.clearRect(0, 0, arCanvasRef.current.width, arCanvasRef.current.height);
            // Draw with preserving aspect ratio and without scaling
            ctx.drawImage(
              canvasRef.current, 
              0, 0, canvasRef.current.width, canvasRef.current.height,
              0, 0, arCanvasRef.current.width, arCanvasRef.current.height
            );
          }
          requestAnimationFrame(copyCanvas);
        };
        
        requestAnimationFrame(copyCanvas);
      }
    }
  }, [canvasRef, isARActive]);

  // Update canvas dimensions when video dimensions change or when stream changes
  useEffect(() => {
    const updateCanvasDimensions = () => {
      if (videoRef.current && arCanvasRef.current) {
        // Set exact dimensions from video
        const videoWidth = videoRef.current.videoWidth || 640;
        const videoHeight = videoRef.current.videoHeight || 480;
        
        arCanvasRef.current.width = videoWidth;
        arCanvasRef.current.height = videoHeight;
      }
    };

    if (videoRef.current) {
      videoRef.current.addEventListener('loadedmetadata', updateCanvasDimensions);
      // Force update when already loaded
      if (videoRef.current.readyState >= 2) {
        updateCanvasDimensions();
      }
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('loadedmetadata', updateCanvasDimensions);
      }
    };
  }, [stream]); // Re-run when stream changes

  return (
    <div className={`relative rounded-xl overflow-hidden shadow-xl ${className}`}>
      <div className="relative aspect-video w-full max-w-2xl mx-auto bg-gray-900">
        {/* Video element - always keep it active but may be visually hidden */}
        <div className={`absolute inset-0 ${isARActive ? 'opacity-0' : 'opacity-100'}`}>
          <CameraView stream={stream} isActive={isActive} videoRef={videoRef} />
        </div>
        
        {/* AR canvas overlay - always visible when AR is active */}
        <div className={`absolute inset-0 ${isARActive ? 'block' : 'hidden'}`}>
          <canvas 
            ref={arCanvasRef}
            className="w-full h-full object-contain" 
            style={{
              objectFit: 'contain',
              objectPosition: 'center',
              width: '100%',
              height: '100%'
            }}
          />
        </div>
        
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
              <p className="text-sm text-white/80">{error || modelLoadError}</p>
              <button
                onClick={error ? toggleCamera : toggleAR}
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
              <p className="text-white">Loading AR Tracking...</p>
              <p className="text-white/70 text-sm mt-2">Preparing live pose detection</p>
            </div>
          </div>
        )}
        
        {/* Camera controls */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
          <CameraControls
            isActive={isActive}
            isLoading={isLoading}
            onToggleCamera={toggleCamera}
            onSwitchCamera={switchCamera}
            hasMultipleCameras={hasMultipleCameras}
          />
          
          {/* AR Toggle Button */}
          {isActive && (
            <button
              onClick={toggleAR}
              disabled={isModelLoading}
              className={`
                flex items-center justify-center w-14 h-14 rounded-full 
                ${isARActive ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'}
                text-white shadow-lg transition-all duration-300 ease-in-out
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              aria-label={isARActive ? "Disable live tracking" : "Enable live tracking"}
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
                  <path d="M15.5 12 9 6.5l1.5 5.5-1.5 5.5L15.5 12Z"></path>
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          )}
        </div>
        
        {/* Live tracking indicator - only shown when in AR mode */}
        {isARActive && (
          <div className="absolute top-2 left-2 right-2 flex justify-between">
            <div className="bg-black/50 backdrop-blur-sm text-white text-xs p-2 rounded flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${isPersonDetected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span>{isPersonDetected ? 'Live Tracking Active' : 'Waiting for detection...'}</span>
            </div>
            
            {isPersonDetected && (
              <div className="bg-black/50 backdrop-blur-sm text-white text-xs p-2 rounded">
                Tracking {detectedPoses.length} {detectedPoses.length === 1 ? 'person' : 'people'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ARCamera;