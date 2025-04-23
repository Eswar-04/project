import { useState, useEffect, useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';

interface ARCameraState {
  isARActive: boolean;
  isModelLoading: boolean;
  modelLoadError: string | null;
  detectedPoses: poseDetection.Pose[];
  isPersonDetected: boolean;
}

export const useARCamera = (videoRef: React.RefObject<HTMLVideoElement>) => {
  const [arState, setARState] = useState<ARCameraState>({
    isARActive: false,
    isModelLoading: false,
    modelLoadError: null,
    detectedPoses: [],
    isPersonDetected: false
  });
  
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const requestAnimationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize TensorFlow and load the pose detection model
  const initializeARModel = useCallback(async () => {
    if (!videoRef.current) return;
    
    setARState(prev => ({ ...prev, isModelLoading: true, modelLoadError: null }));
    
    try {
      await tf.ready();
      
      const model = poseDetection.SupportedModels.MoveNet;
      const detectorConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
        minPoseScore: 0.2
      };
      
      const detector = await poseDetection.createDetector(model, detectorConfig);
      detectorRef.current = detector;
      
      if (!canvasRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        canvasRef.current = canvas;
      }
      
      setARState(prev => ({ ...prev, isModelLoading: false, isARActive: true }));
      startPoseDetection();
    } catch (error) {
      console.error("Error initializing AR model:", error);
      setARState(prev => ({ 
        ...prev, 
        isModelLoading: false, 
        modelLoadError: `Failed to load AR models: ${error instanceof Error ? error.message : String(error)}`
      }));
    }
  }, [videoRef]);

  const detectPoses = useCallback(async () => {
    if (!detectorRef.current || !videoRef.current || !videoRef.current.readyState || !canvasRef.current) {
      requestAnimationFrameRef.current = requestAnimationFrame(detectPoses);
      return;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      // Clear the canvas
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      // Calculate scaling to maintain aspect ratio
      const videoAspect = videoRef.current.videoWidth / videoRef.current.videoHeight;
      const canvasAspect = canvasRef.current.width / canvasRef.current.height;
      
      let drawWidth = canvasRef.current.width;
      let drawHeight = canvasRef.current.height;
      let offsetX = 0;
      let offsetY = 0;
      
      if (videoAspect > canvasAspect) {
        drawHeight = canvasRef.current.width / videoAspect;
        offsetY = (canvasRef.current.height - drawHeight) / 2;
      } else {
        drawWidth = canvasRef.current.height * videoAspect;
        offsetX = (canvasRef.current.width - drawWidth) / 2;
      }

      // Draw video maintaining aspect ratio
      ctx.drawImage(
        videoRef.current,
        offsetX,
        offsetY,
        drawWidth,
        drawHeight
      );
    }

    try {
      const poses = await detectorRef.current.estimatePoses(videoRef.current, {
        flipHorizontal: false,
        maxPoses: 1
      });
      
      const hasValidPerson = poses.length > 0;
      
      setARState(prev => ({ 
        ...prev, 
        detectedPoses: poses,
        isPersonDetected: hasValidPerson
      }));
      
      if (ctx && poses.length > 0) {
        drawTrackingPoints(ctx, poses);
      }
      
      requestAnimationFrameRef.current = requestAnimationFrame(detectPoses);
    } catch (error) {
      console.error("Error detecting poses:", error);
      requestAnimationFrameRef.current = requestAnimationFrame(detectPoses);
    }
  }, [videoRef]);

  const drawTrackingPoints = useCallback((ctx: CanvasRenderingContext2D, poses: poseDetection.Pose[]) => {
    poses.forEach(pose => {
      if (pose.keypoints) {
        // Draw all keypoints for full body tracking
        pose.keypoints.forEach(keypoint => {
          if (keypoint.score && keypoint.score > 0.2) {
            // Draw tracking point
            ctx.beginPath();
            ctx.arc(keypoint.x, keypoint.y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
            ctx.fill();
            
            // Draw point glow
            ctx.beginPath();
            ctx.arc(keypoint.x, keypoint.y, 6, 0, 2 * Math.PI);
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        });

        // Draw skeleton lines between keypoints
        const connections = [
          ['nose', 'left_eye'], ['nose', 'right_eye'],
          ['left_eye', 'left_ear'], ['right_eye', 'right_ear'],
          ['left_shoulder', 'right_shoulder'],
          ['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist'],
          ['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist'],
          ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'],
          ['left_hip', 'right_hip'],
          ['left_hip', 'left_knee'], ['left_knee', 'left_ankle'],
          ['right_hip', 'right_knee'], ['right_knee', 'right_ankle']
        ];

        connections.forEach(([from, to]) => {
          const fromPoint = pose.keypoints.find(kp => kp.name === from);
          const toPoint = pose.keypoints.find(kp => kp.name === to);
          
          if (fromPoint && toPoint && 
              fromPoint.score && toPoint.score && 
              fromPoint.score > 0.2 && toPoint.score > 0.2) {
            ctx.beginPath();
            ctx.moveTo(fromPoint.x, fromPoint.y);
            ctx.lineTo(toPoint.x, toPoint.y);
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        });
      }
    });
  }, []);

  const startPoseDetection = useCallback(() => {
    if (requestAnimationFrameRef.current) {
      cancelAnimationFrame(requestAnimationFrameRef.current);
    }
    requestAnimationFrameRef.current = requestAnimationFrame(detectPoses);
  }, [detectPoses]);

  const toggleAR = useCallback(() => {
    if (arState.isARActive) {
      if (requestAnimationFrameRef.current) {
        cancelAnimationFrame(requestAnimationFrameRef.current);
        requestAnimationFrameRef.current = null;
      }
      setARState(prev => ({ 
        ...prev, 
        isARActive: false, 
        detectedPoses: [],
        isPersonDetected: false
      }));
    } else {
      initializeARModel();
    }
  }, [arState.isARActive, initializeARModel]);

  useEffect(() => {
    return () => {
      if (requestAnimationFrameRef.current) {
        cancelAnimationFrame(requestAnimationFrameRef.current);
      }
    };
  }, []);

  return {
    ...arState,
    toggleAR,
    canvasRef,
    initializeARModel
  };
};

export default useARCamera;