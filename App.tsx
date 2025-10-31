import React, { useState, useCallback, useEffect } from 'react';
import type { Piece, BoardState, Move } from './types';
import { calculateValidMoves, initializeBoardState } from './lib/gameLogic';
import InfoPanel from './components/InfoPanel';
import ThreeScene from './components/ThreeScene';

const App: React.FC = () => {
  const [boardState, setBoardState] = useState<BoardState>(() => initializeBoardState());
  const [turn, setTurn] = useState<'white' | 'black'>('white');
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [capturedPieces, setCapturedPieces] = useState<{ white: Piece[], black: Piece[] }>({ white: [], black: [] });
  const [gameStatus, setGameStatus] = useState('active');
  const [sidebarWidth, setSidebarWidth] = useState(350);

  useEffect(() => {
    if (selectedPiece) {
      setValidMoves(calculateValidMoves(selectedPiece, boardState));
    } else {
      setValidMoves([]);
    }
  }, [selectedPiece, boardState]);

  const executeMove = useCallback((piece: Piece, targetX: number, targetY: number, targetZ: number) => {
    const { x: oldX, y: oldY, z: oldZ } = piece;

    const newBoardState = JSON.parse(JSON.stringify(boardState));
    const targetPiece = newBoardState[targetX][targetY][targetZ];
    
    if (targetPiece) {
        if (targetPiece.type === 'K') {
            setGameStatus(`${piece.color.toUpperCase()} WINS!`);
        }
        const opponentColor = piece.color === 'white' ? 'black' : 'white';
        setCapturedPieces(prev => ({
            ...prev,
            [opponentColor]: [...prev[opponentColor], targetPiece]
        }));
    }

    newBoardState[oldX][oldY][oldZ] = null;
    const movedPiece = { ...piece, x: targetX, y: targetY, z: targetZ, hasMoved: true };
    newBoardState[targetX][targetY][targetZ] = movedPiece;
    
    setBoardState(newBoardState);
    setTurn(t => t === 'white' ? 'black' : 'white');
    setSelectedPiece(null);
  }, [boardState]);


  const handleSquareClick = useCallback((x: number, y: number, z: number) => {
    if (gameStatus !== 'active') return;

    const clickedPiece = boardState[x][y][z];

    if (selectedPiece) {
        const isValidMove = validMoves.some(m => m.x === x && m.y === y && m.z === z);
        if (isValidMove) {
            executeMove(selectedPiece, x, y, z);
            return;
        }

        if (clickedPiece && clickedPiece.color === turn) {
            setSelectedPiece(clickedPiece);
        } else {
            setSelectedPiece(null);
        }
    } else {
        if (clickedPiece && clickedPiece.color === turn) {
            setSelectedPiece(clickedPiece);
        }
    }
  }, [boardState, selectedPiece, validMoves, turn, executeMove, gameStatus]);

  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    const startX = mouseDownEvent.clientX;
    const startWidth = sidebarWidth;

    const doDrag = (mouseMoveEvent: MouseEvent) => {
      const newWidth = startWidth + mouseMoveEvent.clientX - startX;
      const minWidth = 280;
      const maxWidth = 600;
      if (newWidth > minWidth && newWidth < maxWidth) {
        setSidebarWidth(newWidth);
      }
    };

    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  }, [sidebarWidth]);

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen bg-gray-900 text-white overflow-hidden">
      <div 
        style={{ width: `${sidebarWidth}px` }}
        className="flex-shrink-0 h-full"
      >
        <InfoPanel 
          turn={turn}
          capturedPieces={capturedPieces}
          boardState={boardState}
          selectedPiece={selectedPiece}
          validMoves={validMoves}
          onSquareClick={handleSquareClick}
          gameStatus={gameStatus}
        />
      </div>
      
      <div 
        className="w-2 cursor-col-resize bg-gray-700 hover:bg-pink-400 transition-colors duration-200 flex-shrink-0"
        onMouseDown={startResizing}
        aria-label="Resize sidebar"
        role="separator"
      />

      <div className="flex-grow h-full relative">
        <ThreeScene 
            boardState={boardState}
            selectedPiece={selectedPiece}
            validMoves={validMoves}
        />
      </div>
    </div>
  );
};

export default App;
