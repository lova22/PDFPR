import Link from "next/link";
import { FileDown } from "lucide-react";

export default function Navbar() {
  return (
    <header className="fixed top-0 w-full z-50 bg-white border-b border-gray-200 shadow-sm transition-all">
      <div className="container mx-auto max-w-7xl px-4 md:px-8 flex items-center justify-between h-20">
        
        <Link href="/" className="flex items-center gap-2 md:gap-3 no-underline group">
          <div className="bg-rose-600 w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
            <FileDown size={20} color="#fff" />
          </div>
          <span className="text-lg md:text-xl font-extrabold text-gray-900 tracking-tight">
            PDF<span className="text-rose-600">Pro</span>
          </span>
        </Link>

        <nav className="flex gap-4 md:gap-8 items-center">
          <Link href="/#tools" className="font-medium text-xs md:text-sm text-gray-600 hover:text-rose-600 transition-colors">
            All Tools
          </Link>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="font-medium text-xs md:text-sm text-gray-600 hover:text-rose-600 transition-colors">
            GitHub
          </a>
        </nav>

      </div>
    </header>
  );
}
