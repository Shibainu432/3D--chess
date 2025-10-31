import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SIZE, CELL_SIZE, BOARD_BOUNDS, CENTER_OFFSET } from '../types';
import type { Piece } from '../types';
import { CHESS_MODEL_BASE64 } from './chessModel';

const WHITE_COLOR = new THREE.Color(0xe0e0e0);
const BLACK_COLOR = new THREE.Color(0x1a1a1a);
const GRID_COLOR = 0x3b82f6;
const GRID_OPACITY = 0.4;

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

export async function loadAssets(): Promise<Record<string, THREE.Object3D>> {
    const loader = new GLTFLoader();
    const modelData = base64ToArrayBuffer(CHESS_MODEL_BASE64);
    const gltf = await loader.parseAsync(modelData, '');
    const pieceModels: Record<string, THREE.Object3D> = {};

    gltf.scene.children.forEach(child => {
        if (child.name === 'King') pieceModels['K'] = child;
        if (child.name === 'Queen') pieceModels['Q'] = child;
        if (child.name === 'Rook') pieceModels['R'] = child;
        if (child.name === 'Bishop') pieceModels['B'] = child;
        if (child.name === 'Knight') pieceModels['N'] = child;
        if (child.name === 'Pawn') pieceModels['P'] = child;
    });
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
    pieceGroup.scale.set(scale, scale, scale);
    pieceGroup.position.copy(worldPos);

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