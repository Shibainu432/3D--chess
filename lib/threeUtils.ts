import * as THREE from 'three';
import { SIZE, CELL_SIZE, BOARD_BOUNDS, CENTER_OFFSET } from '../types';
import type { Piece } from '../types';

const PIECE_SCALE = 0.5;
const WHITE_COLOR = new THREE.Color(0xe0e0e0);
const BLACK_COLOR = new THREE.Color(0x1a1a1a);
const GRID_COLOR = 0x3b82f6;
const GRID_OPACITY = 0.4;

export function getCellWorldPosition(x: number, y: number, z: number): THREE.Vector3 {
    return new THREE.Vector3(
        x * CELL_SIZE - CENTER_OFFSET,
        z * CELL_SIZE - CENTER_OFFSET, 
        y * CELL_SIZE - CENTER_OFFSET
    );
}

// --- NEW High-Detail Piece Creation Functions ---

function createPieceMaterial(color: THREE.Color): THREE.Material {
    return new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.2,
        roughness: 0.3,
    });
}

function createStyledPawn(scale: number, color: THREE.Color): THREE.Group {
    const group = new THREE.Group();
    const material = createPieceMaterial(color);
    
    const points = [
        new THREE.Vector2(0, -3.5),
        new THREE.Vector2(3, -3.5),
        new THREE.Vector2(2.8, -2.5),
        new THREE.Vector2(1.5, -1),
        new THREE.Vector2(1.8, 1),
        new THREE.Vector2(1, 1.5),
        new THREE.Vector2(0, 1.5)
    ];
    const head = new THREE.SphereGeometry(1.5 * scale, 16, 16);
    const body = new THREE.LatheGeometry(points, 20);

    const bodyMesh = new THREE.Mesh(body, material);
    const headMesh = new THREE.Mesh(head, material);
    
    headMesh.position.y = 2.2 * scale;
    headMesh.castShadow = true;
    bodyMesh.castShadow = true;

    group.add(bodyMesh);
    group.add(headMesh);
    group.scale.set(scale, scale, scale);
    return group;
}

function createStyledRook(scale: number, color: THREE.Color): THREE.Group {
    const group = new THREE.Group();
    const material = createPieceMaterial(color);
    
    const points = [
        new THREE.Vector2(0, -3.5),
        new THREE.Vector2(3.5, -3.5),
        new THREE.Vector2(3.3, -2.5),
        new THREE.Vector2(2.5, -2),
        new THREE.Vector2(2.5, 2.5),
        new THREE.Vector2(3, 3),
        new THREE.Vector2(0, 3)
    ];
    const body = new THREE.LatheGeometry(points, 20);
    const bodyMesh = new THREE.Mesh(body, material);
    bodyMesh.castShadow = true;
    group.add(bodyMesh);

    // Crenellations
    const crenelationGeom = new THREE.BoxGeometry(1 * scale, 2 * scale, 1.5 * scale);
    for (let i = 0; i < 6; i++) {
        const crenel = new THREE.Mesh(crenelationGeom, material);
        const angle = i * Math.PI / 3;
        crenel.position.set(
            Math.cos(angle) * 2.8 * scale,
            4 * scale,
            Math.sin(angle) * 2.8 * scale
        );
        crenel.rotation.y = -angle;
        crenel.castShadow = true;
        group.add(crenel);
    }
    group.scale.set(scale, scale, scale);
    return group;
}

function createStyledKnight(scale: number, color: THREE.Color): THREE.Group {
    const group = new THREE.Group();
    const material = createPieceMaterial(color);

    // Base
    const basePoints = [
        new THREE.Vector2(0, -4),
        new THREE.Vector2(4, -4),
        new THREE.Vector2(3.5, -3),
        new THREE.Vector2(2, 0),
        new THREE.Vector2(0,0)
    ];
    const base = new THREE.LatheGeometry(basePoints, 20);
    const baseMesh = new THREE.Mesh(base, material);
    baseMesh.castShadow = true;
    group.add(baseMesh);

    // Horse head composite shape
    const headGroup = new THREE.Group();
    const neckGeom = new THREE.BoxGeometry(2, 4, 1.5);
    const neck = new THREE.Mesh(neckGeom, material);
    neck.position.set(0, 3, 0);
    neck.rotation.z = -Math.PI / 8;
    neck.castShadow = true;
    headGroup.add(neck);

    const headGeom = new THREE.BoxGeometry(4, 2, 1.5);
    const head = new THREE.Mesh(headGeom, material);
    head.position.set(1.5, 4.5, 0);
    head.rotation.z = Math.PI / 6;
    head.castShadow = true;
    headGroup.add(head);

    const earGeom = new THREE.ConeGeometry(0.5, 1.5, 8);
    const ear = new THREE.Mesh(earGeom, material);
    ear.position.set(-0.5, 5.5, 0);
    ear.rotation.z = Math.PI / 12;
    ear.castShadow = true;
    headGroup.add(ear);

    headGroup.position.y = -1;
    headGroup.rotation.y = Math.PI / 2;
    group.add(headGroup);

    group.scale.set(scale, scale, scale);
    return group;
}

function createStyledBishop(scale: number, color: THREE.Color): THREE.Group {
    const group = new THREE.Group();
    const material = createPieceMaterial(color);

    const points = [
        new THREE.Vector2(0, -3.5),
        new THREE.Vector2(3.2, -3.5),
        new THREE.Vector2(3, -2.5),
        new THREE.Vector2(1.8, 0),
        new THREE.Vector2(2.5, 3),
        new THREE.Vector2(2.5, 4),
        new THREE.Vector2(0, 4)
    ];
    const body = new THREE.LatheGeometry(points, 20);
    const bodyMesh = new THREE.Mesh(body, material);
    bodyMesh.castShadow = true;
    group.add(bodyMesh);

    const head = new THREE.SphereGeometry(1.6 * scale, 16, 16);
    const headMesh = new THREE.Mesh(head, material);
    headMesh.position.y = 4.8 * scale;
    headMesh.castShadow = true;
    group.add(headMesh);
    
    // Mitre cut illusion
    const cutGeom = new THREE.BoxGeometry(0.5 * scale, 2 * scale, 0.5 * scale);
    const cutMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const cut = new THREE.Mesh(cutGeom, cutMat);
    cut.position.y = 5.2 * scale;
    cut.rotation.z = -Math.PI / 4;
    group.add(cut);

    group.scale.set(scale, scale, scale);
    return group;
}

function createStyledQueen(scale: number, color: THREE.Color): THREE.Group {
    const group = new THREE.Group();
    const material = createPieceMaterial(color);

    const points = [
        new THREE.Vector2(0, -3.5),
        new THREE.Vector2(3.8, -3.5),
        new THREE.Vector2(3.5, -2.5),
        new THREE.Vector2(2, 2),
        new THREE.Vector2(3, 4),
        new THREE.Vector2(1, 5),
        new THREE.Vector2(0, 5)
    ];
    const body = new THREE.LatheGeometry(points, 20);
    const bodyMesh = new THREE.Mesh(body, material);
    bodyMesh.castShadow = true;
    group.add(bodyMesh);

    const head = new THREE.SphereGeometry(0.8 * scale, 12, 12);
    const headMesh = new THREE.Mesh(head, material);
    headMesh.position.y = 5.8 * scale;
    headMesh.castShadow = true;
    group.add(headMesh);

    group.scale.set(scale, scale, scale);
    return group;
}

function createStyledKing(scale: number, color: THREE.Color): THREE.Group {
    const group = new THREE.Group();
    const material = createPieceMaterial(color);

    const points = [
        new THREE.Vector2(0, -4),
        new THREE.Vector2(4, -4),
        new THREE.Vector2(3.8, -3),
        new THREE.Vector2(2.5, 2),
        new THREE.Vector2(3, 5),
        new THREE.Vector2(2.8, 6),
        new THREE.Vector2(0, 6)
    ];
    const body = new THREE.LatheGeometry(points, 20);
    const bodyMesh = new THREE.Mesh(body, material);
    bodyMesh.castShadow = true;
    group.add(bodyMesh);

    // Cross
    const crossBarGeom = new THREE.BoxGeometry(2 * scale, 0.7 * scale, 0.7 * scale);
    const crossUpGeom = new THREE.BoxGeometry(0.7 * scale, 2.5 * scale, 0.7 * scale);
    const crossBar = new THREE.Mesh(crossBarGeom, material);
    const crossUp = new THREE.Mesh(crossUpGeom, material);
    crossBar.position.y = 7 * scale;
    crossUp.position.y = 7 * scale;
    crossBar.castShadow = true;
    crossUp.castShadow = true;
    group.add(crossBar);
    group.add(crossUp);

    group.scale.set(scale, scale, scale);
    return group;
}


const PIECE_GENERATORS: { [key in Piece['type']]: (color: THREE.Color) => THREE.Group } = {
    R: (color) => createStyledRook(PIECE_SCALE, color),
    N: (color) => createStyledKnight(PIECE_SCALE, color),
    B: (color) => createStyledBishop(PIECE_SCALE, color),
    Q: (color) => createStyledQueen(PIECE_SCALE, color),
    K: (color) => createStyledKing(PIECE_SCALE, color),
    P: (color) => createStyledPawn(PIECE_SCALE, color),
};

export function createPieceMesh(pieceData: Piece): THREE.Group {
    const color = pieceData.color === 'white' ? WHITE_COLOR : BLACK_COLOR;
    const generatorFn = PIECE_GENERATORS[pieceData.type];
    const pieceMesh = generatorFn(color);
    const worldPos = getCellWorldPosition(pieceData.x, pieceData.y, pieceData.z);
    
    // Adjust Y position so pieces sit on the grid lines
    const pieceHeightOffset = 4 * PIECE_SCALE;
    worldPos.y += pieceHeightOffset;
    
    pieceMesh.position.copy(worldPos);
    pieceMesh.userData = pieceData;
    pieceMesh.name = `piece_${pieceData.x}_${pieceData.y}_${pieceData.z}`;
    pieceMesh.traverse(child => {
        if (child instanceof THREE.Mesh) {
            child.userData = pieceData;
            child.castShadow = true;
        }
    });
    return pieceMesh;
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