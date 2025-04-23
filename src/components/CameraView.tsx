import React, { useRef, useEffect } from 'react';

interface CameraViewProps {
  stream: MediaStream | null;
  isActive: boolean;
  videoRef?: React.RefObject<HTMLVideoElement>;
}

const CameraView: React.FC<CameraViewProps> = ({ stream, isActive, videoRef }) => {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const actualVideoRef = videoRef || internalVideoRef;

  useEffect(() => {
    if (actualVideoRef.current && stream && isActive) {
      actualVideoRef.current.srcObject = stream;
    }
    return () => {
      if (actualVideoRef.current) {
        actualVideoRef.current.srcObject = null;
      }
    };
  }, [stream, isActive, actualVideoRef]);

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden bg-neutral-900 flex items-center justify-center">
      {isActive ? (
        <video
          ref={actualVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-neutral-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-4"
          >
            <path d="M11.3 6A1.76 1.76 0 0 0 9.6 7.8v8.4a1.76 1.76 0 0 0 1.7 1.8h8.4a1.76 1.76 0 0 0 1.7-1.8V7.8A1.76 1.76 0 0 0 19.7 6z" />
            <path d="m4.6 6 2 2-2 2" />
            <path d="M2.6 12h8.3" />
          </svg>
          <p>Camera is off</p>
        </div>
      )}
    </div>
  );
};

export default CameraView;