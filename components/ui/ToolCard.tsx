import Link from "next/link";
import { LucideIcon, ArrowRight } from "lucide-react";

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
  return (
    <Link id={id} href={href} className="no-underline block h-full">
      <article
        className={`bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col items-center text-center p-6 sm:p-8 h-full relative group ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        {/* Centered Icon Container */}
        <div className="mb-5 flex justify-center w-full">
          <div 
            className="w-14 h-14 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110" 
            style={{ backgroundColor: `${iconBg}20` }}
          >
            <Icon className="w-7 h-7" style={{ color: iconColor }} />
          </div>
        </div>
        
        {/* Text Container */}
        <div className="flex flex-col flex-grow items-center w-full">
          <div className="flex flex-col items-center gap-2 mb-3">
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-rose-600 transition-colors">
              {title}
            </h3>
            {badge && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-rose-100 text-rose-700">
                {badge}
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-500 leading-relaxed max-w-[250px]">
            {subtitle}
          </p>
        </div>

        {/* Hover Action */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-rose-600 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <span>Use Tool</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </article>
    </Link>
  );
}
