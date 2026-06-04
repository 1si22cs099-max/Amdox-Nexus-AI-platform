import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
}

export default function Logo({ className = '', size = 44 }: LogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Sky-Blue to Blue Gradient for high-tech aesthetic */}
        <linearGradient id="logoGlowGrad" x1="20" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        
        {/* Accent gradient for the letters */}
        <linearGradient id="anLettersGrad" x1="60" y1="60" x2="140" y2="140" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>

        <filter id="glowEffect" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#38bdf8" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Outer Hexagon frame */}
      <polygon 
        points="100,12 176,56 176,144 100,188 24,144 24,56" 
        stroke="url(#logoGlowGrad)" 
        strokeWidth="2" 
        strokeLinejoin="round"
        filter="url(#glowEffect)"
      />

      {/* Hexagonal corner connection nodes */}
      <circle cx="100" cy="12" r="6" stroke="url(#logoGlowGrad)" strokeWidth="2" fill="#090d1f" />
      <circle cx="176" cy="56" r="6" stroke="url(#logoGlowGrad)" strokeWidth="2" fill="#090d1f" />
      <circle cx="176" cy="144" r="6" stroke="url(#logoGlowGrad)" strokeWidth="2" fill="#090d1f" />
      <circle cx="100" cy="188" r="6" stroke="url(#logoGlowGrad)" strokeWidth="2" fill="#090d1f" />
      <circle cx="24" cy="144" r="6" stroke="url(#logoGlowGrad)" strokeWidth="2" fill="#090d1f" />
      <circle cx="24" cy="56" r="6" stroke="url(#logoGlowGrad)" strokeWidth="2" fill="#090d1f" />

      {/* Radar grid alignment thin circle */}
      <circle 
        cx="100" 
        cy="100" 
        r="68" 
        stroke="url(#logoGlowGrad)" 
        strokeWidth="1" 
        strokeDasharray="3 3" 
        strokeOpacity="0.5"
      />
      
      {/* Inner Circle Frame */}
      <circle 
        cx="100" 
        cy="100" 
        r="60" 
        stroke="url(#logoGlowGrad)" 
        strokeWidth="1.5" 
      />

      {/* Technical alignment ticks */}
      <line x1="100" y1="2" x2="100" y2="22" stroke="url(#logoGlowGrad)" strokeWidth="1" />
      <line x1="100" y1="178" x2="100" y2="198" stroke="url(#logoGlowGrad)" strokeWidth="1" />
      <line x1="12" y1="100" x2="32" y2="100" stroke="url(#logoGlowGrad)" strokeWidth="1" />
      <line x1="168" y1="100" x2="188" y2="100" stroke="url(#logoGlowGrad)" strokeWidth="1" />

      {/* Minor circuit points along outer limits */}
      <circle cx="44" cy="70" r="2" fill="url(#logoGlowGrad)" />
      <circle cx="156" cy="70" r="2" fill="url(#logoGlowGrad)" />
      <circle cx="44" cy="130" r="2" fill="url(#logoGlowGrad)" />
      <circle cx="156" cy="130" r="2" fill="url(#logoGlowGrad)" />

      {/* Stylized Double-Line Tech Letters "A" and "N" */}
      {/* Outer block paths for letter shapes */}
      
      {/* Letter A stroke */}
      <path 
        d="M 68 145 L 96 68 L 124 145" 
        stroke="url(#anLettersGrad)" 
        strokeWidth="11" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      {/* Inner stencil split core for modern outline appearance */}
      <path 
        d="M 68 145 L 96 68 L 124 145" 
        stroke="#0c102b" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />

      {/* Letter A horizontal bar */}
      <path 
        d="M 78 120 L 114 120" 
        stroke="url(#anLettersGrad)" 
        strokeWidth="8" 
        strokeLinecap="round"
      />
      <path 
        d="M 78 120 L 114 120" 
        stroke="#0c102b" 
        strokeWidth="2.5" 
        strokeLinecap="round"
      />

      {/* Letter N stroke */}
      <path 
        d="M 124 145 L 124 68 L 152 145 L 152 68" 
        stroke="url(#anLettersGrad)" 
        strokeWidth="11" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      {/* Inner stencil split core for modern outline appearance */}
      <path 
        d="M 124 145 L 124 68 L 152 145 L 152 68" 
        stroke="#0c102b" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />

      {/* Interactive Network / Circuit Dots on the letters mimicking the upload */}
      {/* Circle dot on A's left slope */}
      <circle cx="78" cy="115" r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.2" />
      
      {/* Circle dot at the apex node of A */}
      <circle cx="96" cy="68" r="5.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.2" />
      
      {/* Circle dot where crossbar and A intersect */}
      <circle cx="100" cy="120" r="4.5" fill="#0ea5e9" stroke="#ffffff" strokeWidth="1" />

      {/* Circle dot on the diagonal of N */}
      <circle cx="138" cy="106" r="4.5" fill="#0ea5e9" stroke="#ffffff" strokeWidth="1" />

      {/* Circle dot on N's diagonal-to-right leg joint */}
      <circle cx="145" cy="124" r="4.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />

    </svg>
  );
}
