import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface ThreeJsVisualizationProps {
  aiSpeechData: string;
}

const ThreeJsVisualization: React.FC<ThreeJsVisualizationProps> = ({ aiSpeechData }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Set up scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Create a simple cube
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 5;

    // Animation function
    const animate = () => {
      requestAnimationFrame(animate);

      // Rotate the cube based on the length of aiSpeechData
      cube.rotation.x += 0.01 * aiSpeechData.length;
      cube.rotation.y += 0.01 * aiSpeechData.length;

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, [aiSpeechData]); // Re-run effect when aiSpeechData changes

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
};

export default ThreeJsVisualization;
