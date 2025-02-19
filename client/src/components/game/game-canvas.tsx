import { useEffect, useRef } from "react";

interface GameCanvasProps {
  isPlaying: boolean;
  onGameEnd: (score: number) => void;
}

export default function GameCanvas({ isPlaying, onGameEnd }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>();
  const stateRef = useRef({
    rotation: 0,
    speed: 0,
    decelerating: false,
    score: 0,
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

        // Draw numbers
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(
          angle + stateRef.current.rotation + Math.PI / sections
        );
        ctx.textAlign = "center";
        ctx.fillStyle = "#fff";
        ctx.font = "bold 20px Arial";
        ctx.fillText(
          ((i + 1) * 10).toString(),
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
          // Calculate score
          const normalizedRotation =
            ((stateRef.current.rotation % (2 * Math.PI)) + 2 * Math.PI) %
            (2 * Math.PI);
          const section = Math.floor(
            (normalizedRotation / (2 * Math.PI)) * sections
          );
          stateRef.current.score = (section + 1) * 10;
          onGameEnd(stateRef.current.score);
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
