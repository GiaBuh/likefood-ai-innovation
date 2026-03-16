import React, { createContext, useContext, useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// ─── Types ──────────────────────────────────────────────────────────
interface FlyItem {
  id: string;
  imageUrl: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface FlyToCartContextType {
  /** Ref to attach to the cart icon element */
  cartIconRef: React.RefObject<HTMLElement | null>;
  /** Trigger fly animation from a source position */
  triggerFly: (imageUrl: string, sourceRect: DOMRect) => void;
}

const FlyToCartContext = createContext<FlyToCartContextType | undefined>(undefined);

export const useFlyToCart = () => {
  const ctx = useContext(FlyToCartContext);
  if (!ctx) throw new Error('useFlyToCart must be used within FlyToCartProvider');
  return ctx;
};

// ─── Overlay ────────────────────────────────────────────────────────
const FlyToCartOverlay: React.FC<{ items: FlyItem[]; onComplete: (id: string) => void }> = ({ items, onComplete }) => {
  return createPortal(
    <>
      {items.map((item) => (
        <FlyingItem key={item.id} item={item} onComplete={() => onComplete(item.id)} />
      ))}
    </>,
    document.body
  );
};

const FlyingItem: React.FC<{ item: FlyItem; onComplete: () => void }> = ({ item, onComplete }) => {
  const ref = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const dx = item.endX - item.startX;
    const dy = item.endY - item.startY;

    // Create parabolic arc keyframes
    const keyframes: Keyframe[] = [];
    const steps = 30;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Parabolic arc: x linear, y with arc
      const x = item.startX + dx * t;
      // Arc height: peaks at t=0.3 (feels more natural)
      const arcHeight = -Math.sin(t * Math.PI) * Math.min(150, Math.abs(dy) * 0.5 + 80);
      const y = item.startY + dy * t + arcHeight;
      const scale = 1 - t * 0.75; // shrink from 1 to 0.25
      const opacity = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3; // fade out in last 30%
      keyframes.push({
        transform: `translate(${x}px, ${y}px) scale(${scale})`,
        opacity,
      });
    }

    const animation = el.animate(keyframes, {
      duration: 650,
      easing: 'ease-in',
      fill: 'forwards',
    });

    animation.onfinish = onComplete;

    return () => animation.cancel();
  }, [item, onComplete]);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 99999,
        pointerEvents: 'none',
        willChange: 'transform, opacity',
      }}
    >
      <div
        style={{
          width: 50,
          height: 50,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          border: '2px solid white',
        }}
      >
        <img
          src={item.imageUrl}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          draggable={false}
        />
      </div>
    </div>
  );
};

// ─── Provider ───────────────────────────────────────────────────────
export const FlyToCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cartIconRef = useRef<HTMLElement | null>(null);
  const [flyItems, setFlyItems] = useState<FlyItem[]>([]);

  const triggerFly = useCallback(
    (imageUrl: string, sourceRect: DOMRect) => {
      const cartEl = cartIconRef.current;
      if (!cartEl) return;

      const cartRect = cartEl.getBoundingClientRect();
      const id = `fly-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      setFlyItems((prev) => [
        ...prev,
        {
          id,
          imageUrl: imageUrl || '',
          startX: sourceRect.left + sourceRect.width / 2 - 25, // center the 50px item
          startY: sourceRect.top + sourceRect.height / 2 - 25,
          endX: cartRect.left + cartRect.width / 2 - 25,
          endY: cartRect.top + cartRect.height / 2 - 25,
        },
      ]);
    },
    []
  );

  const handleComplete = useCallback((id: string) => {
    setFlyItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return (
    <FlyToCartContext.Provider value={{ cartIconRef, triggerFly }}>
      {children}
      <FlyToCartOverlay items={flyItems} onComplete={handleComplete} />
    </FlyToCartContext.Provider>
  );
};

export default FlyToCartProvider;
