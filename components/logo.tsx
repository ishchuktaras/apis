// components/logo.tsx
import React from "react";

export const LogoIcon = ({ className = "h-8 w-auto" }: { className?: string }) => {
  return (
    // SVG kód geometrické včely
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 500"
      className={className}
      fill="none"
      aria-hidden="true" // Ikona je dekorativní, název přečte čtečka z textu vedle
    >
      {/* Tělo (Hexagon) - Medová žlutá #F4C430 */}
      <path
        d="M250 445L105.7 361.7V195L250 111.7L394.3 195V361.7L250 445Z"
        fill="#F4C430"
      />
      {/* Pruhy - Černá #1A1A1A */}
      <path d="M140 370L190 280H160L110 370H140Z" fill="#1A1A1A" />
      <path d="M190 385L240 295H210L160 385H190Z" fill="#1A1A1A" />
      {/* Hlava a tykadla - Černá #1A1A1A */}
      <circle cx="360" cy="180" r="55" fill="#1A1A1A" />
      <path
        d="M390 140L430 100"
        stroke="#1A1A1A"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <circle cx="430" cy="100" r="15" fill="#1A1A1A" />
      <path
        d="M330 140L290 100"
        stroke="#1A1A1A"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <circle cx="290" cy="100" r="15" fill="#1A1A1A" />
      {/* Křídla - Nebeská modrá #87CEEB s průhledností */}
      <path
        d="M150 210L50 90H280L380 210H150Z"
        fill="#87CEEB"
        fillOpacity="0.7"
      />
      <path
        d="M180 240L80 120H310L410 240H180Z"
        fill="#87CEEB"
        fillOpacity="0.6"
      />
    </svg>
  );
};

// Hlavní komponenta Loga i s názvem (volitelné použití)
export const Logo = ({ className = "h-10" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoIcon className="h-full w-auto" />
      <span className="font-bold text-xl tracking-tight text-slate-900">
        APIS
      </span>
    </div>
  );
};