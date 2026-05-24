import type { Metadata } from "next";
import PdfToWordClient from "./PdfToWordClient";

export const metadata: Metadata = {
  title: "PDF to Word — Convert PDF to Editable DOCX",
  description:
    "Convert PDF files to editable Microsoft Word documents. Free online PDF to DOCX converter.",
};

export default function PdfToWordPage() {
  return <PdfToWordClient />;
}

