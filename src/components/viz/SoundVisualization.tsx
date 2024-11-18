import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { WavStreamPlayer } from '../../lib/wavtools/index.js'; // Adjust the import path

const SoundVisualization = ({ wavStreamPlayer }: { wavStreamPlayer: WavStreamPlayer }) => {
  const meshRef = useRef<any>();
  const [frequencyData, setFrequencyData] = useState<Float32Array>(new Float32Array(8192));

  if (!wavStreamPlayer) {
    return null;
  }

  useEffect(() => {
    if (!wavStreamPlayer) return; // Guard clause
    const updateFrequencyData = () => {
      try {
        const frequencies = wavStreamPlayer.getFrequencies('frequency');
        setFrequencyData(frequencies.values);
      } catch (error) {
        console.error('Error fetching frequencies:', error);
      }
    };

    const interval = setInterval(updateFrequencyData, 100);
    return () => clearInterval(interval);
  }, [wavStreamPlayer]);

  useFrame(() => {
    if (meshRef.current) {
      // Example: Scale mesh based on frequency data
      const lowFreq = frequencyData.slice(0, frequencyData.length / 3).reduce((a, b) => a + b, 0) / (frequencyData.length / 3);
      const midFreq = frequencyData.slice(frequencyData.length / 3, 2 * frequencyData.length / 3).reduce((a, b) => a + b, 0) / (frequencyData.length / 3);
      const highFreq = frequencyData.slice(2 * frequencyData.length / 3).reduce((a, b) => a + b, 0) / (frequencyData.length / 3);

      meshRef.current.children[0].scale.set(lowFreq, lowFreq, lowFreq);
      meshRef.current.children[1].scale.set(midFreq, midFreq, midFreq);
      meshRef.current.children[2].scale.set(highFreq, highFreq, highFreq);
    }
  });

  return (
    <group ref={meshRef}>
      <mesh position={[-2, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="green" />
      </mesh>
      <mesh position={[2, 0, 0]}>
        <coneGeometry args={[1, 2, 32]} />
        <meshStandardMaterial color="blue" />
      </mesh>
    </group>
  );
};

const SoundVisualizationCanvas = ({ wavStreamPlayer }: { wavStreamPlayer: WavStreamPlayer }) => (
  <Canvas>
    <ambientLight />
    <pointLight position={[10, 10, 10]} />
    <SoundVisualization wavStreamPlayer={wavStreamPlayer} />
  </Canvas>
);

export default SoundVisualizationCanvas;