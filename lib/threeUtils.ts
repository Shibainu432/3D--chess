import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { SIZE, CELL_SIZE, BOARD_BOUNDS, CENTER_OFFSET } from '../types';
import type { Piece } from '../types';
import { PAWN_OBJ, ROOK_OBJ, KNIGHT_OBJ, BISHOP_OBJ, QUEEN_OBJ, KING_OBJ } from './chessModel';

const WHITE_COLOR = new THREE.Color(0xe0e0e0);
const BLACK_COLOR = new THREE.Color(0x1a1a1a);
const GRID_COLOR = 0x3b82f6;
const GRID_OPACITY = 0.4;

export async function loadAssets(): Promise<Record<string, THREE.Object3D>> {
    const loader = new OBJLoader();
    const pieceModels: Record<string, THREE.Object3D> = {};

    const createModel = (objString: string, name: string) => {
        const model = loader.parse(objString);
        model.name = name;
        model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.geometry.computeVertexNormals();
            }
        });
        // Center and normalize model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        model.scale.multiplyScalar(1.0 / maxDim);
        model.position.sub(center.multiplyScalar(1.0 / maxDim));
        model.scale.set(1.5,1.5,1.5); // Adjust base scale
        return model;
    };
    
    pieceModels['P'] = createModel(PAWN_OBJ, 'Pawn');
    pieceModels['R'] = createModel(ROOK_OBJ, 'Rook');
    pieceModels['N'] = createModel(KNIGHT_OBJ, 'Knight');
    pieceModels['B'] = createModel(BISHOP_OBJ, 'Bishop');
    pieceModels['Q'] = createModel(QUEEN_OBJ, 'Queen');
    pieceModels['K'] = createModel(KING_OBJ, 'King');

    return pieceModels;
}

export function getCellWorldPosition(x: number, y: number, z: number): THREE.Vector3 {
    return new THREE.Vector3(
        x * CELL_SIZE - CENTER_OFFSET,
        z * CELL_SIZE - CENTER_OFFSET, 
        y * CELL_SIZE - CENTER_OFFSET
    );
}

export function createPieceMesh(pieceData: Piece, pieceModels: Record<string, THREE.Object3D>): THREE.Object3D {
    const model = pieceModels[pieceData.type];
    if (!model) {
        console.error(`Model for piece type ${pieceData.type} not found!`);
        return new THREE.Group();
    }

    const pieceGroup = model.clone();
    const color = pieceData.color === 'white' ? WHITE_COLOR : BLACK_COLOR;
    const material = new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.4 });

    pieceGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            child.material = material;
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    const worldPos = getCellWorldPosition(pieceData.x, pieceData.y, pieceData.z);
    
    const scale = 3.5;
    pieceGroup.scale.multiplyScalar(scale);
    pieceGroup.position.copy(worldPos);
    pieceGroup.position.y += CELL_SIZE * 0.4; // Adjust vertical position

    if (pieceData.type === 'N') {
        pieceGroup.rotation.y = pieceData.color === 'white' ? -Math.PI / 2 : Math.PI / 2;
    }

    pieceGroup.userData = pieceData;
    pieceGroup.name = `piece_${pieceData.x}_${pieceData.y}_${pieceData.z}`;
    
    return pieceGroup;
}

export function create3DBoard(group: THREE.Group) {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const addLine = (p1: {x:number, y:number, z:number}, p2: {x:number, y:number, z:number}) => { positions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z); };

    const min = -BOARD_BOUNDS / 2;
    const max = BOARD_BOUNDS / 2;

    for (let i = 0; i <= SIZE; i++) {
        const coord = i * CELL_SIZE + min;
        const zCoord = coord;

        for(let j=0; j<=SIZE; j++) {
             const innerCoord = j * CELL_SIZE + min;
             addLine({ x: innerCoord, y: min, z: zCoord }, { x: innerCoord, y: max, z: zCoord });
             addLine({ x: min, y: innerCoord, z: zCoord }, { x: max, y: innerCoord, z: zCoord });
        }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({
        color: GRID_COLOR,
        transparent: true,
        opacity: GRID_OPACITY
    });
    const grid = new THREE.LineSegments(geometry, material);

    const planeGeometry = new THREE.PlaneGeometry(BOARD_BOUNDS, BOARD_BOUNDS);
    const planeMaterial = new THREE.MeshLambertMaterial({
        color: 0x475569,
        side: THREE.DoubleSide
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = min - 0.01;
    plane.receiveShadow = true;
    group.add(plane);
    group.add(grid);
}