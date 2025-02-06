import { useEffect, useRef, useState } from "react";
import * as THREE from 'three';

export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState([]);
  const [dataChannel, setDataChannel] = useState(null);
  const peerConnection = useRef(null);
  const audioElement = useRef(null);
  const mountRef = useRef(null);
  const materialRef = useRef(null);
  const isSessionActiveRef = useRef(isSessionActive);

  // Update ref when state changes
  useEffect(() => {
    isSessionActiveRef.current = isSessionActive;
  }, [isSessionActive]);

  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uProgress;
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vec3 bgColor1 = mix(vec3(0.1, 0.2, 0.4), vec3(0.4, 0.1, 0.2), sin(uTime * 0.5) * 0.5 + 0.5);
      vec3 bgColor2 = mix(vec3(0.3, 0.1, 0.4), vec3(0.1, 0.3, 0.4), cos(uTime * 0.3) * 0.5 + 0.5);
      vec3 bg = mix(bgColor1, bgColor2, vUv.y);
      
      float pulse = sin(uTime * 2.0) * 0.05 + 0.9;
      vec3 coreColor = vec3(0.6, 0.7, 0.8);
      float dist = length(vUv - 0.5);
      float core = smoothstep(0.5, 0.2, dist * pulse);
      
      vec2 mouseDist = vUv - uMouse;
      float mouseInfluence = smoothstep(0.5, 0.0, length(mouseDist)) * 0.3;
      float lightTrails = sin(vUv.x * 50.0 + uTime * 5.0) * 0.05;
      
      vec3 finalColor = bg + core * coreColor + mouseInfluence + lightTrails;
      finalColor += vec3(uProgress) * 0.3 * (1.0 - smoothstep(0.0, 0.2, abs(dist - 0.25)));
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  const handleInteraction = async () => {
    if (!isSessionActive) {
      await startSession();
    } else {
      stopSession();
    }
  };

  async function startSession() {
    // Get an ephemeral key from the Fastify server
    const tokenResponse = await fetch("/token");
    const data = await tokenResponse.json();
    const EPHEMERAL_KEY = data.client_secret.value;

    // Create a peer connection
    const pc = new RTCPeerConnection();

    // Set up to play remote audio from the model
    audioElement.current = document.createElement("audio");
    audioElement.current.autoplay = true;
    pc.ontrack = (e) => (audioElement.current.srcObject = e.streams[0]);

    // Add local audio track for microphone input in the browser
    const ms = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    pc.addTrack(ms.getTracks()[0]);

    // Set up data channel for sending and receiving events
    const dc = pc.createDataChannel("oai-events");
    setDataChannel(dc);

    // Start the session using the Session Description Protocol (SDP)
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const baseUrl = "https://api.openai.com/v1/realtime";
    const model = "gpt-4o-mini-realtime-preview";
    const voice = "alloy";
    const modalities = ["audio"];
    const instructions = "You are a friendly teaching assistant. You have to start every conversation by introducing that you are Mnemosyne the greek godess of knowledge.";
    
    const sdpResponse = await fetch(`${baseUrl}?model=${model}&modalities=${modalities.join(",")}&voice=${voice}&instructions=${encodeURIComponent(instructions)}`, {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${EPHEMERAL_KEY}`,
        "Content-Type": "application/sdp",
      },
    });

    const answer = {
      type: "answer",
      sdp: await sdpResponse.text(),
    };
    await pc.setRemoteDescription(answer);

    peerConnection.current = pc;
    setIsSessionActive(true);
  }

  // Stop current session, clean up peer connection and data channel
  function stopSession() {
    if (dataChannel) {
      dataChannel.close();
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }

    setIsSessionActive(false);
    setDataChannel(null);
    peerConnection.current = null;
  }

  // Send a message to the model
  function sendClientEvent(message) {
    if (dataChannel) {
      message.event_id = message.event_id || crypto.randomUUID();
      dataChannel.send(JSON.stringify(message));
      setEvents((prev) => [message, ...prev]);
    } else {
      console.error(
        "Failed to send message - no data channel available",
        message,
      );
    }
  }

  // Send a text message to the model
  function sendTextMessage(message) {
    const event = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: message,
          },
        ],
      },
    };

    sendClientEvent(event);
    sendClientEvent({ type: "response.create" });
  }

  // Attach event listeners to the data channel when a new one is created
  useEffect(() => {
    if (dataChannel) {
      // Append new server events to the list
      dataChannel.addEventListener("message", (e) => {
        setEvents((prev) => [JSON.parse(e.data), ...prev]);
      });

      // Set session active when the data channel is opened
      dataChannel.addEventListener("open", () => {
        setIsSessionActive(true);
        setEvents([]);
      });
    }
  }, [dataChannel]);

  // Initialize Three.js scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) {
      console.error("Container not found");
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      canvas: document.createElement("canvas")
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uProgress: { value: 0 }
      }
    });
    materialRef.current = material;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const clock = new THREE.Clock();
    let animationFrame;

    const animate = () => {
      animationFrame = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      material.uniforms.uTime.value = elapsedTime;
      material.uniforms.uProgress.value = isSessionActiveRef.current ? 1 : 0;
      renderer.render(scene, camera);
    };
    animate();

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / container.clientWidth;
      const y = (e.clientY - rect.top) / container.clientHeight;
      material.uniforms.uMouse.value.set(x, 1 - y);
    };
    container.addEventListener("mousemove", handleMouseMove);

    return () => {
      cancelAnimationFrame(animationFrame);
      container.removeChild(renderer.domElement);
      container.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-transparent select-none">
      <div
        ref={mountRef}
        className="w-full h-full cursor-pointer"
        onClick={handleInteraction}
      />
      <div className="absolute bottom-4 right-4 w-32 bg-black/50 backdrop-blur-sm p-2 rounded-lg shadow-xl flex flex-col items-center">
        <div className="flex items-center justify-center text-purple-400 text-sm">
          <div className={`${isSessionActive ? 'text-green-400 animate-pulse' : 'text-gray-400 opacity-50'}`}>
            ●
          </div>
          <span className="text-white ml-2">
            {isSessionActive ? 'Listening' : 'Click to Start'}
          </span>
        </div>
      </div>
    </div>
  );
}
