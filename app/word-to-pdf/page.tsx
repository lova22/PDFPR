import { Metadata } from "next";
import WordToPdfClient from "./WordToPdfClient";

export const metadata: Metadata = {
  title: "Word to PDF — Convert DOC and DOCX to PDF Online",
  description: "Convert your Word documents into universally compatible PDFs. Fast, secure, and free online conversion tool.",
};

export default function WordToPdfPage() {
  return <WordToPdfClient />;
}
