import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

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

  useEffect(() => {
    if (!containerRef.current) return;

    console.log('Initializing Three.js scene...');
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, canvasWidth / canvasHeight, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      alpha: true,
      antialias: true
    });
    renderer.setSize(canvasWidth, canvasHeight);
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 1, 2);
    scene.add(directionalLight);

    console.log('Loading glasses model...');
    const loader = new GLTFLoader();
    loader.load(
      '/src/assets/galaxy_glasses_8k_pbr (1).glb',
      (gltf) => {
        console.log('Glasses model loaded successfully');
        const model = gltf.scene;
        model.scale.set(0.5, 0.5, 0.5); // Smaller initial scale
        model.rotation.x = Math.PI / 2; // Rotate to face forward
        scene.add(model);
        glassesRef.current = model;
      },
      (progress) => {
        console.log(`Loading progress: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
      },
      (error) => {
        console.error('Error loading glasses:', error);
      }
    );

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      console.log('Cleaning up Three.js scene');
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [canvasWidth, canvasHeight]);

  useEffect(() => {
    if (!glassesRef.current || keypoints.length === 0) return;

    const leftEye = keypoints.find(point => point.name === 'left_eye');
    const rightEye = keypoints.find(point => point.name === 'right_eye');
    const nose = keypoints.find(point => point.name === 'nose');

    if (leftEye && rightEye && nose && leftEye.score && rightEye.score && leftEye.score > 0.2 && rightEye.score > 0.2) {
      const centerX = (leftEye.x + rightEye.x) / 2;
      const centerY = (leftEye.y + rightEye.y) / 2;

      // Adjust coordinate conversion
      const x = ((centerX / canvasWidth) * 2 - 1) * 3; // Increased multiplier
      const y = (-(centerY / canvasHeight) * 2 + 1) * 2; // Adjusted multiplier

      glassesRef.current.position.set(x, y, -2); // Moved closer to camera

      const angle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
      glassesRef.current.rotation.z = angle;

      const distance = Math.sqrt(
        Math.pow(rightEye.x - leftEye.x, 2) + Math.pow(rightEye.y - leftEye.y, 2)
      );
      const scale = distance / 200; // Adjusted scale factor
      glassesRef.current.scale.set(scale, scale, scale);

     
    }
  }, [keypoints, canvasWidth, canvasHeight]);

  return <div ref={containerRef} className="absolute inset-0" />;
};

export default ARGlasses;