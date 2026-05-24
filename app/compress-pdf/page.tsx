import { Metadata } from "next";
import CompressPdfClient from "./CompressPdfClient";

export const metadata: Metadata = {
  title: "Compress PDF — Reduce PDF File Size Online",
  description: "Reduce your PDF file size instantly while retaining maximum quality. Secure, fast, and free PDF compression tool.",
};

export default function CompressPdfPage() {
  return <CompressPdfClient />;
}
