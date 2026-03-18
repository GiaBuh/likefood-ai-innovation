import React, { useEffect, useRef, useState } from 'react';

/**
 * Smoothly interpolate SVG polygon points using requestAnimationFrame.
 */
const lerpPoints = (from: number[], to: number[], t: number): string => {
  return from
    .map((v, i) => {
      const result = v + (to[i] - v) * t;
      return i % 2 === 0 ? result : result; // x,y pairs
    })
    .reduce((acc, v, i) => {
      if (i % 2 === 0) return [...acc, `${Math.round(v)}`];
      acc[acc.length - 1] += `,${Math.round(v)}`;
      return acc;
    }, [] as string[])
    .join(' ');
};

const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

interface FlapAnim {
  open: number[];
  closed: number[];
  startMs: number;
  durMs: number;
}

const BoxAnimation: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isSliding, setIsSliding] = useState(false);
  const [showSeal, setShowSeal] = useState(false);
  const [statusText, setStatusText] = useState('Đang đóng gói đơn hàng...');

  useEffect(() => {
    const startTime = performance.now();

    // Flap definitions: open points → closed points, start delay, duration
    const flaps: FlapAnim[] = [
      { open: [30,110, 130,160, 130,95, 30,45],    closed: [30,110, 130,160, 130,160, 30,110],  startMs: 400,  durMs: 500 },  // back
      { open: [230,110, 130,160, 130,95, 230,45],   closed: [230,110, 130,160, 130,160, 230,110], startMs: 700,  durMs: 500 },  // right
      { open: [30,110, 130,60, 130,95, 30,145],     closed: [30,110, 130,60, 130,60, 30,110],    startMs: 1000, durMs: 450 },  // left-front
      { open: [230,110, 130,60, 130,95, 230,145],   closed: [230,110, 130,60, 130,60, 230,110],  startMs: 1300, durMs: 450 },  // right-front
    ];

    const flapIds = ['flap-back', 'flap-right', 'flap-left-front', 'flap-right-front'];
    let rafId: number;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const svg = svgRef.current;
      if (!svg) { rafId = requestAnimationFrame(animate); return; }

      flaps.forEach((flap, i) => {
        const el = svg.getElementById(flapIds[i]);
        if (!el) return;

        let t = 0;
        if (elapsed >= flap.startMs + flap.durMs) {
          t = 1;
        } else if (elapsed > flap.startMs) {
          t = easeInOut((elapsed - flap.startMs) / flap.durMs);
        }
        el.setAttribute('points', lerpPoints(flap.open, flap.closed, t));
      });

      // Top face + Tape after last flap done
      const allDone = elapsed >= 1750;
      const topFace = svg.getElementById('top-face');
      const tapeGroup = svg.getElementById('tape-group');
      const checkGroup = svg.getElementById('check-group');
      if (topFace) topFace.setAttribute('opacity', allDone ? '1' : '0');
      if (tapeGroup) tapeGroup.setAttribute('opacity', allDone ? '0.65' : '0');
      if (checkGroup) checkGroup.setAttribute('opacity', allDone && elapsed >= 1900 ? '1' : '0');

      if (elapsed < 2800) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);

    // Seal phase
    const sealTimer = setTimeout(() => {
      setShowSeal(true);
      setStatusText('Gửi đơn hàng thành công! 🎉');
    }, 1900);

    // Slide away phase
    const slideTimer = setTimeout(() => setIsSliding(true), 2500);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(sealTimer);
      clearTimeout(slideTimer);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      style={{ animation: 'boxFadeIn 0.3s ease-out' }}
    >
      <div
        className="flex flex-col items-center gap-6"
        style={{
          transition: isSliding ? 'transform 0.8s ease-in, opacity 0.6s ease-in 0.2s' : 'none',
          transform: isSliding ? 'translateX(120vw) scale(0.85)' : 'scale(1)',
          opacity: isSliding ? 0 : 1,
        }}
      >
        <svg
          ref={svgRef}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 260 280"
          className="w-52 h-52 sm:w-64 sm:h-64 drop-shadow-2xl"
        >
          {/* ── BOX BODY ── */}
          <polygon points="130,160 230,110 230,220 130,270" fill="#c99a6c" stroke="#4a2c0a" strokeWidth="3" strokeLinejoin="round" />
          <polygon points="130,160 30,110 30,220 130,270" fill="#b88655" stroke="#4a2c0a" strokeWidth="3" strokeLinejoin="round" />

          {/* Label */}
          <g transform="translate(62,175) skewY(-26)">
            <rect x="0" y="0" width="48" height="24" rx="3" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1.5" />
            <text x="24" y="16" textAnchor="middle" fill="#15803d" fontSize="8" fontWeight="bold" fontFamily="sans-serif">LIKEFOOD</text>
          </g>

          {/* Shipping marks */}
          <g transform="translate(160,175) skewY(26)">
            <rect x="0" y="0" width="10" height="10" rx="1" fill="none" stroke="#4a2c0a" strokeWidth="1.5" opacity="0.5" />
            <rect x="14" y="0" width="10" height="10" rx="1" fill="none" stroke="#4a2c0a" strokeWidth="1.5" opacity="0.5" />
            <rect x="28" y="0" width="10" height="10" rx="1" fill="none" stroke="#4a2c0a" strokeWidth="1.5" opacity="0.5" />
          </g>

          {/* Inside bottom */}
          <polygon points="30,110 130,160 230,110 130,60" fill="#6b4423" stroke="#4a2c0a" strokeWidth="1" opacity="0.5" />

          {/* ── FLAPS (animated via rAF) ── */}
          <polygon id="flap-back" points="30,110 130,160 130,95 30,45" fill="#d4a373" stroke="#4a2c0a" strokeWidth="3" strokeLinejoin="round" />
          <polygon id="flap-right" points="230,110 130,160 130,95 230,45" fill="#e0bc8a" stroke="#4a2c0a" strokeWidth="3" strokeLinejoin="round" />
          <polygon id="flap-left-front" points="30,110 130,60 130,95 30,145" fill="#ddb07a" stroke="#4a2c0a" strokeWidth="3" strokeLinejoin="round" />
          <polygon id="flap-right-front" points="230,110 130,60 130,95 230,145" fill="#e8c494" stroke="#4a2c0a" strokeWidth="3" strokeLinejoin="round" />

          {/* ── TOP FACE ── */}
          <polygon id="top-face" points="30,110 130,160 230,110 130,60" fill="#e8c494" stroke="#4a2c0a" strokeWidth="3" strokeLinejoin="round" opacity="0" />

          {/* ── TAPE ── */}
          <g id="tape-group" opacity="0">
            <polygon points="120,72 140,72 140,148 120,148" fill="rgba(255,255,255,0.6)" />
            <polygon points="140,148 140,178 158,168 158,138" fill="rgba(255,255,255,0.5)" />
            <polygon points="120,148 120,178 102,168 102,138" fill="rgba(255,255,255,0.5)" />
          </g>

          {/* ── CHECKMARK ── */}
          <g id="check-group" opacity="0">
            <circle cx="130" cy="110" r="20" fill="#22c55e" opacity="0.9" />
            <polyline points="120,110 127,118 142,102" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>

        <div className="text-white font-medium text-base sm:text-lg flex items-center gap-2 drop-shadow-lg">
          <span className={`material-symbols-outlined text-orange-400 !text-xl ${!showSeal ? 'animate-spin' : ''}`}>
            {showSeal ? 'check_circle' : 'autorenew'}
          </span>
          <span>{statusText}</span>
        </div>
      </div>

      <style>{`
        @keyframes boxFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default BoxAnimation;
