import React from 'react';
import { Camera, SwitchCamera, StopCircle, CameraOff } from 'lucide-react';

interface CameraControlsProps {
  isActive: boolean;
  isLoading: boolean;
  onToggleCamera: () => void;
  onSwitchCamera: () => void;
  hasMultipleCameras: boolean;
}

const CameraControls: React.FC<CameraControlsProps> = ({
  isActive,
  isLoading,
  onToggleCamera,
  onSwitchCamera,
  hasMultipleCameras,
}) => {
  return (
    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 transition-opacity">
      <button
        onClick={onToggleCamera}
        disabled={isLoading}
        className={`
          flex items-center justify-center w-14 h-14 rounded-full 
          ${
            isActive
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-emerald-500 hover:bg-emerald-600'
          }
          text-white shadow-lg transition-all duration-300 ease-in-out
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {isLoading ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : isActive ? (
          <StopCircle size={24} />
        ) : (
          <Camera size={24} />
        )}
      </button>

      {hasMultipleCameras && isActive && (
        <button
          onClick={onSwitchCamera}
          disabled={isLoading}
          className="flex items-center justify-center w-14 h-14 rounded-full 
                    bg-blue-500 hover:bg-blue-600 
                    text-white shadow-lg transition-all duration-300 ease-in-out
                    disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SwitchCamera size={24} />
        </button>
      )}
    </div>
  );
};

export default CameraControls;