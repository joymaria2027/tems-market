import { ReactNode, useEffect, useState } from "react";
import Confetti from "./Confetti";

interface CeremonyOverlayProps {
  /** Whether to show the overlay */
  active: boolean;
  /** Icon to display (ReactNode — use a Lucide icon) */
  icon: ReactNode;
  /** Main title text */
  title: string;
  /** Subtitle text */
  subtitle?: string;
  /** Optional body content below subtitle */
  children?: ReactNode;
  /** Whether to show confetti */
  confetti?: boolean;
  /** Icon background color class */
  iconBg?: string;
  /** Auto-dismiss after this many ms (0 = manual) */
  autoDismissMs?: number;
  /** Called when overlay is dismissed */
  onDismiss?: () => void;
}

const CeremonyOverlay = ({
  active,
  icon,
  title,
  subtitle,
  children,
  confetti = true,
  iconBg = "bg-primary/10",
  autoDismissMs = 0,
  onDismiss,
}: CeremonyOverlayProps) => {
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (active) {
      setVisible(true);
      // Trigger enter animation on next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
    } else {
      setEntered(false);
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [active]);

  useEffect(() => {
    if (active && autoDismissMs > 0) {
      const t = setTimeout(() => onDismiss?.(), autoDismissMs);
      return () => clearTimeout(t);
    }
  }, [active, autoDismissMs, onDismiss]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9998] flex items-center justify-center transition-all duration-300 ${
        entered ? "bg-black/50 backdrop-blur-sm" : "bg-black/0"
      }`}
      onClick={() => onDismiss?.()}
    >
      {confetti && <Confetti active={active} />}

      <div
        className={`relative z-[9999] max-w-md w-full mx-4 bg-card border border-border rounded-2xl p-8 text-center shadow-2xl transition-all duration-500 ${
          entered
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-8 scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon with bounce animation */}
        <div
          className={`mx-auto w-20 h-20 rounded-2xl ${iconBg} flex items-center justify-center mb-5 transition-all duration-700 ${
            entered ? "scale-100" : "scale-50"
          }`}
          style={{
            animation: entered ? "ceremonyBounce 0.6s ease-out 0.3s both" : "none",
          }}
        >
          {icon}
        </div>

        <h2 className="font-display text-2xl font-bold text-foreground mb-2">
          {title}
        </h2>

        {subtitle && (
          <p className="text-muted-foreground text-sm mb-5">{subtitle}</p>
        )}

        {children}
      </div>

      {/* Bounce keyframes — injected once */}
      <style>{`
        @keyframes ceremonyBounce {
          0% { transform: scale(0.5); }
          50% { transform: scale(1.15); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default CeremonyOverlay;
