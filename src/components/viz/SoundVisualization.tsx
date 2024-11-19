import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { WavStreamPlayer } from '../../lib/wavtools/index.js'; // Adjust the import path
import Cloud from './Cloud';
import CloudApp from './Cloud';

const SoundVisualization = ({ wavStreamPlayer, isActive = false }: { wavStreamPlayer: WavStreamPlayer, isActive: boolean }) => {
  const meshRef = useRef<any>();
  const [frequencyData, setFrequencyData] = useState<Float32Array>(new Float32Array(8192));

  const [avgFreq, setAvgFreq] = useState(.5);
  const [lowFreq, setLowFreq] = useState(.5);
  const [midFreq, setMidFreq] = useState(.5);
  const [highFreq, setHighFreq] = useState(.5);

  const resetFrequencies = () => {
    setAvgFreq(.5);
    setLowFreq(.5);
    setMidFreq(.5);
    setHighFreq(.5)
  }

  useEffect(() => {

    if (!wavStreamPlayer || !isActive) {
      resetFrequencies() 
      return; // Guard clause
    }

    const updateFrequencyData = () => {
      if (!wavStreamPlayer || !isActive){
        resetFrequencies()
        return; // Guard clause
      }
      try {
        const frequencies = wavStreamPlayer.getFrequencies('frequency');
        setFrequencyData(frequencies.values);
      } catch (error) {
        console.error('Error fetching frequencies:', error);
      }
    };

    const interval = setInterval(updateFrequencyData, 50);
    return () => clearInterval(interval);
  }, [wavStreamPlayer, isActive]);

  useEffect(() => {
    if (frequencyData) {
      // average frequency intensity
      const avgFreq = frequencyData.reduce((a, b) => a + b, 0) / frequencyData.length;
  
      // frequency intensity by range
      const lowFreq = frequencyData.slice(0, frequencyData.length / 3).reduce((a, b) => a + b, 0) / (frequencyData.length / 3);
      const midFreq = frequencyData.slice(frequencyData.length / 3, 2 * frequencyData.length / 3).reduce((a, b) => a + b, 0) / (frequencyData.length / 3);
      const highFreq = frequencyData.slice(2 * frequencyData.length / 3).reduce((a, b) => a + b, 0) / (frequencyData.length / 3);
  
      // console.log('avgFreq:', avgFreq);
      // console.log('lowFreq:', lowFreq);
      // console.log('midFreq:', midFreq);
      // console.log('highFreq:', highFreq);

      setAvgFreq(avgFreq);
      setLowFreq(lowFreq);
      setMidFreq(midFreq);
      setHighFreq(highFreq);
    }
    else {
      resetFrequencies();
    }
  }, [frequencyData]);

  // useFrame(() => {
  //   if (meshRef.current && frequencyData) {
  //     // average frequency intensity
  //     const avgFreq = frequencyData.reduce((a, b) => a + b, 0) / frequencyData.length;

  //     // frequency intensity by range
  //     const lowFreq = frequencyData.slice(0, frequencyData.length / 3).reduce((a, b) => a + b, 0) / (frequencyData.length / 3);
  //     const midFreq = frequencyData.slice(frequencyData.length / 3, 2 * frequencyData.length / 3).reduce((a, b) => a + b, 0) / (frequencyData.length / 3);
  //     const highFreq = frequencyData.slice(2 * frequencyData.length / 3).reduce((a, b) => a + b, 0) / (frequencyData.length / 3);

  //     setAvgFreq(avgFreq);
  //     setLowFreq(lowFreq);
  //     setMidFreq(midFreq);
  //     setHighFreq(highFreq);

  //     // meshRef.current.children[0].scale.set(lowFreq, lowFreq, lowFreq);
  //     // meshRef.current.children[1].scale.set(midFreq, midFreq, midFreq);
  //     // meshRef.current.children[2].scale.set(highFreq, highFreq, highFreq);
  //   }
  // });

  return (
    <CloudApp
      seed1={avgFreq}
      seed2={lowFreq}
      seed3={midFreq}
      seed4={highFreq}
      />
    // <Canvas>
    // <ambientLight />
    // <pointLight position={[10, 10, 10]} />
    // <group ref={meshRef}>
    //   <mesh position={[-2, 0, 0]} scale={[lowFreq, lowFreq, lowFreq]} >
    //     <boxGeometry args={[1, 1, 1]} />
    //     <meshStandardMaterial color="red" />
    //   </mesh>
    //   <mesh position={[0, 0, 0]} scale={[midFreq, midFreq, midFreq]} >
    //     <sphereGeometry args={[1, 32, 32]} />
    //     <meshStandardMaterial color="green" />
    //   </mesh>
    //   <mesh position={[2, 0, 0]} scale={[highFreq, highFreq, highFreq]}>
    //     <coneGeometry args={[1, 2, 32]}  />
    //     <meshStandardMaterial color="blue" />
    //   </mesh>
    // </group>
    // </Canvas>
  );
};

export default SoundVisualization;