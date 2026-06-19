import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { USDLoader } from 'three/examples/jsm/loaders/USDLoader.js';

interface Props {
  mannequinUrl: string;
  rotationDeg: number;
}

function base64ToObjectURL(dataUrl: string): string {
  const parts = dataUrl.split(',');
  const base64 = parts.length > 1 ? parts[1] : parts[0];
  const bytes = atob(base64);
  const buf = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
  const blob = new Blob([buf], { type: 'application/octet-stream' });
  return URL.createObjectURL(blob);
}

const ThreeDMannequinViewer: React.FC<Props> = ({ mannequinUrl, rotationDeg }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animRef = useRef<number>(0);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || !mannequinUrl) return;

    setLoaded(false);
    setError(false);

    const w = container.clientWidth || 240;
    const h = container.clientHeight || 420;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.01, 200);
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(new THREE.AmbientLight(0xffffff, 1.6));
    const key = new THREE.DirectionalLight(0xfff8f0, 2.0);
    key.position.set(2, 5, 4);
    key.castShadow = true;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xddeeff, 0.8);
    fill.position.set(-3, 1, 3);
    scene.add(fill);
    const back = new THREE.DirectionalLight(0xffffff, 0.4);
    back.position.set(0, -3, -4);
    scene.add(back);

    const loader = new USDLoader();
    let destroyed = false;
    let objUrl = '';

    if (mannequinUrl.startsWith('data:')) {
      objUrl = base64ToObjectURL(mannequinUrl);
    } else {
      objUrl = mannequinUrl;
    }

    loader.load(
      objUrl,
      (model) => {
        if (destroyed) return;
        if (objUrl !== mannequinUrl) URL.revokeObjectURL(objUrl);

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        model.scale.setScalar(4.2 / maxDim);

        box.setFromObject(model);
        model.position.sub(box.getCenter(new THREE.Vector3()));

        scene.add(model);
        modelRef.current = model;
        setLoaded(true);
      },
      undefined,
      () => { if (!destroyed) setError(true); }
    );

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      destroyed = true;
      cancelAnimationFrame(animRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      modelRef.current = null;
      rendererRef.current = null;
    };
  }, [mannequinUrl]);

  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y = (rotationDeg * Math.PI) / 180;
    }
  }, [rotationDeg]);

  return (
    <div ref={mountRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {!loaded && !error && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 8,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '3px solid transparent',
            borderTopColor: '#8b5cf6', borderRightColor: '#3b82f6',
            animation: 'spin 0.8s linear infinite',
          }} />
          <span style={{ fontSize: 11, color: 'rgba(139,92,246,0.8)' }}>3D manken yükleniyor...</span>
        </div>
      )}
      {error && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, color: 'rgba(239,68,68,0.7)',
        }}>
          Manken yüklenemedi
        </div>
      )}
    </div>
  );
};

export default ThreeDMannequinViewer;
