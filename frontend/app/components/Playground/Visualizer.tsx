import React, { useEffect, useRef } from "react";

const interpolateColor = (
    startColor: number[],
    endColor: number[],
    factor: number
): number[] => {
    const result = [];
    for (let i = 0; i < startColor.length; i++) {
        result[i] = Math.round(
            startColor[i] + factor * (endColor[i] - startColor[i])
        );
    }
    return result;
};

interface VisualizerProps {
    stream?: MediaStream;
    audioBuffer?: AudioBuffer;
}

const Visualizer: React.FC<VisualizerProps> = ({ stream, audioBuffer }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const barHeightsRef = useRef<number[]>([]);

    useEffect(() => {
        let bufferSource: AudioBufferSourceNode | null = null;
        let mediaStreamSource: MediaStreamAudioSourceNode | null = null;

        if (stream || audioBuffer) {
            const audioContext = new (window.AudioContext ||
                window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 128;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            barHeightsRef.current = new Array(bufferLength).fill(0);

            if (stream) {
                mediaStreamSource =
                    audioContext.createMediaStreamSource(stream);
                mediaStreamSource.connect(analyser);
            }

            if (audioBuffer) {
                bufferSource = audioContext.createBufferSource();
                bufferSource.buffer = audioBuffer;
                bufferSource.connect(analyser);
                bufferSource.start();
            }

            audioContextRef.current = audioContext;
            analyserRef.current = analyser;
            dataArrayRef.current = dataArray;

            draw();
        }

        return () => {
            if (bufferSource) {
                bufferSource.stop();
            }
            if (mediaStreamSource) {
                mediaStreamSource.disconnect();
            }
            if (analyserRef.current) {
                analyserRef.current.disconnect();
            }
            if (
                audioContextRef.current &&
                audioContextRef.current.state !== "closed"
            ) {
                audioContextRef.current.close();
            }
        };
    }, [stream, audioBuffer]);

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas || !analyserRef.current || !dataArrayRef.current) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        const devicePixelRatio = window.devicePixelRatio || 1;
        const width = canvas.clientWidth * devicePixelRatio;
        const height = canvas.clientHeight * devicePixelRatio;
        const centerY = height / 2; // Center of the canvas

        canvas.width = width;
        canvas.height = height;

        const barWidth = Math.floor(
            (width / analyserRef.current.frequencyBinCount) * 2
        );
        const barGap = 6; // Adjust this value to increase the gap between bars
        let x = 0;

        requestAnimationFrame(draw);

        analyserRef.current.getByteFrequencyData(dataArrayRef.current);

        context.clearRect(0, 0, width, height);

        const startColor = [19, 239, 147];
        const endColor = [20, 154, 251];
        const smoothingFactor = 0.05; // Adjust this value for smoother transitions
        const cornerRadius = 3; // Adjust this value to change the chamfer (corner radius)

        for (let i = 0; i < dataArrayRef.current.length; i++) {
            const value = dataArrayRef.current[i];
            const targetHeight = (value / 255) * (height / 2); // Adjust to half height for centering
            barHeightsRef.current[i] +=
                (targetHeight - barHeightsRef.current[i]) * smoothingFactor;

            const barHeight = Math.floor(barHeightsRef.current[i]);
            const interpolationFactor = value / 255;
            const color = interpolateColor(
                startColor,
                endColor,
                interpolationFactor
            );

            context.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.8)`;

            if (barHeight === 0) {
                // Draw a small circle (point) at the center when barHeight is 0
                const pointRadius = 2; // Adjust the radius of the point
                context.beginPath();
                context.arc(
                    x + barWidth / 2,
                    centerY,
                    pointRadius,
                    0,
                    Math.PI * 2
                );
                context.closePath();
                context.fill();
            } else if (barHeight < cornerRadius) {
                // Draw a circle
                context.beginPath();
                context.arc(
                    x + barWidth / 2,
                    centerY,
                    barHeight,
                    0,
                    Math.PI * 2
                );
                context.closePath();
                context.fill();
            } else {
                // Draw the rounded rectangle with top and bottom rounded corners
                context.beginPath();
                context.moveTo(x, centerY - barHeight);
                context.lineTo(x, centerY - barHeight + cornerRadius);
                context.quadraticCurveTo(
                    x,
                    centerY - barHeight,
                    x + cornerRadius,
                    centerY - barHeight
                );
                context.lineTo(
                    x + barWidth - cornerRadius,
                    centerY - barHeight
                );
                context.quadraticCurveTo(
                    x + barWidth,
                    centerY - barHeight,
                    x + barWidth,
                    centerY - barHeight + cornerRadius
                );
                context.lineTo(
                    x + barWidth,
                    centerY + barHeight - cornerRadius
                );
                context.quadraticCurveTo(
                    x + barWidth,
                    centerY + barHeight,
                    x + barWidth - cornerRadius,
                    centerY + barHeight
                );
                context.lineTo(x + cornerRadius, centerY + barHeight);
                context.quadraticCurveTo(
                    x,
                    centerY + barHeight,
                    x,
                    centerY + barHeight - cornerRadius
                );
                context.lineTo(x, centerY - barHeight);
                context.closePath();
                context.fill();
            }

            x += barWidth + barGap; // Increase the gap between bars
        }
    };

    return (
        <div className="flex justify-center items-center">
            <canvas
                ref={canvasRef}
                className="sm:w-[160px] w-[110px] h-[24px]"
            ></canvas>
        </div>
    );
};

export default Visualizer;
