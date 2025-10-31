
import { SIZE } from '../types';
import type { Piece, BoardState, Move } from '../types';

export function initializeBoardState(): BoardState {
    const state: BoardState = Array(SIZE).fill(0).map(() => 
        Array(SIZE).fill(0).map(() => 
            Array(SIZE).fill(null)
        )
    );

    const MAJOR_PIECE_PATTERN = [
        "rnbrrbnr",
        "nnbqqbnn",
        "bbbqqbbb",
        "rqqqkqqr",
        "rqqqqqqr",
        "bbbqqbbb",
        "nnbqqbnn",
        "rnbrrbnr"
    ];
    
    const PAWN_ROW = "pppppppp"; 

    for (let z = 0; z < SIZE; z++) {
        const isWhite = z < 4;
        let layerPattern: string[] | null = null;

        if (z === 0) layerPattern = MAJOR_PIECE_PATTERN;
        else if (z === 1) layerPattern = Array(SIZE).fill(PAWN_ROW);
        else if (z === 6) layerPattern = Array(SIZE).fill(PAWN_ROW);
        else if (z === 7) layerPattern = MAJOR_PIECE_PATTERN;
        
        if (layerPattern) {
            for (let y = 0; y < SIZE; y++) {
                const rowString = layerPattern[y];
                for (let x = 0; x < SIZE; x++) {
                    const char = rowString[x];
                    if (char !== ' ') { 
                        const pieceKey = char.toUpperCase() as Piece['type'];
                        state[x][y][z] = {
                            type: pieceKey, 
                            color: isWhite ? 'white' : 'black',
                            x, y, z,
                            hasMoved: false
                        };
                    }
                }
            }
        }
    }
    return state;
}

function isWithinBounds(x: number, y: number, z: number): boolean {
    return x >= 0 && x < SIZE && y >= 0 && y < SIZE && z >= 0 && z < SIZE;
}

export function calculateValidMoves(piece: Piece, boardState: BoardState): Move[] {
    const { x: startX, y: startY, z: startZ, type, color } = piece;
    const moves: Move[] = [];

    if (type === 'P') {
        const zDir = color === 'white' ? 1 : -1; 
        const moveZ = startZ + zDir;
        if (isWithinBounds(startX, startY, moveZ) && !boardState[startX][startY][moveZ]) {
            moves.push({ x: startX, y: startY, z: moveZ, capture: false });
            const startLayer = (color === 'white') ? 1 : 6;
            if (startZ === startLayer) {
                const doubleMoveZ = startZ + zDir * 2;
                if (isWithinBounds(startX, startY, doubleMoveZ) && !boardState[startX][startY][doubleMoveZ]) {
                    moves.push({ x: startX, y: startY, z: doubleMoveZ, capture: false });
                }
            }
        }
        const threeDDirections = [];
        for (const dx of [-1, 0, 1]) {
            for (const dy of [-1, 0, 1]) {
                if (dx === 0 && dy === 0) continue; 
                threeDDirections.push([dx, dy, zDir]);
            }
        }

        for (const [dx, dy, dz] of threeDDirections) {
            const tx = startX + dx;
            const ty = startY + dy;
            const tz = startZ + dz;
            if (isWithinBounds(tx, ty, tz)) {
                const targetPiece = boardState[tx][ty][tz];
                if (targetPiece && targetPiece.color !== color) {
                    moves.push({ x: tx, y: ty, z: tz, capture: true });
                }
            }
        }
    } else if (type === 'N') {
        const permutations = [
            [2, 1, 0], [2, -1, 0], [-2, 1, 0], [-2, -1, 0],
            [1, 2, 0], [1, -2, 0], [-1, 2, 0], [-1, -2, 0],
            [2, 0, 1], [2, 0, -1], [-2, 0, 1], [-2, 0, -1],
            [1, 0, 2], [1, 0, -2], [-1, 0, 2], [-1, 0, -2],
            [0, 2, 1], [0, 2, -1], [0, -2, 1], [0, -2, -1],
            [0, 1, 2], [0, 1, -2], [0, -1, 2], [0, -1, -2]
        ];

        for (const [dx, dy, dz] of permutations) {
            const tx = startX + dx, ty = startY + dy, tz = startZ + dz;
            if (isWithinBounds(tx, ty, tz)) {
                const targetPiece = boardState[tx][ty][tz];
                if (!targetPiece || targetPiece.color !== color) {
                    moves.push({ x: tx, y: ty, z: tz, capture: !!targetPiece });
                }
            }
        }
    } else {
        const all3DDirections: number[][] = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dz = -1; dz <= 1; dz++) {
                    if (dx === 0 && dy === 0 && dz === 0) continue; 
                    all3DDirections.push([dx, dy, dz]);
                }
            }
        }

        let rayDirections: number[][] = [];
        if (type === 'R' || type === 'Q' || type === 'K') {
            rayDirections.push(...all3DDirections.filter(([dx, dy, dz]) => (Math.abs(dx) + Math.abs(dy) + Math.abs(dz)) === 1));
        }
        if (type === 'B' || type === 'Q' || type === 'K') {
            rayDirections.push(...all3DDirections.filter(([dx, dy, dz]) => (Math.abs(dx) + Math.abs(dy) + Math.abs(dz)) > 1));
        }

        const uniqueDirections = new Set(rayDirections.map(d => d.join(',')));
        rayDirections = Array.from(uniqueDirections).map(s => s.split(',').map(Number));

        const maxDistance = (type === 'K') ? 1 : SIZE; 

        for (const [dx, dy, dz] of rayDirections) {
            for (let k = 1; k <= maxDistance; k++) {
                const tx = startX + dx * k, ty = startY + dy * k, tz = startZ + dz * k;
                if (!isWithinBounds(tx, ty, tz)) break; 
                const targetPiece = boardState[tx][ty][tz];
                if (targetPiece) {
                    if (targetPiece.color !== color) {
                        moves.push({ x: tx, y: ty, z: tz, capture: true }); 
                    }
                    break; 
                } else {
                    moves.push({ x: tx, y: ty, z: tz, capture: false }); 
                }
            }
        }
    }
    return moves;
}