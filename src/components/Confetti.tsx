import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: "square" | "circle" | "strip";
}

const COLORS = [
  "#f43f5e", "#8b5cf6", "#3b82f6", "#10b981",
  "#f59e0b", "#ec4899", "#14b8a6", "#f97316",
];

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

interface ConfettiProps {
  /** Number of particles */
  count?: number;
  /** Duration in ms before cleanup */
  duration?: number;
  /** Whether to fire the confetti */
  active?: boolean;
}

const Confetti = ({ count = 80, duration = 3000, active = true }: ConfettiProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);

    const particles: Particle[] = [];
    const centerX = window.innerWidth / 2;

    for (let i = 0; i < count; i++) {
      const shapes: Particle["shape"][] = ["square", "circle", "strip"];
      particles.push({
        x: centerX + randomBetween(-200, 200),
        y: randomBetween(-20, window.innerHeight * 0.3),
        vx: randomBetween(-8, 8),
        vy: randomBetween(-14, -4),
        size: randomBetween(4, 10),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: randomBetween(0, Math.PI * 2),
        rotationSpeed: randomBetween(-0.15, 0.15),
        opacity: 1,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      });
    }

    const startTime = performance.now();
    const gravity = 0.25;
    const drag = 0.98;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (const p of particles) {
        p.vy += gravity;
        p.vx *= drag;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.opacity = Math.max(0, 1 - progress * 1.2);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.shape === "square") {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -1, p.size, 3);
        }
        ctx.restore();
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [active, count, duration]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9999] pointer-events-none"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
};

export default Confetti;
