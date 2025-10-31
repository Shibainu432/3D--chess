import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import type { Piece, Move, BoardState } from '../types';
import { create3DBoard, createPieceMesh, getCellWorldPosition, loadAssets } from '../lib/threeUtils';
import { CELL_SIZE } from '../types';

interface ThreeSceneProps {
  boardState: BoardState;
  selectedPiece: Piece | null;
  validMoves: Move[];
}

const ThreeScene: React.FC<ThreeSceneProps> = ({ boardState, selectedPiece, validMoves }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const piecesGroupRef = useRef<THREE.Group | null>(null);
  const movesGroupRef = useRef<THREE.Group | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const pieceModelsRef = useRef<Record<string, THREE.Object3D> | null>(null);
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;
    const currentMount = mountRef.current;

    // Basic Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a202c);
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.set(70, 70, 70);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    currentMount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(100, 100, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Board and groups
    const boardGroup = new THREE.Group();
    scene.add(boardGroup);
    create3DBoard(boardGroup);
    
    const piecesGroup = new THREE.Group();
    piecesGroup.name = 'ChessPieces';
    boardGroup.add(piecesGroup);
    piecesGroupRef.current = piecesGroup;

    const movesGroup = new THREE.Group();
    movesGroup.name = 'MoveVisualizations';
    boardGroup.add(movesGroup);
    movesGroupRef.current = movesGroup;

    // Asset Loading
    loadAssets().then(models => {
        pieceModelsRef.current = models;
        setAssetsLoaded(true);
    }).catch(error => {
        console.error("Failed to load 3D assets:", error);
    });
    
    // Controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    const onMouseDown = (e: MouseEvent) => { isDragging = true; previousMousePosition = { x: e.clientX, y: e.clientY }; };
    const onMouseUp = () => { isDragging = false; };
    const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;
        boardGroup.rotation.y += deltaX * 0.005;
        boardGroup.rotation.x += deltaY * 0.005;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    };
    const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        const zoomFactor = 1.05;
        if (e.deltaY > 0) camera.position.multiplyScalar(zoomFactor);
        else camera.position.divideScalar(zoomFactor);
        camera.lookAt(0,0,0);
    };
    
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mouseleave', onMouseUp);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    
    // Resize handler
    const handleResize = () => {
        if (!currentMount) return;
        camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mouseleave', onMouseUp);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('wheel', onWheel);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Sync pieces with boardState
  useEffect(() => {
    if (!assetsLoaded || !pieceModelsRef.current) return;
    const piecesGroup = piecesGroupRef.current;
    if (!piecesGroup) return;

    while (piecesGroup.children.length) piecesGroup.remove(piecesGroup.children[0]);
    
    const models = pieceModelsRef.current;
    boardState.forEach(plane => plane.forEach(row => row.forEach(piece => {
      if (piece) {
        const mesh = createPieceMesh(piece, models);
        piecesGroup.add(mesh);
      }
    })));
  }, [boardState, assetsLoaded]);

  // Highlight selected piece
  useEffect(() => {
    piecesGroupRef.current?.children.forEach(child => {
        const pieceMesh = child as THREE.Group;
        pieceMesh.traverse(subChild => {
            if (subChild instanceof THREE.Mesh && subChild.material instanceof THREE.MeshStandardMaterial) {
                const isSelected = selectedPiece && pieceMesh.userData.x === selectedPiece.x && pieceMesh.userData.y === selectedPiece.y && pieceMesh.userData.z === selectedPiece.z;
                subChild.material.emissive.setHex(isSelected ? 0x00ff00 : 0x000000);
            }
        });
    });
  }, [selectedPiece]);

  // Visualize valid moves
  useEffect(() => {
    const movesGroup = movesGroupRef.current;
    if (!movesGroup) return;

    while (movesGroup.children.length) movesGroup.remove(movesGroup.children[0]);

    const moveGeom = new THREE.SphereGeometry(CELL_SIZE * 0.15, 8, 8);
    const captureGeom = new THREE.TorusGeometry(CELL_SIZE * 0.4, CELL_SIZE * 0.05, 8, 16);
    const moveMat = new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.7, depthWrite: false });
    const captureMat = new THREE.MeshBasicMaterial({ color: 0xf87171, transparent: true, opacity: 0.7, depthWrite: false });
    
    validMoves.forEach(move => {
      const worldPos = getCellWorldPosition(move.x, move.y, move.z);
      let mesh;
      if (move.capture) {
        mesh = new THREE.Mesh(captureGeom, captureMat);
        mesh.rotation.x = Math.PI / 2;
      } else {
        mesh = new THREE.Mesh(moveGeom, moveMat);
      }
      mesh.position.copy(worldPos);
      mesh.renderOrder = 1; // Render on top of board grid
      movesGroup.add(mesh);
    });

  }, [validMoves]);

  return (
    <div className="w-full h-full relative">
      {!assetsLoaded && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-10">
          <p className="text-xl text-white animate-pulse">Loading 3D Models...</p>
        </div>
      )}
      <div id="game-container" ref={mountRef} className="w-full h-full" />
    </div>
  );
};

export default ThreeScene;