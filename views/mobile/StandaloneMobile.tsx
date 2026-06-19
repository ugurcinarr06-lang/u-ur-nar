import React, { useEffect, useRef, useState } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { MobileApp } from './MobileApp';
import { Product } from '../../types';

interface Props {
  peerId: string;
}

export const StandaloneMobile: React.FC<Props> = ({ peerId }) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [errorMsg, setErrorMsg] = useState('');
  const connRef = useRef<DataConnection | null>(null);
  // Ref kullan — closure içinde state değeri stale olur
  const connectedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const peer = new Peer();

    peer.on('open', () => {
      const conn = peer.connect(peerId, { reliable: true });
      connRef.current = conn;

      conn.on('open', () => {
        connectedRef.current = true;
        clearTimeout(timeoutRef.current); // timeout'u iptal et
        setStatus('connected');
      });

      conn.on('close', () => {
        // Aynanın bağlantısı kesildi (sayfa yenilendi vs.)
        if (connectedRef.current) {
          connectedRef.current = false;
          setStatus('disconnected');
        }
      });

      conn.on('error', () => {
        if (!connectedRef.current) {
          setErrorMsg('Aynaya bağlanılamadı. QR kodu tekrar okutun.');
          setStatus('error');
        }
      });
    });

    peer.on('error', (err) => {
      if (!connectedRef.current) {
        setErrorMsg('Bağlantı hatası: ' + err.type);
        setStatus('error');
      }
    });

    // 15 saniye içinde bağlanamazsa hata göster
    timeoutRef.current = setTimeout(() => {
      if (!connectedRef.current) {
        setErrorMsg('Bağlantı zaman aşımına uğradı. Aynada QR kodun hâlâ açık olduğundan emin olun.');
        setStatus('error');
      }
    }, 15000);

    return () => {
      clearTimeout(timeoutRef.current);
      peer.destroy();
    };
  }, [peerId]);

  const handleProductSelect = (product: Product, colorId: string, size: string) => {
    connRef.current?.send({ type: 'SELECT', product, colorId, size });
  };

  const handleRotate = (rotation: number) => {
    connRef.current?.send({ type: 'ROTATE', rotation });
  };

  if (status === 'connecting') {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-6"
        style={{ background: '#080808' }}>
        <div className="relative">
          <div className="absolute -inset-6 rounded-full animate-pulse"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12), transparent)' }} />
          <div className="text-6xl">🪞</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold text-blue-400 mb-1">Aynaya Bağlanıyor...</div>
          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Lütfen bekleyin</div>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-blue-400"
              style={{ animation: `body-track 1.2s ${i * 0.2}s ease-in-out infinite` }} />
          ))}
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-6 px-8 text-center"
        style={{ background: '#080808' }}>
        <div className="text-5xl">🔗</div>
        <div>
          <div className="text-sm font-semibold text-red-400 mb-2">Bağlantı Başarısız</div>
          <div className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{errorMsg}</div>
        </div>
        <button
          className="px-6 py-2.5 rounded-xl text-sm font-semibold btn-primary"
          onClick={() => window.location.reload()}>
          Tekrar Dene
        </button>
      </div>
    );
  }

  if (status === 'disconnected') {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-6 px-8 text-center"
        style={{ background: '#080808' }}>
        <div className="text-5xl">🪞</div>
        <div>
          <div className="text-sm font-semibold text-orange-400 mb-2">Ayna Bağlantısı Kesildi</div>
          <div className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Aynadaki sayfa yenilenmiş olabilir. Yeni QR kodu okutun.
          </div>
        </div>
        <button
          className="px-6 py-2.5 rounded-xl text-sm font-semibold btn-primary"
          onClick={() => window.location.reload()}>
          Yeniden Bağlan
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: '100dvh', background: '#080808' }}>
      <div className="flex items-center justify-center gap-2 py-1.5 flex-shrink-0"
        style={{ background: 'rgba(34,197,94,0.08)', borderBottom: '1px solid rgba(34,197,94,0.2)' }}>
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs font-medium text-green-400">Aynayla Bağlı — Ürün seçin, aynada görün</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <MobileApp
          onProductSelect={handleProductSelect}
          onSessionConnect={() => {}}
          sessionActive={true}
          onRotate={handleRotate}
        />
      </div>
    </div>
  );
};
