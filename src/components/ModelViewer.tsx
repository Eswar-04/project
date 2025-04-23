import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const models = [
  { id: 'classic', name: 'Classic Glasses', path: '/assets/glass.glb' },
  { id: 'aviator', name: 'Aviator Sunglasses', path: '/assets/aviator.glb' },
  { id: 'round', name: 'Round Glasses', path: '/assets/round.glb' }
];

const ModelViewer = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentModel, setCurrentModel] = useState(models[0]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x1a1a1a);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 2;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1;
    controls.maxDistance = 5;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Helper grid (optional, for development)
    const gridHelper = new THREE.GridHelper(10, 10);
    gridHelper.visible = false;
    scene.add(gridHelper);

    // Load model
    const loadModel = () => {
      // Clear existing model
      scene.children.forEach((child) => {
        if (child instanceof THREE.Group) {
          scene.remove(child);
        }
      });

      const loader = new GLTFLoader();
      setLoadError(null);

      // Add loading placeholder
      const geometry = new THREE.BoxGeometry(1, 0.3, 0.5);
      const material = new THREE.MeshPhongMaterial({ 
        color: 0x808080,
        opacity: 0.5,
        transparent: true
      });
      const placeholder = new THREE.Mesh(geometry, material);
      scene.add(placeholder);

      loader.load(
        currentModel.path,
        (gltf) => {
          scene.remove(placeholder);
          scene.add(gltf.scene);
          
          // Center and scale the model
          const box = new THREE.Box3().setFromObject(gltf.scene);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          
          gltf.scene.position.x = -center.x;
          gltf.scene.position.y = -center.y;
          gltf.scene.position.z = -center.z;
          
          const scale = 1 / Math.max(size.x, size.y, size.z);
          gltf.scene.scale.setScalar(scale);
        },
        undefined,
        (error) => {
          scene.remove(placeholder);
          console.error('Error loading model:', error);
          setLoadError('Failed to load 3D model');
        }
      );
    };

    loadModel();

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      containerRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [currentModel]);

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-slate-200">3D Model Preview</h3>
        <select
          value={currentModel.id}
          onChange={(e) => setCurrentModel(models.find(m => m.id === e.target.value) || models[0])}
          className="bg-slate-700 text-slate-200 rounded px-3 py-1 text-sm border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {models.map(model => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      </div>
      <div className="relative">
        <div ref={containerRef} className="w-full h-[300px] rounded-lg overflow-hidden bg-slate-900" />
        {loadError && (
          <div className="absolute top-2 left-2 bg-red-500/90 text-white text-sm px-3 py-1 rounded">
            {loadError}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelViewer;