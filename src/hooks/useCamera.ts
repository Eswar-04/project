import { useState, useEffect, useCallback } from 'react';

const useCamera = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // Function to get available camera devices
  const getVideoDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      setHasMultipleCameras(videoDevices.length > 1);
    } catch (err) {
      console.error('Error getting video devices:', err);
    }
  }, []);

  // Function to start camera
  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Request permission to use the camera
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: currentDeviceId ? { deviceId: { exact: currentDeviceId } } : true,
        audio: false
      });

      // Update state with the new stream
      setStream(mediaStream);
      setIsActive(true);
      
      // Get the camera device ID that was actually used
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        setCurrentDeviceId(settings.deviceId || null);
      }
      
      // Refresh the list of available devices
      await getVideoDevices();
    } catch (err: any) {
      console.error('Camera error:', err);
      
      // Set appropriate error message based on the error
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera access denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera and try again.');
      } else if (err.name === 'NotReadableError' || err.name === 'AbortError') {
        setError('Camera is already in use by another application or not available.');
      } else {
        setError(`Camera error: ${err.message || 'Unknown error occurred.'}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentDeviceId, getVideoDevices]);

  // Function to stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsActive(false);
  }, [stream]);

  // Toggle camera function
  const toggleCamera = useCallback(() => {
    if (isActive) {
      stopCamera();
    } else {
      startCamera();
    }
  }, [isActive, startCamera, stopCamera]);

  // Switch camera function
  const switchCamera = useCallback(async () => {
    if (!hasMultipleCameras) return;
    
    // Stop current camera
    stopCamera();
    
    // Find the next camera to use
    if (devices.length > 1 && currentDeviceId) {
      const currentIndex = devices.findIndex(device => device.deviceId === currentDeviceId);
      const nextIndex = (currentIndex + 1) % devices.length;
      setCurrentDeviceId(devices[nextIndex].deviceId);
    } else {
      // If we don't have a current device ID or no devices, just use the first one
      setCurrentDeviceId(devices[0]?.deviceId || null);
    }
    
    // Small delay to ensure previous stream is fully stopped
    setTimeout(() => {
      startCamera();
    }, 300);
  }, [devices, currentDeviceId, hasMultipleCameras, startCamera, stopCamera]);

  // Initialize on mount
  useEffect(() => {
    getVideoDevices();
    
    // Cleanup on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [getVideoDevices, stream]);

  return {
    stream,
    isActive,
    isLoading,
    error,
    hasMultipleCameras,
    toggleCamera,
    switchCamera
  };
};

export default useCamera;