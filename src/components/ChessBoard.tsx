import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import type { BoardTheme } from '../types/chess';
import { ChessPiece, type PieceColor, type PieceType } from './ChessPiece';

interface ChessBoardProps {
  fen: string;
  theme: BoardTheme;
  flipped: boolean;
  interactive: boolean;
  allowedColor?: 'w' | 'b' | 'both';
  showLegalMoves: boolean;
  showCoordinates: boolean;
  lastMove: { from: string; to: string } | null;
  onAttemptMove: (from: Square, to: Square) => void;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'] as const;

interface DragState {
  from: Square;
  pieceType: PieceType;
  pieceColor: PieceColor;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  active: boolean;
  squareSize: number;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  fen,
  theme,
  flipped,
  interactive,
  allowedColor = 'both',
  showLegalMoves,
  showCoordinates,
  lastMove,
  onAttemptMove,
}) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoverSquare, setHoverSquare] = useState<Square | null>(null);

  const chess = useMemo(() => new Chess(fen), [fen]);
  const turn = chess.turn();
  const inCheck = chess.inCheck();

  // Clear selection whenever FEN changes
  useEffect(() => {
    setSelectedSquare(null);
    setDragState(null);
    setHoverSquare(null);
  }, [fen]);

  // Compute legal destinations for currently selected square
  const legalTargets = useMemo(() => {
    const map = new Map<Square, { isCapture: boolean }>();
    if (!selectedSquare || !interactive) return map;
    const moves = chess.moves({ square: selectedSquare, verbose: true });
    for (const m of moves) {
      map.set(m.to, { isCapture: Boolean(m.captured) || m.flags.includes('e') });
    }
    return map;
  }, [chess, selectedSquare, interactive]);

  // Locate king in check
  const checkedKingSquare = useMemo(() => {
    if (!inCheck) return null;
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === turn) {
          return `${FILES[c]}${RANKS[r]}` as Square;
        }
      }
    }
    return null;
  }, [chess, inCheck, turn]);

  const canControlPiece = useCallback(
    (pieceColor: PieceColor): boolean => {
      if (!interactive) return false;
      if (pieceColor !== turn) return false;
      if (allowedColor === 'both') return true;
      return pieceColor === allowedColor;
    },
    [interactive, turn, allowedColor]
  );

  const getSquareFromPoint = useCallback(
    (clientX: number, clientY: number): Square | null => {
      const el = boardRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        return null;
      }
      const colIdx = Math.floor(((clientX - rect.left) / rect.width) * 8);
      const rowIdx = Math.floor(((clientY - rect.top) / rect.height) * 8);
      if (colIdx < 0 || colIdx > 7 || rowIdx < 0 || rowIdx > 7) return null;

      const file = flipped ? FILES[7 - colIdx] : FILES[colIdx];
      const rank = flipped ? RANKS[7 - rowIdx] : RANKS[rowIdx];
      return `${file}${rank}` as Square;
    },
    [flipped]
  );

  const handleSquarePointerDown = (
    e: React.PointerEvent<HTMLButtonElement>,
    sq: Square,
    piece: { type: PieceType; color: PieceColor } | null
  ) => {
    if (!interactive) return;

    // If clicking a legal target of the already selected square, execute move
    if (selectedSquare && legalTargets.has(sq)) {
      e.preventDefault();
      onAttemptMove(selectedSquare, sq);
      setSelectedSquare(null);
      return;
    }

    // If clicking own controllable piece, select it and arm pointer drag
    if (piece && canControlPiece(piece.color)) {
      e.preventDefault();
      const wasAlreadySelected = selectedSquare === sq;
      setSelectedSquare(sq);

      const boardRect = boardRef.current?.getBoundingClientRect();
      const squareSize = boardRect ? boardRect.width / 8 : 64;

      setDragState({
        from: sq,
        pieceType: piece.type,
        pieceColor: piece.color,
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        currentY: e.clientY,
        active: false,
        squareSize,
      });

      // Track whether user clicked the same selected square without dragging
      if (wasAlreadySelected) {
        // Deselection handled on pointerup if no drag occurred
        (e.currentTarget as HTMLElement).dataset.toggleDeselect = 'true';
      } else {
        delete (e.currentTarget as HTMLElement).dataset.toggleDeselect;
      }
      return;
    }

    // Otherwise clear selection
    setSelectedSquare(null);
  };

  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (e: PointerEvent) => {
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      const movedEnough = dragState.active || Math.hypot(dx, dy) > 5;

      setDragState((prev) =>
        prev
          ? {
              ...prev,
              currentX: e.clientX,
              currentY: e.clientY,
              active: movedEnough,
            }
          : null
      );

      if (movedEnough) {
        setHoverSquare(getSquareFromPoint(e.clientX, e.clientY));
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (dragState.active) {
        const dropSquare = getSquareFromPoint(e.clientX, e.clientY);
        if (dropSquare && dropSquare !== dragState.from && legalTargets.has(dropSquare)) {
          onAttemptMove(dragState.from, dropSquare);
          setSelectedSquare(null);
        }
      }
      setDragState(null);
      setHoverSquare(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [dragState, getSquareFromPoint, legalTargets, onAttemptMove]);

  const orderedRows = flipped ? [...RANKS].reverse() : RANKS;
  const orderedCols = flipped ? [...FILES].reverse() : FILES;
  const boardMatrix = chess.board();

  return (
    <div className="relative w-full aspect-square select-none">
      {/* Subtle architectural frame around the board */}
      <div
        ref={boardRef}
        role="grid"
        aria-label="Chessboard"
        className="w-full h-full grid grid-cols-8 grid-rows-8 rounded-lg overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.7)] ring-1 ring-[#D4AF37]/25 touch-none"
        style={{ border: `3px solid ${theme.frameBorder}` }}
      >
        {orderedRows.map((rank, visualRowIdx) =>
          orderedCols.map((file, visualColIdx) => {
            const sq = `${file}${rank}` as Square;
            const modelRow = 8 - parseInt(rank, 10);
            const modelCol = FILES.indexOf(file);
            const piece = boardMatrix[modelRow][modelCol];

            const isLight = (modelRow + modelCol) % 2 === 0;
            const baseBg = isLight ? theme.lightSquare : theme.darkSquare;
            const coordColor = isLight ? theme.lightCoord : theme.darkCoord;

            const isSelected = selectedSquare === sq;
            const isLastMove = lastMove?.from === sq || lastMove?.to === sq;
            const legalInfo = legalTargets.get(sq);
            const isCheckedKing = checkedKingSquare === sq;
            const isDropHover = dragState?.active && hoverSquare === sq && Boolean(legalInfo);
            const isBeingDragged = dragState?.active && dragState.from === sq;

            const showRankLabel = showCoordinates && visualColIdx === 0;
            const showFileLabel = showCoordinates && visualRowIdx === 7;

            const pieceLabel = piece
              ? `${piece.color === 'w' ? 'White' : 'Black'} ${
                  { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King' }[piece.type]
                }`
              : 'Empty';

            return (
              <button
                key={sq}
                type="button"
                aria-label={`${sq} ${pieceLabel}`}
                onPointerDown={(e) => handleSquarePointerDown(e, sq, piece)}
                onClick={(e) => {
                  // Only toggle off if user tapped already-selected square without dragging
                  if (e.currentTarget.dataset.toggleDeselect === 'true') {
                    delete e.currentTarget.dataset.toggleDeselect;
                    setSelectedSquare(null);
                  }
                }}
                className="relative flex items-center justify-center w-full h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E8C967]"
                style={{ backgroundColor: baseBg }}
              >
                {/* Last move tint */}
                {isLastMove && (
                  <span
                    className="absolute inset-0 pointer-events-none"
                    style={{ backgroundColor: theme.highlightLastMove }}
                  />
                )}

                {/* Selected square tint */}
                {isSelected && (
                  <span
                    className="absolute inset-0 pointer-events-none"
                    style={{ backgroundColor: theme.highlightSelected }}
                  />
                )}

                {/* Check glow */}
                {isCheckedKing && (
                  <span
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        'radial-gradient(circle, rgba(220,38,38,0.82) 0%, rgba(185,28,28,0.45) 58%, transparent 100%)',
                    }}
                  />
                )}

                {/* Drop target hover outline */}
                {isDropHover && (
                  <span className="absolute inset-0 pointer-events-none ring-2 ring-inset ring-[#F5E7B8]/90 bg-[#D4AF37]/20" />
                )}

                {/* Rank coordinate (left column) */}
                {showRankLabel && (
                  <span
                    className="absolute top-0.5 left-1 text-[10px] sm:text-[11px] font-mono font-semibold leading-none pointer-events-none opacity-80"
                    style={{ color: coordColor }}
                  >
                    {rank}
                  </span>
                )}

                {/* File coordinate (bottom row) */}
                {showFileLabel && (
                  <span
                    className="absolute bottom-0.5 right-1 text-[10px] sm:text-[11px] font-mono font-semibold leading-none pointer-events-none opacity-80"
                    style={{ color: coordColor }}
                  >
                    {file}
                  </span>
                )}

                {/* Chess piece SVG */}
                {piece && !isBeingDragged && (
                  <div
                    className={`w-[82%] h-[82%] transition-transform duration-150 ${
                      canControlPiece(piece.color) ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
                    }`}
                  >
                    <ChessPiece type={piece.type} color={piece.color} />
                  </div>
                )}

                {/* Legal move indicator */}
                {showLegalMoves && legalInfo && (
                  legalInfo.isCapture ? (
                    <span
                      className="absolute inset-[6%] rounded-full border-[3px] border-[#D4AF37]/85 pointer-events-none shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
                      aria-hidden="true"
                    />
                  ) : (
                    <span
                      className="w-[28%] h-[28%] rounded-full bg-[#D4AF37]/80 ring-1 ring-black/35 pointer-events-none"
                      aria-hidden="true"
                    />
                  )
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Floating dragged piece */}
      {dragState?.active && (
        <div
          className="fixed top-0 left-0 pointer-events-none z-50"
          style={{
            width: `${dragState.squareSize * 1.08}px`,
            height: `${dragState.squareSize * 1.08}px`,
            transform: `translate3d(${dragState.currentX - (dragState.squareSize * 1.08) / 2}px, ${
              dragState.currentY - (dragState.squareSize * 1.08) / 2
            }px, 0)`,
          }}
        >
          <ChessPiece type={dragState.pieceType} color={dragState.pieceColor} />
        </div>
      )}
    </div>
  );
};
