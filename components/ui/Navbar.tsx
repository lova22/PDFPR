import Link from "next/link";
import { FileDown } from "lucide-react";

export default function Navbar() {
  return (
    <header style={{ borderBottom: "1px solid var(--surface-border)", background: "rgba(10, 10, 15, 0.8)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
      <div className="section-container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}>
        
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileDown size={18} color="#fff" />
          </div>
          <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
            PDF<span style={{ color: "var(--brand-primary)" }}>Pro</span>
          </span>
        </Link>

        <nav style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <Link href="/#tools" className="nav-link" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
            All Tools
          </Link>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="nav-link" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
            GitHub
          </a>
        </nav>

      </div>
      <style>{`
        .nav-link { transition: color 0.2s; }
        .nav-link:hover { color: var(--text-primary) !important; }
      `}</style>
    </header>
  );
}
