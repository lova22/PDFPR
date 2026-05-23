"use client";

interface ProgressBarProps {
  /** 0–100 */
  value: number;
  label?: string;
  showPercent?: boolean;
}

export default function ProgressBar({
  value,
  label,
  showPercent = true,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "Processing progress"}
      style={{ width: "100%" }}
    >
      {(label || showPercent) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.5rem",
          }}
        >
          {label && (
            <span
              style={{
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                fontWeight: 500,
              }}
            >
              {label}
            </span>
          )}
          {showPercent && (
            <span
              style={{
                fontSize: "0.85rem",
                color: "var(--brand-primary)",
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {clamped}%
            </span>
          )}
        </div>
      )}

      {/* Track */}
      <div
        style={{
          width: "100%",
          height: "8px",
          borderRadius: "999px",
          background: "rgba(99,102,241,0.12)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Fill */}
        <div
          style={{
            height: "100%",
            width: `${clamped}%`,
            borderRadius: "999px",
            background: "linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)",
            backgroundSize: "200% 100%",
            transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            animation: clamped > 0 && clamped < 100 ? "gradient-shift 2s linear infinite" : "none",
            boxShadow: "0 0 12px rgba(99,102,241,0.5)",
          }}
        />

        {/* Shimmer overlay when processing */}
        {clamped > 0 && clamped < 100 && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
              animation: "shimmer 1.5s infinite",
              backgroundSize: "200% 100%",
            }}
          />
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
