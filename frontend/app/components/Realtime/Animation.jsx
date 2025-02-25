"use client";

import React, { useState, useEffect, useRef } from 'react';

const FluidAISpeakingAnimation = () => {
  const [isActive, setIsActive] = useState(true);
  const [primaryColor, setPrimaryColor] = useState("#ffffff");
  const [secondaryColor, setSecondaryColor] = useState("#c4b5fd");
  const [backgroundColor, setBackgroundColor] = useState("#f8fafc");

  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const time = useRef(0);
  
  // Animation constants
  const circleRadius = 120;
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    
    // For high resolution displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const renderFrame = () => {
      if (!isActive) {
        time.current += 0.003; // Slow motion when paused
      } else {
        time.current += 0.05; // Normal speed
      }
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw the fluid circle
      drawFluidCircle(ctx, centerX, centerY, circleRadius, time.current, primaryColor, secondaryColor);
      
      animationFrameId = requestAnimationFrame(renderFrame);
    };
    
    renderFrame();
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, primaryColor, secondaryColor]);
  
  // Function to create a fluid-like animation inside a circle
  const drawFluidCircle = (ctx, x, y, radius, time, primaryColor, secondaryColor) => {
    // Create gradient for the circle fill
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, secondaryColor);
    gradient.addColorStop(1, primaryColor);
    
    // Save context
    ctx.save();
    
    // Draw base circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Create the fluid motion with perlin-like noise effect
    const numLayers = 5;
    
    for (let layer = 0; layer < numLayers; layer++) {
      // Create clipping path for this layer
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.clip();
      
      // Draw fluid-like shapes using Bezier curves
      const layerTime = time + layer * 0.7;
      const numBlobs = 6 + layer * 2;
      const layerOpacity = 0.15 - layer * 0.02;
      
      ctx.beginPath();
      
      // Create fluid-like motion with multiple blobs
      for (let i = 0; i < numBlobs; i++) {
        const angle = (i / numBlobs) * Math.PI * 2;
        const blobRadius = radius * (0.3 + 0.2 * layer / numLayers);
        
        // Calculate positions with noise-like motion
        const offsetX = Math.sin(layerTime * 0.7 + i * 0.5) * radius * 0.3;
        const offsetY = Math.cos(layerTime * 0.5 + i * 0.7) * radius * 0.3;
        
        const blobX = x + Math.cos(angle) * blobRadius + offsetX;
        const blobY = y + Math.sin(angle) * blobRadius + offsetY;
        
        // Draw blobs
        if (i === 0) {
          ctx.moveTo(blobX, blobY);
        } else {
          // Control points for bezier
          const prevAngle = ((i - 1) / numBlobs) * Math.PI * 2;
          const cpRadius = blobRadius * 1.2;
          
          const cp1X = x + Math.cos(prevAngle + 0.3) * cpRadius + offsetX * 0.7;
          const cp1Y = y + Math.sin(prevAngle + 0.3) * cpRadius + offsetY * 0.7;
          
          const cp2X = x + Math.cos(angle - 0.3) * cpRadius + offsetX * 0.7;
          const cp2Y = y + Math.sin(angle - 0.3) * cpRadius + offsetY * 0.7;
          
          ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, blobX, blobY);
        }
      }
      
      // Close the path
      ctx.closePath();
      
      // Set fill style
      const innerColor = secondaryColor + Math.floor(layerOpacity * 255).toString(16).padStart(2, '0');
      const outerColor = primaryColor + '00';
      
      const blobGradient = ctx.createRadialGradient(
        x + Math.sin(layerTime * 0.5) * radius * 0.3,
        y + Math.cos(layerTime * 0.7) * radius * 0.3,
        radius * 0.1,
        x,
        y,
        radius
      );
      
      blobGradient.addColorStop(0, innerColor);
      blobGradient.addColorStop(1, outerColor);
      
      ctx.fillStyle = blobGradient;
      ctx.fill();
      
      ctx.restore();
    }
    
    // Draw outer circle stroke
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = primaryColor + '80'; // Semi-transparent
    ctx.stroke();
    
    ctx.restore();
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto p-6 space-y-6">
      <div 
        className="relative w-64 h-64 flex items-center justify-center rounded-full shadow-lg"
        style={{ backgroundColor }}
        onClick={() => setIsActive(!isActive)}
      >
        <canvas 
          ref={canvasRef} 
          width="300" 
          height="300"
          style={{ width: '100%', height: '100%' }}
          className="rounded-full"
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

export default FluidAISpeakingAnimation;