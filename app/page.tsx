import type { Metadata } from "next";
import Link from "next/link";
import {
  FilePlus2,
  Scissors,
  Minimize2,
  FileOutput,
  FileInput,
  RotateCcw,
  Lock,
  Unlock,
  Image,
  ShieldCheck,
  Zap,
  Globe,
  Target,
  Droplet,
  Layers,
  MonitorPlay,
  Sheet,
  TableProperties,
  Presentation,
  Camera,
  PenTool,
  Type,
  Wrench,
  FormInput,
  Hash,
  Edit3,
  FileText
} from "lucide-react";
import ToolCard from "@/components/ui/ToolCard";

export const metadata: Metadata = {
  title: "PDFPro — Every PDF Tool You Need, Free & Secure",
  description:
    "Merge, split, compress, rotate, and convert PDFs for free. All processing happens in your browser — your files never leave your device.",
};

const tools = [
  {
    id: "tool-merge-pdf",
    href: "/merge-pdf",
    icon: FilePlus2,
    iconColor: "#818cf8",
    iconBg: "#818cf8",
    title: "Merge PDF",
    subtitle: "Combine multiple PDFs into one in the exact order you want.",
    badge: "Popular",
  },
  {
    id: "tool-split-pdf",
    href: "/split-pdf",
    icon: Scissors,
    iconColor: "#fb7185",
    iconBg: "#fb7185",
    title: "Split PDF",
    subtitle: "Extract specific pages or split a PDF into multiple files.",
  },
  {
    id: "tool-compress-pdf",
    href: "/compress-pdf",
    icon: Minimize2,
    iconColor: "#34d399",
    iconBg: "#34d399",
    title: "Compress PDF",
    subtitle: "Reduce PDF file size without sacrificing quality.",
  },
  {
    id: "tool-pdf-to-word",
    href: "/pdf-to-word",
    icon: FileOutput,
    iconColor: "#60a5fa",
    iconBg: "#60a5fa",
    title: "PDF to Word",
    subtitle: "Convert PDF documents to editable Word .docx files.",
  },
  {
    id: "tool-word-to-pdf",
    href: "/word-to-pdf",
    icon: FilePlus2,
    iconColor: "#2563eb",
    iconBg: "#2563eb",
    title: "Word to PDF",
    subtitle: "Convert DOC and DOCX files into PDF format seamlessly.",
  },
  {
    id: "tool-powerpoint-to-pdf",
    href: "/powerpoint-to-pdf",
    icon: MonitorPlay,
    iconColor: "#ea580c",
    iconBg: "#ea580c",
    title: "PowerPoint to PDF",
    subtitle: "Convert PPT and PPTX presentations into high-quality PDFs.",
  },
  {
    id: "tool-pdf-to-powerpoint",
    href: "/pdf-to-powerpoint",
    icon: Presentation,
    iconColor: "#ef4444",
    iconBg: "#ef4444",
    title: "PDF to PowerPoint",
    subtitle: "Convert PDF documents to editable PPTX presentations.",
  },
  {
    id: "tool-pdf-to-excel",
    href: "/pdf-to-excel",
    icon: TableProperties,
    iconColor: "#0d9488",
    iconBg: "#0d9488",
    title: "PDF to Excel",
    subtitle: "Extract data tables from your PDF and convert them to Excel.",
  },
  {
    id: "tool-excel-to-pdf",
    href: "/excel-to-pdf",
    icon: Sheet,
    iconColor: "#10b981",
    iconBg: "#10b981",
    title: "Excel to PDF",
    subtitle: "Convert XLS and XLSX spreadsheets to pristine PDF documents.",
  },
  {
    id: "tool-rotate-pdf",
    href: "/rotate-pdf",
    icon: RotateCcw,
    iconColor: "#fbbf24",
    iconBg: "#fbbf24",
    title: "Rotate PDF",
    subtitle: "Rotate pages in your PDF to the correct orientation.",
  },
  {
    id: "tool-protect-pdf",
    href: "/protect-pdf",
    icon: Lock,
    iconColor: "#a78bfa",
    iconBg: "#a78bfa",
    title: "Protect PDF",
    subtitle: "Add password protection to your sensitive PDF documents.",
  },
  {
    id: "tool-unlock-pdf",
    href: "/unlock-pdf",
    icon: Unlock,
    iconColor: "#06b6d4",
    iconBg: "#06b6d4",
    title: "Unlock PDF",
    subtitle: "Remove password protection from PDFs you have access to.",
  },
  {
    id: "tool-pdf-to-image",
    href: "/pdf-to-image",
    icon: Image,
    iconColor: "#f97316",
    iconBg: "#f97316",
    title: "PDF to Image",
    subtitle: "Convert PDF pages to high-resolution PNG or JPG images.",
  },
  {
    id: "tool-image-to-pdf",
    href: "/image-to-pdf",
    icon: Image,
    iconColor: "#eab308",
    iconBg: "#eab308",
    title: "JPG to PDF",
    subtitle: "Convert multiple images into a single PDF document.",
  },
  {
    id: "tool-watermark-pdf",
    href: "/watermark-pdf",
    icon: Droplet,
    iconColor: "#0ea5e9",
    iconBg: "#0ea5e9",
    title: "Add Watermark",
    subtitle: "Stamp a text watermark across all pages of your PDF.",
  },
  {
    id: "tool-scan-to-pdf",
    href: "/scan-to-pdf",
    icon: Camera,
    iconColor: "#6366f1",
    iconBg: "#6366f1",
    title: "Scan to PDF",
    subtitle: "Capture documents directly from your camera.",
  },
  {
    id: "tool-sign-pdf",
    href: "/sign-pdf",
    icon: PenTool,
    iconColor: "#3b82f6",
    iconBg: "#3b82f6",
    title: "Sign PDF",
    subtitle: "Draw your signature and sign your PDF instantly.",
  },
  {
    id: "tool-extract-text",
    href: "/extract-text",
    icon: Type,
    iconColor: "#eab308",
    iconBg: "#eab308",
    title: "Extract Text",
    subtitle: "Extract all text content from your PDF documents.",
  },
  {
    id: "tool-repair-pdf",
    href: "/repair-pdf",
    icon: Wrench,
    iconColor: "#9333ea",
    iconBg: "#9333ea",
    title: "Repair PDF",
    subtitle: "Fix corrupted or damaged PDF files effortlessly.",
  },
  {
    id: "tool-fill-pdf",
    href: "/fill-pdf",
    icon: FormInput,
    iconColor: "#f97316",
    iconBg: "#f97316",
    title: "Fill PDF Forms",
    subtitle: "Fill out PDF forms and complete documents easily.",
  },
  {
    id: "tool-add-page-numbers",
    href: "/add-page-numbers",
    icon: Hash,
    iconColor: "#10b981",
    iconBg: "#10b981",
    title: "Add Page Numbers",
    subtitle: "Number the pages of your PDF with customizable formats.",
  },
  {
    id: "tool-edit-pdf",
    href: "/edit-pdf",
    icon: Edit3,
    iconColor: "#ec4899",
    iconBg: "#ec4899",
    title: "Online PDF Editor",
    subtitle: "The easiest way to edit PDF text and elements securely online.",
  },
  {
    id: "tool-rich-pdf-editor",
    href: "/rich-pdf-editor",
    icon: FileText,
    iconColor: "#4f46e5",
    iconBg: "#4f46e5",
    title: "Rich PDF Editor",
    subtitle: "Convert PDF to a flowable format to edit fonts and styles like Google Docs.",
  },
  {
    id: "tool-organize-pdf",
    href: "/organize-pdf",
    icon: Layers,
    iconColor: "#10b981",
    iconBg: "#10b981",
    title: "Organize PDF",
    subtitle: "Reorder, delete, and organize pages in your PDF effortlessly.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ================================================================
          HERO SECTION
      ================================================================ */}
      <section className="pt-32 pb-20 text-center relative bg-white border-b border-gray-200">
        <div className="container mx-auto max-w-7xl px-4 md:px-8 relative z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight max-w-4xl mx-auto mb-6">
            Every tool you need to work with{" "}
            <span className="text-rose-600">PDFs</span>
            <br />
            in one place.
          </h1>

          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Compress, merge, convert, edit, and secure your PDF files in seconds. 
            All tools are 100% free and easy to use.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link 
              href="#tools" 
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors w-full sm:w-auto text-center"
            >
              Explore All PDF Tools
            </Link>
            <Link 
              href="/compress-pdf" 
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-semibold py-3 px-8 rounded-xl transition-all shadow-sm w-full sm:w-auto text-center"
            >
              Try PDF Compression
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto border-t border-gray-100 pt-10">
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold text-gray-900 mb-1">100%</span>
              <span className="text-sm text-gray-500 font-medium uppercase tracking-wide">Free to Use</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold text-gray-900 mb-1">256-bit</span>
              <span className="text-sm text-gray-500 font-medium uppercase tracking-wide">Secure</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold text-gray-900 mb-1">Zero</span>
              <span className="text-sm text-gray-500 font-medium uppercase tracking-wide">Watermarks</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold text-gray-900 mb-1">Auto</span>
              <span className="text-sm text-gray-500 font-medium uppercase tracking-wide">Deletion</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          TOOLS GRID SECTION
      ================================================================ */}
      <section id="tools" className="py-20 bg-gray-50">
        <div className="container mx-auto max-w-7xl px-4 md:px-8">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
              All PDF Tools
            </h2>
            <p className="text-lg text-gray-600">
              Click any tool below to get started instantly — no account required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {tools.map((tool) => (
              <div key={tool.id} className="h-full">
                <ToolCard {...tool} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          TRUST / FEATURE SECTION
      ================================================================ */}
      <section className="py-20 bg-white border-t border-gray-200">
        <div className="container mx-auto max-w-7xl px-4 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Why Choose PDFPro?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Secure & Private</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                All PDF processing runs in your browser via WebAssembly. Your files are never transmitted over the internet.
              </p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center mb-6">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Lightning Fast</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                No waiting for server queues. PDF operations start immediately using the full power of your device.
              </p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6">
                <Globe className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">100% Free</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                No subscriptions, no watermarks, no file size limits hidden behind a paywall. Free forever.
              </p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-6">
                <Target className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Professional Quality</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Built on battle-tested libraries producing high-fidelity output that preserves fonts, images, and metadata.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          FOOTER
      ================================================================ */}
      <footer className="py-8 bg-gray-50 border-t border-gray-200 text-center">
        <div className="container mx-auto max-w-7xl px-4 md:px-8">
          <p className="text-gray-500 text-sm font-medium">
            © {new Date().getFullYear()} PDFPro. Built with privacy in mind.
            Your files never leave your browser.
          </p>
        </div>
      </footer>
    </>
  );
}
