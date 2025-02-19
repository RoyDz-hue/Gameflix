import { useEffect, useRef } from "react";

interface GameCanvasProps {
  isPlaying: boolean;
  onGameEnd: (score: number, multiplier: number) => void;
}

export default function GameCanvas({ isPlaying, onGameEnd }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>();
  const stateRef = useRef({
    rotation: 0,
    speed: 0,
    decelerating: false,
    score: 0,
    multiplier: 1, // Added multiplier property
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = 400;
    canvas.height = 400;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 150;

    const sections = 12;
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEEAD",
      "#D4A5A5",
      "#9B9B9B",
      "#E9C46A",
      "#3D405B",
      "#81B29A",
      "#F4A261",
      "#E76F51",
    ];

    // Define multipliers for each section
    const multipliers = [
      0.5, // Red
      1.2, // Cyan
      1.5, // Blue
      1.8, // Green
      2.0, // Yellow
      2.2, // Pink
      2.5, // Gray
      2.8, // Gold
      3.0, // Navy
      3.5, // Teal
      4.0, // Orange
      5.0, // Red-Orange
    ];

    function drawWheel() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw sections
      for (let i = 0; i < sections; i++) {
        const angle = (i * 2 * Math.PI) / sections;
        const nextAngle = ((i + 1) * 2 * Math.PI) / sections;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(
          centerX,
          centerY,
          radius,
          angle + stateRef.current.rotation,
          nextAngle + stateRef.current.rotation
        );
        ctx.closePath();

        ctx.fillStyle = colors[i];
        ctx.fill();
        ctx.stroke();

        // Draw numbers and multipliers
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle + stateRef.current.rotation + Math.PI / sections);
        ctx.textAlign = "center";
        ctx.fillStyle = "#fff";
        ctx.font = "bold 20px Arial";
        ctx.fillText(
          `${multipliers[i]}x`, // Updated to display multiplier
          radius * 0.75,
          0
        );
        ctx.restore();
      }

      // Draw center circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
      ctx.fillStyle = "#333";
      ctx.fill();

      // Draw pointer
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - radius - 10);
      ctx.lineTo(centerX - 10, centerY - radius + 10);
      ctx.lineTo(centerX + 10, centerY - radius + 10);
      ctx.closePath();
      ctx.fillStyle = "#333";
      ctx.fill();
    }

    function updateGame() {
      if (!isPlaying) return;

      if (!stateRef.current.decelerating) {
        stateRef.current.speed = Math.min(stateRef.current.speed + 0.01, 0.3);
      } else {
        stateRef.current.speed *= 0.99;
        if (stateRef.current.speed < 0.001) {
          // Calculate score using multiplier
          const normalizedRotation =
            ((stateRef.current.rotation % (2 * Math.PI)) + 2 * Math.PI) %
            (2 * Math.PI);
          const section = Math.floor(
            (normalizedRotation / (2 * Math.PI)) * sections
          );
          const multiplier = multipliers[section];
          const baseScore = Math.floor(Math.random() * 100); // Random base score
          stateRef.current.score = Math.round(baseScore * multiplier);
          stateRef.current.multiplier = multiplier;
          onGameEnd(stateRef.current.score, stateRef.current.multiplier); // Pass multiplier to onGameEnd
          return;
        }
      }

      stateRef.current.rotation += stateRef.current.speed;
      drawWheel();
      frameRef.current = requestAnimationFrame(updateGame);
    }

    function startSpinning() {
      if (!isPlaying) return;

      stateRef.current = {
        rotation: 0,
        speed: 0,
        decelerating: false,
        score: 0,
        multiplier: 1, // Added multiplier property
      };

      // Start spinning
      updateGame();

      // After random time between 2-4 seconds, start decelerating
      setTimeout(() => {
        stateRef.current.decelerating = true;
      }, 2000 + Math.random() * 2000);
    }

    if (isPlaying) {
      startSpinning();
    }

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isPlaying, onGameEnd]);

  return (
    <div className="flex justify-center">
      <canvas
        ref={canvasRef}
        className="border rounded-lg shadow-lg"
        style={{ maxWidth: "100%", height: "auto" }}
      />
    </div>
  );
}