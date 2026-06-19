import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileView, Product } from '../../types';
import { PRODUCTS, CATEGORIES } from '../../data';

interface Props {
  onProductSelect: (p: Product, colorId: string, size: string) => void;
  onSessionConnect: () => void;
  sessionActive: boolean;
  onRotate?: (rotation: number) => void;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(s => (
      <span key={s} className="text-xs" style={{ color: s <= Math.round(rating) ? '#f59e0b' : 'rgba(255,255,255,0.2)' }}>★</span>
    ))}
  </div>
);

const ProductCard: React.FC<{ product: Product; onTap: () => void; isFav: boolean; onFav: () => void }> = ({ product, onTap, isFav, onFav }) => (
  <motion.div
    className="rounded-2xl overflow-hidden cursor-pointer ripple"
    style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}
    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
    onClick={onTap}
  >
    {/* Product visual */}
    <div className={`relative h-40 bg-gradient-to-br ${product.imageGradient} flex items-center justify-center`}>
      {product.isNew && (
        <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">NEW</div>
      )}
      {product.originalPrice && (
        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          -{Math.round((1 - product.price / product.originalPrice) * 100)}%
        </div>
      )}
      <button
        className="absolute top-2 right-2 w-8 h-8 rounded-full glass flex items-center justify-center"
        onClick={e => { e.stopPropagation(); onFav(); }}
      >
        <span className="text-sm">{isFav ? '❤️' : '🤍'}</span>
      </button>
      <div className="text-5xl opacity-80">{CATEGORIES.find(c => c.id === product.categoryId)?.icon ?? '👗'}</div>
      <div className="absolute bottom-2 right-2 glass rounded-lg px-2 py-1">
        <span className="text-xs font-mono text-blue-400">{product.tryOnCount.toLocaleString()} try-ons</span>
      </div>
    </div>
    {/* Info */}
    <div className="p-3">
      <p className="text-xs opacity-40 font-medium uppercase tracking-wider truncate">{product.brand}</p>
      <p className="text-sm font-semibold mt-0.5 truncate">{product.name}</p>
      <div className="flex items-center justify-between mt-2">
        <div>
          <span className="text-base font-bold text-blue-400">{product.currency}{product.price}</span>
          {product.originalPrice && (
            <span className="text-xs line-through opacity-30 ml-1">{product.currency}{product.originalPrice}</span>
          )}
        </div>
        <StarRating rating={product.rating} />
      </div>
      {/* Color swatches */}
      <div className="flex gap-1 mt-2">
        {product.colors.slice(0, 5).map(c => (
          <div key={c.id} className="w-4 h-4 rounded-full border border-white/20" style={{ background: c.hex }} title={c.name} />
        ))}
        {product.colors.length > 5 && <span className="text-xs opacity-30 ml-1">+{product.colors.length - 5}</span>}
      </div>
    </div>
  </motion.div>
);

const ProductDetail: React.FC<{
  product: Product;
  onBack: () => void;
  onTryOn: (colorId: string, size: string) => void;
  isFav: boolean;
  onFav: () => void;
}> = ({ product, onBack, onTryOn, isFav, onFav }) => {
  const [selectedColorId, setSelectedColorId] = useState(product.colors[0]?.id ?? '');
  const [selectedSize, setSelectedSize] = useState('');
  const [tryOnSent, setTryOnSent] = useState(false);

  const handleTryOn = () => {
    if (!selectedSize) return;
    onTryOn(selectedColorId, selectedSize);
    setTryOnSent(true);
    setTimeout(() => setTryOnSent(false), 3000);
  };

  return (
    <div className="flex flex-col h-full" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button className="w-9 h-9 rounded-xl glass flex items-center justify-center" onClick={onBack}>
          <span className="text-base">←</span>
        </button>
        <span className="text-sm font-semibold">Product Details</span>
        <button className="w-9 h-9 rounded-xl glass flex items-center justify-center" onClick={onFav}>
          <span className="text-base">{isFav ? '❤️' : '🤍'}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Product image */}
        <div className={`h-56 bg-gradient-to-br ${product.imageGradient} flex items-center justify-center relative`}>
          <div className="text-8xl opacity-90">{CATEGORIES.find(c => c.id === product.categoryId)?.icon ?? '👗'}</div>
          <div className="absolute bottom-3 right-3 glass rounded-full px-3 py-1.5">
            <span className="text-xs font-semibold text-blue-400">★ {product.rating} ({product.reviewCount})</span>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest opacity-40">{product.brand}</p>
            <h2 className="text-xl font-bold mt-1">{product.name}</h2>
            <p className="text-sm mt-2 leading-relaxed opacity-60">{product.description}</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-blue-400">{product.currency}{product.price.toLocaleString()}</span>
            {product.originalPrice && (
              <span className="text-base line-through opacity-30">{product.currency}{product.originalPrice}</span>
            )}
            {product.originalPrice && (
              <span className="text-sm font-bold text-red-400">
                -{Math.round((1 - product.price / product.originalPrice) * 100)}%
              </span>
            )}
          </div>

          {/* Colors */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Color</p>
              <p className="text-sm opacity-50">{product.colors.find(c => c.id === selectedColorId)?.name}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.colors.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedColorId(c.id)}
                  className="w-9 h-9 rounded-full transition-transform duration-150"
                  style={{
                    background: c.hex,
                    border: selectedColorId === c.id ? '2px solid #3b82f6' : '2px solid rgba(255,255,255,0.15)',
                    transform: selectedColorId === c.id ? 'scale(1.15)' : 'scale(1)',
                    boxShadow: selectedColorId === c.id ? `0 0 12px ${c.hex}88` : 'none',
                  }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Sizes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Size</p>
              {!selectedSize && <p className="text-xs text-orange-400">Select a size</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150"
                  style={{
                    background: selectedSize === s ? '#3b82f6' : 'rgba(255,255,255,0.06)',
                    border: selectedSize === s ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
                    color: selectedSize === s ? 'white' : 'rgba(255,255,255,0.7)',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: '🪞', label: 'Try-Ons', value: product.tryOnCount.toLocaleString() },
              { icon: '❤️', label: 'Favorites', value: product.favoriteCount.toLocaleString() },
              { icon: '⭐', label: 'Rating', value: `${product.rating}/5` },
            ].map(stat => (
              <div key={stat.label} className="glass rounded-xl p-3 text-center"
                style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-xl mb-1">{stat.icon}</div>
                <div className="text-sm font-bold">{stat.value}</div>
                <div className="text-xs opacity-40">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="p-4 flex flex-col gap-2 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}>
        <AnimatePresence mode="wait">
          {tryOnSent ? (
            <motion.div key="sent"
              className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2"
              style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)' }}
              initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
              <span className="text-green-400 font-semibold">✓ Showing on Mirror!</span>
            </motion.div>
          ) : (
            <motion.button key="try"
              className="w-full py-3.5 rounded-2xl font-semibold btn-primary"
              style={{ opacity: selectedSize ? 1 : 0.5 }}
              onClick={handleTryOn}
              disabled={!selectedSize}
              whileTap={{ scale: 0.98 }}>
              🪞 Try On Mirror
            </motion.button>
          )}
        </AnimatePresence>
        <button className="w-full py-3 rounded-2xl text-sm font-medium glass"
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          🛒 Add to Cart
        </button>
      </div>
    </div>
  );
};

export const MobileApp: React.FC<Props> = ({ onProductSelect, onSessionConnect, sessionActive, onRotate }) => {
  const [view, setView] = useState<MobileView>(sessionActive ? 'CATALOG' : 'SESSION_SCAN');
  const [activeCatId, setActiveCatId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cartItems, setCartItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [tryOnActive, setTryOnActive] = useState(false);
  const [tryOnProduct, setTryOnProduct] = useState<Product | null>(null);
  const [localRotation, setLocalRotation] = useState(0);

  const handleRotationChange = (delta: number) => {
    const next = Math.max(-2, Math.min(2, localRotation + delta));
    setLocalRotation(next);
    onRotate?.(next);
  };

  const resetRotation = () => {
    setLocalRotation(0);
    onRotate?.(0);
  };

  const filteredProducts = PRODUCTS.filter(p => {
    const matchCat = !activeCatId || p.categoryId === activeCatId;
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // Standalone modda sessionActive=true ile mount olursa doğrudan kataloga geç
  useEffect(() => {
    if (sessionActive && view === 'SESSION_SCAN') {
      setView('CATALOG');
    }
  }, [sessionActive]);

  const handleConnect = () => {
    setConnecting(true);
    onSessionConnect();
    setTimeout(() => {
      setConnecting(false);
      setView('CATALOG');
    }, 1500);
  };

  const toggleFav = (id: string) => setFavorites(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);

  return (
    <div className="flex flex-col h-full" style={{ background: '#0a0a0a' }}>
      <AnimatePresence mode="wait">

        {/* SESSION SCAN */}
        {view === 'SESSION_SCAN' && (
          <motion.div key="scan" className="flex-1 flex flex-col items-center justify-center gap-8 px-6 text-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="relative">
              <div className="absolute -inset-6 rounded-full animate-pulse"
                style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.1), transparent)' }} />
              <div className="text-7xl">🪞</div>
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">Sirius Mirror</h1>
              <p className="text-base mt-2 font-light" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Your virtual fitting room
              </p>
            </div>
            <div className="glass-strong rounded-2xl p-5 w-full text-left"
              style={{ border: '1px solid rgba(59,130,246,0.2)' }}>
              <p className="text-sm font-semibold mb-3 text-blue-400">How it works</p>
              {[
                { step: '1', text: 'Scan the QR code on the mirror' },
                { step: '2', text: 'Browse the catalog on your phone' },
                { step: '3', text: 'See products on yourself instantly' },
              ].map(s => (
                <div key={s.step} className="flex items-center gap-3 mb-3 last:mb-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: 'rgba(59,130,246,0.2)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>
                    {s.step}
                  </div>
                  <span className="text-sm opacity-70">{s.text}</span>
                </div>
              ))}
            </div>
            <motion.button
              className="w-full py-4 rounded-2xl font-bold text-base btn-primary flex items-center justify-center gap-2"
              onClick={handleConnect}
              whileTap={{ scale: 0.97 }}
              disabled={connecting}
            >
              {connecting ? (
                <><span className="animate-spin">⟳</span> Connecting...</>
              ) : (
                <><span>📷</span> Scan QR & Connect</>
              )}
            </motion.button>
            <button className="text-sm opacity-40 underline" onClick={() => setView('CATALOG')}>
              Demo: Skip QR scan →
            </button>
          </motion.div>
        )}

        {/* CATALOG */}
        {view === 'CATALOG' && (
          <motion.div key="catalog" className="flex flex-col h-full"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            {/* Header */}
            <div className="flex-shrink-0 px-4 pt-4 pb-2">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h1 className="text-xl font-bold gradient-text">Sirius Mirror</h1>
                  <p className="text-xs opacity-40 mt-0.5">LUXE Fifth Avenue</p>
                </div>
                <div className="flex gap-2">
                  <button className="relative w-9 h-9 glass rounded-xl flex items-center justify-center" onClick={() => setView('FAVORITES')}>
                    <span className="text-base">❤️</span>
                    {favorites.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">{favorites.length}</span>
                    )}
                  </button>
                  <button className="relative w-9 h-9 glass rounded-xl flex items-center justify-center" onClick={() => setView('CART')}>
                    <span className="text-base">🛒</span>
                    {cartItems.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">{cartItems.length}</span>
                    )}
                  </button>
                </div>
              </div>
              {/* Search */}
              <div className="relative mb-3">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base opacity-40">🔍</span>
                <input
                  type="text"
                  placeholder="Search products, brands..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }}
                />
              </div>
              {/* Categories */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                <button
                  onClick={() => setActiveCatId(null)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: !activeCatId ? '#3b82f6' : 'rgba(255,255,255,0.06)',
                    border: !activeCatId ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
                    color: !activeCatId ? 'white' : 'rgba(255,255,255,0.6)',
                  }}>
                  All
                </button>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCatId(cat.id === activeCatId ? null : cat.id)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: activeCatId === cat.id ? cat.color : 'rgba(255,255,255,0.06)',
                      border: activeCatId === cat.id ? `1px solid ${cat.color}` : '1px solid rgba(255,255,255,0.08)',
                      color: activeCatId === cat.id ? 'white' : 'rgba(255,255,255,0.6)',
                    }}>
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Products grid */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4">
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3 opacity-40">
                  <span className="text-4xl">🔍</span>
                  <p className="text-sm">No products found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredProducts.map(p => (
                    <ProductCard key={p.id} product={p}
                      onTap={() => { setSelectedProduct(p); setView('PRODUCT_DETAIL'); }}
                      isFav={favorites.includes(p.id)}
                      onFav={() => toggleFav(p.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Rotasyon kontrol çubuğu — deneme aktifken görünür */}
            {tryOnActive && tryOnProduct && (
              <div className="flex-shrink-0 px-4 py-3"
                style={{ borderTop: '1px solid rgba(59,130,246,0.25)', background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)' }}>
                {/* Başlık */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs font-semibold text-green-400">Aynada Deneniyor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs opacity-40 max-w-28 truncate">{tryOnProduct.name}</span>
                    <button
                      className="text-xs opacity-30 hover:opacity-60"
                      onClick={() => { setTryOnActive(false); setTryOnProduct(null); resetRotation(); }}>
                      ✕
                    </button>
                  </div>
                </div>
                {/* Rotasyon butonları */}
                <div className="flex items-center gap-2">
                  <button
                    className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-sm font-medium transition-all active:scale-95"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    onClick={() => handleRotationChange(-1)}>
                    <span style={{ fontSize: 16 }}>↺</span>
                    <span>Sol</span>
                  </button>
                  <button
                    className="w-12 h-10 rounded-xl flex items-center justify-center text-lg transition-all active:scale-95"
                    style={{
                      background: localRotation === 0 ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.06)',
                      border: localRotation === 0 ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.1)',
                    }}
                    onClick={resetRotation}
                    title="Ortala">
                    ⊙
                  </button>
                  <button
                    className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-sm font-medium transition-all active:scale-95"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    onClick={() => handleRotationChange(1)}>
                    <span>Sağ</span>
                    <span style={{ fontSize: 16 }}>↻</span>
                  </button>
                </div>
                {/* Açı göstergesi */}
                <div className="flex items-center justify-center mt-2 gap-1">
                  {[-2,-1,0,1,2].map(pos => (
                    <div key={pos} className="rounded-full transition-all"
                      style={{
                        width: localRotation === pos ? 20 : 6,
                        height: 4,
                        background: localRotation === pos ? '#3b82f6' : 'rgba(255,255,255,0.15)',
                      }} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* PRODUCT DETAIL */}
        {view === 'PRODUCT_DETAIL' && selectedProduct && (
          <motion.div key="detail" className="flex-1 flex flex-col h-full"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <ProductDetail
              product={selectedProduct}
              onBack={() => setView('CATALOG')}
              onTryOn={(colorId, size) => {
                onProductSelect(selectedProduct, colorId, size);
                setTryOnActive(true);
                setTryOnProduct(selectedProduct);
                setLocalRotation(0);
                onRotate?.(0);
                setView('CATALOG');
              }}
              isFav={favorites.includes(selectedProduct.id)}
              onFav={() => toggleFav(selectedProduct.id)}
            />
          </motion.div>
        )}

        {/* FAVORITES */}
        {view === 'FAVORITES' && (
          <motion.div key="favs" className="flex flex-col h-full"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <button className="w-9 h-9 glass rounded-xl flex items-center justify-center" onClick={() => setView('CATALOG')}>←</button>
              <h2 className="text-base font-semibold">Favorites ({favorites.length})</h2>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-4">
              {favorites.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
                  <span className="text-5xl">🤍</span>
                  <p className="text-sm">No favorites yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {PRODUCTS.filter(p => favorites.includes(p.id)).map(p => (
                    <ProductCard key={p.id} product={p}
                      onTap={() => { setSelectedProduct(p); setView('PRODUCT_DETAIL'); }}
                      isFav={true}
                      onFav={() => toggleFav(p.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* CART */}
        {view === 'CART' && (
          <motion.div key="cart" className="flex flex-col h-full"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <button className="w-9 h-9 glass rounded-xl flex items-center justify-center" onClick={() => setView('CATALOG')}>←</button>
              <h2 className="text-base font-semibold">Cart</h2>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-40">
              <span className="text-5xl">🛒</span>
              <p className="text-sm">Your cart is empty</p>
              <button className="text-sm text-blue-400 underline opacity-100" onClick={() => setView('CATALOG')}>Browse products</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
