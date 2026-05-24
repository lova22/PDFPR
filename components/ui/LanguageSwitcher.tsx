"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/src/i18n/routing";
import { useState, useRef, useEffect, useTransition } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LOCALES = [
  { code: "en", name: "English" },
  { code: "ar", name: "العربية" },
  { code: "fr", name: "Français" },
  { code: "hi", name: "हिन्दी" },
  { code: "pt", name: "Português" },
  { code: "id", name: "Bahasa Indonesia" },
  { code: "es", name: "Español" },
  { code: "ru", name: "Русский" },
  { code: "vi", name: "Tiếng Việt" },
  { code: "fil", name: "Filipino" },
  { code: "it", name: "Italiano" },
  { code: "bn", name: "বাংলা" },
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLocale = LOCALES.find((l) => l.code === locale) || LOCALES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeLocale = (newLocale: string) => {
    if (newLocale === locale) {
      setIsOpen(false);
      return;
    }
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 
          ${isOpen ? "bg-gray-100 border-gray-300 shadow-inner" : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm"}
          ${isPending ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <Globe size={18} className="text-gray-500" />
        <span className="text-sm font-semibold text-gray-700 hidden sm:block">
          {currentLocale.name}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute top-full mt-2 w-48 bg-white/80 backdrop-blur-xl border border-gray-200 shadow-xl rounded-2xl overflow-hidden z-50
              ${locale === "ar" ? "left-0" : "right-0"}
            `}
          >
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1">
              {LOCALES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => changeLocale(l.code)}
                  className={`w-full text-start flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
                    ${locale === l.code ? "bg-rose-50 text-rose-600" : "text-gray-700 hover:bg-gray-100"}
                  `}
                >
                  {l.name}
                  {locale === l.code && <Check size={16} />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
