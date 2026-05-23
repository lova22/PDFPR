import React from "react";

interface AdPlaceholderProps {
  layout?: "vertical" | "horizontal";
}

export default function AdPlaceholder({ layout = "vertical" }: AdPlaceholderProps) {
  return (
    <div
      style={{
        width: "100%",
        height: layout === "vertical" ? "100%" : "250px",
        minHeight: layout === "vertical" ? "600px" : "150px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px dashed rgba(255, 255, 255, 0.15)",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-muted)",
        fontSize: "0.9rem",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        userSelect: "none",
      }}
    >
      Ad Space
    </div>
  );
}
