import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { Product } from '../../types';
import { loadModel } from '../../utils/modelStore';

interface Props {
  product: Product;
  rotationDeg: number;
}

// Kategori bazlı model dikey ofseti (sahnedeki Y ekseni, birim = yaklaşık vücut yüksekliği)
function getCategoryYOffset(categoryId: string): number {
  switch (categoryId) {
    case 'cat-1': return  0.45;  // T-shirt — göğüs hizası
    case 'cat-2': return  0.45;  // Gömlek
    case 'cat-3': return  0.05;  // Elbise — orta
    case 'cat-4': return  0.42;  // Ceket
    case 'cat-5': return  0.05;  // Takım — tam boy
    case 'cat-6': return -1.6;   // Ayakkabı — alt
    case 'cat-7': return  0.9;   // Aksesuar — boyun/omuz
    default:      return  0.45;
  }
}

function getCategoryScale(categoryId: string): number {
  switch (categoryId) {
    case 'cat-1': return 0.9;  // T-shirt
    case 'cat-2': return 0.95; // Gömlek
    case 'cat-3': return 1.35; // Elbise
    case 'cat-4': return 1.0;  // Ceket
    case 'cat-5': return 1.45; // Takım
    case 'cat-6': return 0.55; // Ayakkabı
    case 'cat-7': return 0.6;  // Aksesuar
    default:      return 1.0;
  }
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

const ThreeDGarmentViewer: React.FC<Props> = ({ product, rotationDeg }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animRef   = useRef<number>(0);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError]   = React.useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || !product.modelUrl) return;

    setLoaded(false);
    setError(false);

    const w = container.clientWidth  || 240;
    const h = container.clientHeight || 420;

    // ── Scene ────────────────────────────────────────────────────
    const scene = new THREE.Scene();

    // ── Camera ───────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.01, 200);
    camera.position.set(0, 0, 6);

    // ── Renderer ─────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ── Işıklar ──────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 1.4));
    const key = new THREE.DirectionalLight(0xfff8f0, 2.2);
    key.position.set(2, 5, 4);
    key.castShadow = true;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xddeeff, 0.7);
    fill.position.set(-3, 1, 3);
    scene.add(fill);
    const back = new THREE.DirectionalLight(0xffffff, 0.4);
    back.position.set(0, -3, -4);
    scene.add(back);

    // ── Model Yükle ──────────────────────────────────────────────
    const loader = new FBXLoader();
    let destroyed = false;

    const doLoad = (url: string, isBlob: boolean) => {
      if (destroyed) { if (isBlob) URL.revokeObjectURL(url); return; }
      loader.load(
        url,
        (model) => {
          if (destroyed) return;
          if (isBlob) URL.revokeObjectURL(url);

          const box  = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);

          const targetHeight = 3.2 * getCategoryScale(product.categoryId);
          model.scale.setScalar(targetHeight / maxDim);

          box.setFromObject(model);
          model.position.sub(box.getCenter(new THREE.Vector3()));
          model.position.y += getCategoryYOffset(product.categoryId);

          model.position.y += 2.5;
          let elapsed = 0;
          const dropAnim = setInterval(() => {
            elapsed += 0.06;
            model.position.y = THREE.MathUtils.lerp(model.position.y, getCategoryYOffset(product.categoryId), 0.15);
            if (elapsed > 1.5) clearInterval(dropAnim);
          }, 16);

          scene.add(model);
          modelRef.current = model;
          setLoaded(true);
        },
        undefined,
        () => { if (!destroyed) setError(true); }
      );
    };

    const modelUrl = product.modelUrl!;
    if (modelUrl.startsWith('idb://')) {
      const key = modelUrl.slice(6);
      loadModel(key).then(dataUrl => {
        if (!dataUrl) { if (!destroyed) setError(true); return; }
        doLoad(base64ToObjectURL(dataUrl), true);
      }).catch(() => { if (!destroyed) setError(true); });
    } else if (modelUrl.startsWith('data:')) {
      doLoad(base64ToObjectURL(modelUrl), true);
    } else if (modelUrl.startsWith('blob:')) {
      doLoad(modelUrl, false);
    } else {
      doLoad(modelUrl, false);
    }

    // ── Render Döngüsü ───────────────────────────────────────────
    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      destroyed = true;
      cancelAnimationFrame(animRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      modelRef.current = null;
      rendererRef.current = null;
    };
  }, [product.modelUrl, product.categoryId]);

  // Rotasyon senkronizasyonu
  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y = (rotationDeg * Math.PI) / 180;
    }
  }, [rotationDeg]);

  return (
    <div
      ref={mountRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
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
          <span style={{ fontSize: 11, color: 'rgba(139,92,246,0.8)' }}>3D model yükleniyor...</span>
        </div>
      )}
      {error && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, color: 'rgba(239,68,68,0.7)',
        }}>
          Model yüklenemedi
        </div>
      )}
    </div>
  );
};

export default ThreeDGarmentViewer;
