import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface ToolCardProps {
  id: string;
  href: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  badge?: string;
  disabled?: boolean;
}

export default function ToolCard({
  id,
  href,
  icon: Icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  badge,
  disabled = false,
}: ToolCardProps) {
  const CardContent = (
      <article
        className="glass-card animate-slide-up"
        style={{
          padding: "1.75rem",
          cursor: disabled ? "not-allowed" : "pointer",
          height: "100%",
          position: "relative",
          overflow: "hidden",
          opacity: disabled ? 0.7 : 1,
        }}
      >
        {/* Subtle top-edge highlight */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent)",
          }}
        />

        {/* Badge */}
        {badge && (
          <span
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              background: disabled ? "rgba(255,255,255,0.05)" : "rgba(99,102,241,0.2)",
              color: disabled ? "var(--text-muted)" : "#a5b4fc",
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "2px 8px",
              borderRadius: "20px",
              border: disabled ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(99,102,241,0.3)",
            }}
          >
            {badge}
          </span>
        )}

        {/* Icon */}
        <div
          aria-hidden="true"
          className="tool-card-icon"
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: disabled ? "rgba(255,255,255,0.03)" : iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1.25rem",
          }}
        >
          <Icon size={26} color={disabled ? "var(--text-muted)" : iconColor} strokeWidth={1.75} />
        </div>

        {/* Text */}
        <h3
          style={{
            fontSize: "1.05rem",
            fontWeight: 700,
            color: disabled ? "var(--text-muted)" : "var(--text-primary)",
            marginBottom: "0.5rem",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: "0.82rem",
            color: "var(--text-secondary)",
            lineHeight: 1.55,
          }}
        >
          {subtitle}
        </p>

        {/* Arrow indicator */}
        <div
          aria-hidden="true"
          style={{
            marginTop: "1.25rem",
            fontSize: "0.8rem",
            color: disabled ? "var(--text-muted)" : iconColor,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "4px",
            opacity: disabled ? 0.5 : 0.8,
          }}
        >
          {disabled ? "Coming Soon" : <>Use Tool <span style={{ fontSize: "1rem" }}>→</span></>}
        </div>
      </article>
  );

  if (disabled) {
    return <div id={id} style={{ display: "block" }}>{CardContent}</div>;
  }

  return (
    <Link
      id={id}
      href={href}
      aria-label={`${title} — ${subtitle}`}
      style={{
        textDecoration: "none",
        display: "block",
      }}
    >
      {CardContent}
    </Link>
  );
}
