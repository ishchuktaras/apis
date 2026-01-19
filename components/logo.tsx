/* eslint-disable @next/next/no-img-element */
import React from "react";

export const LogoIcon = ({ className = "h-8 w-auto" }: { className?: string }) => {
  return (
    <img
      src="/logo.png"
      alt="Logo APIS"
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
};
