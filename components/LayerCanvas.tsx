
import React, { useRef, useEffect } from 'react';
import type { Piece, Move, BoardState } from '../types';
import { BOARD_SIZE_2D, CELL_SIZE_2D, PIECE_SYMBOLS } from '../types';

interface LayerCanvasProps {
  zLayer: number;
  boardState: BoardState;
  selectedPiece: Piece | null;
  validMoves: Move[];
  onSquareClick: (x: number, y: number, z: number) => void;
}

const LayerCanvas: React.FC<LayerCanvasProps> = ({ zLayer, boardState, selectedPiece, validMoves, onSquareClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = BOARD_SIZE_2D * CELL_SIZE_2D;
    canvas.width = size;
    canvas.height = size;

    for (let y = 0; y < BOARD_SIZE_2D; y++) {
      for (let x = 0; x < BOARD_SIZE_2D; x++) {
        const canvasRow = BOARD_SIZE_2D - 1 - y;
        const piece = boardState[x][y][zLayer];

        // Draw Background
        ctx.fillStyle = (x + y) % 2 !== 0 ? '#374151' : '#1f2937';
        ctx.fillRect(x * CELL_SIZE_2D, canvasRow * CELL_SIZE_2D, CELL_SIZE_2D, CELL_SIZE_2D);
        
        // Highlight selected square
        if (selectedPiece && selectedPiece.z === zLayer && selectedPiece.x === x && selectedPiece.y === y) {
          ctx.fillStyle = 'rgba(250, 204, 21, 0.7)'; // Yellow with some transparency
          ctx.fillRect(x * CELL_SIZE_2D, canvasRow * CELL_SIZE_2D, CELL_SIZE_2D, CELL_SIZE_2D);
        }

        // Highlight valid move targets
        const moveData = validMoves.find(m => m.x === x && m.y === y && m.z === zLayer);
        if (moveData) {
          const centerX = x * CELL_SIZE_2D + CELL_SIZE_2D / 2;
          const centerY = canvasRow * CELL_SIZE_2D + CELL_SIZE_2D / 2;
          ctx.beginPath();
          if (moveData.capture) {
            ctx.strokeStyle = '#f87171'; // Red
            ctx.lineWidth = CELL_SIZE_2D * 0.1;
            ctx.arc(centerX, centerY, CELL_SIZE_2D * 0.45, 0, 2 * Math.PI);
            ctx.stroke();
          } else {
            ctx.fillStyle = 'rgba(74, 222, 128, 0.7)'; // Green with transparency
            ctx.arc(centerX, centerY, CELL_SIZE_2D * 0.2, 0, 2 * Math.PI);
            ctx.fill();
          }
        }

        // Draw Pieces
        if (piece) {
          const symbol = PIECE_SYMBOLS[piece.color][piece.type];
          ctx.font = `${CELL_SIZE_2D * 0.8}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = piece.color === 'white' ? '#f3f4f6' : '#9ca3af';
          const centerX = x * CELL_SIZE_2D + CELL_SIZE_2D / 2;
          const centerY = canvasRow * CELL_SIZE_2D + CELL_SIZE_2D / 2;
          ctx.fillText(symbol, centerX, centerY + CELL_SIZE_2D * 0.05);
        }
      }
    }
  }, [boardState, selectedPiece, validMoves, zLayer]);

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / CELL_SIZE_2D);
    const canvasY = Math.floor((event.clientY - rect.top) / CELL_SIZE_2D);
    const y = BOARD_SIZE_2D - 1 - canvasY;
    onSquareClick(x, y, zLayer);
  };

  const isActive = selectedPiece?.z === zLayer;
  
  return (
    <div className={`layer-canvas-container flex-1 min-w-[48%] flex flex-col items-center rounded-lg overflow-hidden shadow-lg transition-all duration-200 border-2 ${isActive ? 'border-yellow-400 shadow-yellow-400/50' : 'border-transparent'}`}>
      <div className="text-xs font-mono text-center w-full py-0.5 bg-gray-800 text-gray-400">Layer Z={zLayer}</div>
      <canvas ref={canvasRef} onClick={handleClick} className="cursor-pointer" />
    </div>
  );
};

export default LayerCanvas;
