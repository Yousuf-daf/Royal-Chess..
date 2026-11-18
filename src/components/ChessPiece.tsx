import React from 'react';

export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

interface ChessPieceProps {
  type: PieceType;
  color: PieceColor;
  className?: string;
}

/**
 * Hand-crafted Staunton SVG chess pieces optimized for high legibility on both
 * dark obsidian and warm champagne/walnut squares.
 */
export const ChessPiece: React.FC<ChessPieceProps> = ({ type, color, className = 'w-full h-full' }) => {
  const isWhite = color === 'w';
  const fill = isWhite ? '#F7F2E7' : '#191B20';
  const stroke = isWhite ? '#23201B' : '#C8A64B';
  const detailStroke = isWhite ? '#383229' : '#E2C675';
  const baseShade = isWhite ? '#DDD4C0' : '#0E0F13';

  return (
    <svg
      viewBox="0 0 45 45"
      className={`select-none pointer-events-none drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)] ${className}`}
      aria-hidden="true"
    >
      {type === 'p' && (
        <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" />
          <path d="M12.5 39.5h20" stroke={detailStroke} strokeWidth="1.3" />
          <rect x="10.5" y="37" width="24" height="3" rx="1" fill={baseShade} stroke={stroke} strokeWidth="1.2" />
        </g>
      )}

      {type === 'r' && (
        <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 39h27v-3H9v3z" fill={baseShade} />
          <path d="M12 36v-4h21v4H12z" />
          <path d="M11 14V9h4v2h5V9h5v2h5V9h4v5" />
          <path d="M34 14l-3 3H14l-3-3" />
          <path d="M31 17v12.5H14V17" />
          <path d="M31 29.5l1.5 2.5h-20l1.5-2.5" />
          <path d="M11 14h23" stroke={detailStroke} strokeWidth="1.2" />
          <path d="M14 17h17" stroke={detailStroke} strokeWidth="1.1" />
          <path d="M14 29.5h17" stroke={detailStroke} strokeWidth="1.1" />
        </g>
      )}

      {type === 'n' && (
        <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" />
          <path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3" />
          <circle cx="15" cy="15.5" r="1" fill={detailStroke} stroke="none" />
          <path d="M9.5 25.5a0.5 0.5 0 1 1-1 0 0.5 0.5 0 1 1 1 0z" fill={detailStroke} stroke="none" />
          <rect x="11" y="37" width="27" height="3" rx="1" fill={baseShade} stroke={stroke} strokeWidth="1.3" />
        </g>
      )}

      {type === 'b' && (
        <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z" fill={baseShade} />
          <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" />
          <circle cx="22.5" cy="8" r="2.5" />
          <path d="M17.5 26h10M15 30h15M22.5 15.5v5M20 18h5" stroke={detailStroke} strokeWidth="1.3" fill="none" />
        </g>
      )}

      {type === 'q' && (
        <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="12" r="2.2" />
          <circle cx="14" cy="9" r="2.2" />
          <circle cx="22.5" cy="8" r="2.2" />
          <circle cx="31" cy="9" r="2.2" />
          <circle cx="39" cy="12" r="2.2" />
          <path d="M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-.3-14.1-5.2 13.6-3-14.5-3 14.5-5.2-13.6L14 25 6.5 13.5 9 26z" />
          <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" />
          <path d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0" stroke={detailStroke} strokeWidth="1.2" fill="none" />
          <rect x="10.5" y="36.5" width="24" height="3" rx="1" fill={baseShade} stroke={stroke} strokeWidth="1.2" />
        </g>
      )}

      {type === 'k' && (
        <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22.5 11.63V6M20 8h5" stroke={detailStroke} strokeWidth="1.8" />
          <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" />
          <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10V37z" />
          <path d="M11.5 30c5.5-3 15.5-3 21 0M11.5 33.5c5.5-3 15.5-3 21 0M11.5 37c5.5-3 15.5-3 21 0" stroke={detailStroke} strokeWidth="1.2" fill="none" />
        </g>
      )}
    </svg>
  );
};
