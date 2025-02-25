"use client";

import React, { useState, useEffect, useRef } from 'react';

const FluidBubbleAnimation = () => {
  const [isActive, setIsActive] = useState(true);
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [secondaryColor, setSecondaryColor] = useState("#c4b5fd");
  const [backgroundColor, setBackgroundColor] = useState("#f8fafc");
  const [amplitude, setAmplitude] = useState(50);
  
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const timeRef = useRef(0);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Set up for high-resolution displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const animate = () => {
      if (isActive) {
        timeRef.current += 0.015;
      } else {
        timeRef.current += 0.005; // Slower when paused
      }
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw the fluid bubble
      drawFluidBubble(
        ctx, 
        rect.width / 2, 
        rect.height / 2, 
        Math.min(rect.width, rect.height) * 0.45, 
        timeRef.current,
        amplitude / 100
      );
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, primaryColor, secondaryColor, amplitude]);
  
  // Function to draw a fluid bubble that looks natural and friendly
  const drawFluidBubble = (ctx, centerX, centerY, radius, time, amplitudeFactor) => {
    // Create a smooth bubble shape with noise
    const points = 80;
    const angleStep = (Math.PI * 2) / points;
    
    // Create primary gradient
    const gradient = ctx.createRadialGradient(
      centerX - radius * 0.2, 
      centerY - radius * 0.2, 
      radius * 0.1,
      centerX, 
      centerY, 
      radius * 1.2
    );
    
    // Add color stops
    const primaryRGB = hexToRgb(primaryColor);
    const secondaryRGB = hexToRgb(secondaryColor);
    
    gradient.addColorStop(0, `rgba(${secondaryRGB.r}, ${secondaryRGB.g}, ${secondaryRGB.b}, 0.9)`);
    gradient.addColorStop(0.6, `rgba(${primaryRGB.r}, ${primaryRGB.g}, ${primaryRGB.b}, 0.8)`);
    gradient.addColorStop(1, `rgba(${primaryRGB.r}, ${primaryRGB.g}, ${primaryRGB.b}, 0.2)`);
    
    // Draw the main bubble shape
    ctx.beginPath();
    
    // Create a natural flowing shape
    for (let i = 0; i <= points; i++) {
      const angle = i * angleStep;
      
      // Create multiple noise frequencies for natural movement
      const noise1 = Math.sin(angle * 3 + time) * amplitudeFactor * 0.3;
      const noise2 = Math.sin(angle * 5 + time * 1.5) * amplitudeFactor * 0.15;
      const noise3 = Math.sin(angle * 9 + time * 0.7) * amplitudeFactor * 0.07;
      
      // Combine noise values for natural movement
      const radiusNoise = radius * (1 + noise1 + noise2 + noise3);
      
      const x = centerX + Math.cos(angle) * radiusNoise;
      const y = centerY + Math.sin(angle) * radiusNoise;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        // Use quadratic curves for smoother shape
        const prevAngle = (i - 1) * angleStep;
        const prevNoise1 = Math.sin(prevAngle * 3 + time) * amplitudeFactor * 0.3;
        const prevNoise2 = Math.sin(prevAngle * 5 + time * 1.5) * amplitudeFactor * 0.15;
        const prevNoise3 = Math.sin(prevAngle * 9 + time * 0.7) * amplitudeFactor * 0.07;
        const prevRadiusNoise = radius * (1 + prevNoise1 + prevNoise2 + prevNoise3);
        
        const prevX = centerX + Math.cos(prevAngle) * prevRadiusNoise;
        const prevY = centerY + Math.sin(prevAngle) * prevRadiusNoise;
        
        const cpX = (prevX + x) / 2 - (prevY - y) * 0.1;
        const cpY = (prevY + y) / 2 + (prevX - x) * 0.1;
        
        ctx.quadraticCurveTo(cpX, cpY, x, y);
      }
    }
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Add inner bubble effects for depth
    const innerBubbles = 5;
    const bubbleSizes = [0.4, 0.25, 0.15, 0.1, 0.05];
    
    for (let i = 0; i < innerBubbles; i++) {
      // Create dynamic positions for inner bubbles
      const angle = time * (0.2 + i * 0.1);
      const distance = radius * 0.4 * Math.sin(time * 0.3 + i);
      
      const bubbleX = centerX + Math.cos(angle) * distance;
      const bubbleY = centerY + Math.sin(angle) * distance;
      const bubbleRadius = radius * bubbleSizes[i];
      
      // Create inner bubble gradient
      const bubbleGradient = ctx.createRadialGradient(
        bubbleX - bubbleRadius * 0.3,
        bubbleY - bubbleRadius * 0.3,
        0,
        bubbleX,
        bubbleY,
        bubbleRadius
      );
      
      // Set colors with transparency
      bubbleGradient.addColorStop(0, `rgba(255, 255, 255, ${0.4 - i * 0.07})`);
      bubbleGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
      
      // Draw inner bubble
      ctx.beginPath();
      ctx.arc(bubbleX, bubbleY, bubbleRadius, 0, Math.PI * 2);
      ctx.fillStyle = bubbleGradient;
      ctx.fill();
    }
    
    // Add subtle highlight
    const highlightGradient = ctx.createRadialGradient(
      centerX - radius * 0.5,
      centerY - radius * 0.5,
      0,
      centerX - radius * 0.3,
      centerY - radius * 0.3,
      radius
    );
    
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.9, 0, Math.PI * 2);
    ctx.fillStyle = highlightGradient;
    ctx.fill();
  };
  
  // Helper function to convert hex to RGB
  const hexToRgb = (hex) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : {r: 0, g: 0, b: 0};
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto p-6 space-y-6">
      <div 
        className="relative w-64 h-64 flex items-center justify-center rounded-lg shadow-lg overflow-hidden"
        style={{ backgroundColor }}
        onClick={() => setIsActive(!isActive)}
      >
        <canvas 
          ref={canvasRef} 
          width="300" 
          height="300"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      
      <div className="w-full space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Primary Color</label>
          <div className="flex space-x-2">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-10 h-10"
            />
            <input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">Secondary Color</label>
          <div className="flex space-x-2">
            <input
              type="color"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="w-10 h-10"
            />
            <input
              type="text"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">Background Color</label>
          <div className="flex space-x-2">
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="w-10 h-10"
            />
            <input
              type="text"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">Wave Movement: {amplitude}%</label>
          <input
            type="range"
            min="10"
            max="100"
            value={amplitude}
            onChange={(e) => setAmplitude(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
        
        <button
          onClick={() => setIsActive(!isActive)}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          {isActive ? "Pause Animation" : "Resume Animation"}
        </button>
      </div>
    </div>
  );
};

export default FluidBubbleAnimation;