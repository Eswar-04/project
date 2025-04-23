// Revised ARGlasses component with improved positioning and error handling
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface ARGlassesProps {
  keypoints: Array<{ x: number; y: number; z?: number; score?: number; name?: string }>;
  canvasWidth: number;
  canvasHeight: number;
}

const ARGlasses: React.FC<ARGlassesProps> = ({ keypoints, canvasWidth, canvasHeight }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const glassesRef = useRef<THREE.Object3D | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    console.log('Initializing Three.js scene with dimensions:', canvasWidth, canvasHeight);
    
    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Set up camera with ortho projection for better 2D alignment
    const camera = new THREE.PerspectiveCamera(50, canvasWidth / canvasHeight, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    // Set up renderer with explicit pixel ratio
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvasWidth, canvasHeight);
    renderer.setClearColor(0x000000, 0);
    containerRef.current.innerHTML = ''; // Clear any previous renderers
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Set up lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(0, 1, 2);
    scene.add(directionalLight);

    // Visual helper for debugging (sphere at origin)
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    sphere.visible = false; // Make visible for debugging
    scene.add(sphere);

    // Load glasses model
    console.log('Loading glasses model...');
    const loader = new GLTFLoader();
    
    // Try multiple paths to find the model
    const modelPaths = [
      
      '/src/assets/glass.glb',
      
    ];
    
    // If we can't load the model, create a simple glasses placeholder
    const createPlaceholder = () => {
      console.log('Creating glasses placeholder');
      const glassesGroup = new THREE.Group();
      
      // Create simple glasses frames
      const frameMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
      
      // Left lens
      const leftLens = new THREE.Mesh(
        new THREE.TorusGeometry(0.3, 0.05, 16, 32),
        frameMaterial
      );
      leftLens.position.x = -0.4;
      glassesGroup.add(leftLens);
      
      // Right lens
      const rightLens = new THREE.Mesh(
        new THREE.TorusGeometry(0.3, 0.05, 16, 32),
        frameMaterial
      );
      rightLens.position.x = 0.4;
      glassesGroup.add(rightLens);
      
      // Bridge
      const bridge = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.05, 0.05),
        frameMaterial
      );
      glassesGroup.add(bridge);
      
      scene.add(glassesGroup);
      glassesRef.current = glassesGroup;
    };
    
    let loadAttempts = 0;
    const tryLoadModel = (pathIndex = 0) => {
      if (pathIndex >= modelPaths.length) {
        console.warn('Failed to load glasses model after trying all paths');
        setLoadError('Glasses model could not be loaded - using placeholder');
        createPlaceholder();
        return;
      }
      
      loader.load(
        modelPaths[pathIndex],
        (gltf) => {
          console.log('Glasses model loaded successfully from:', modelPaths[pathIndex]);
          const model = gltf.scene;
          
          // Apply initial transformations
          model.scale.set(0.5, 0.5, 0.5);
          model.rotation.set(0, 0, 0);
          
          // Center the model
          new THREE.Box3().setFromObject(model).getCenter(model.position).multiplyScalar(-1);
          
          scene.add(model);
          glassesRef.current = model;
        },
        (progress) => {
          console.log(`Loading progress: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
        },
        (error) => {
          console.warn('Error loading glasses from path:', modelPaths[pathIndex], error);
          loadAttempts++;
          // Try next path
          tryLoadModel(pathIndex + 1);
        }
      );
    };
    
    tryLoadModel();

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      if (rendererRef.current && cameraRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      console.log('Cleaning up Three.js scene');
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current.forceContextLoss();
        rendererRef.current.domElement.remove();
      }
    };
  }, [canvasWidth, canvasHeight]);

  // Update glasses position based on keypoints
  useEffect(() => {
    if (!glassesRef.current || keypoints.length === 0) return;

    const leftEye = keypoints.find(point => point.name === 'left_eye');
    const rightEye = keypoints.find(point => point.name === 'right_eye');
    const nose = keypoints.find(point => point.name === 'nose');

    if (leftEye && rightEye && nose && 
        leftEye.score && rightEye.score && nose.score && 
        leftEye.score > 0.5 && rightEye.score > 0.5) {
      
    
      
      // Calculate center position between eyes
      const centerX = (leftEye.x + rightEye.x) / 2;
      const centerY = (leftEye.y + rightEye.y) / 2;
      
      // Convert screen coordinates to normalized device coordinates (-1 to 1)
      const x = ((centerX / canvasWidth) * 2 - 1) * 2.5;
      const y = (-(centerY / canvasHeight) * 2 + 1) * 2;
      
      // Position the glasses
      glassesRef.current.position.set(x, y, 0);
      
      // Calculate rotation based on eye positions
      const angle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
      glassesRef.current.rotation.z = angle;
      
      // Calculate scale based on distance between eyes
      const distance = Math.sqrt(
        Math.pow(rightEye.x - leftEye.x, 2) + Math.pow(rightEye.y - leftEye.y, 2)
      );
      const scale = distance / 150; // Adjust scale factor
      glassesRef.current.scale.set(scale, scale, scale);
    }
  }, [keypoints, canvasWidth, canvasHeight]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      {loadError && (
        <div className="absolute top-0 left-0 bg-black/50 text-white text-xs p-1 rounded">
          {loadError}
        </div>
      )}
    </div>
  );
};

export default ARGlasses;