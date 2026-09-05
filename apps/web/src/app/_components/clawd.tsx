'use client';

import { useEffect, useRef, useState } from 'react';

interface ClawdProps {
  size?: number;
}

// Clawd — o caranguejo mascote do Claude Code (Anthropic)
// Estilo: retro pixel art 8-bit, cores brasa (laranja/vermelho)
export function Clawd({ size = 220 }: ClawdProps) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<'normal' | 'celebrate' | 'squish'>('normal');
  const [clickBursts, setClickBursts] = useState<Array<{ id: number; x: number; y: number; emoji: string }>>([]);
  const burstId = useRef(0);
  const celebrateTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const cx = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const cy = 'touches' in e ? e.touches[0].clientY : e.clientY;
      // Normalize: -1 to 1
      const x = (cx / window.innerWidth - 0.5) * 2;
      const y = (cy / window.innerHeight - 0.5) * 2;
      setMouse({ x, y });
    };
    window.addEventListener('mousemove', handleMove, { passive: true });
    window.addEventListener('touchmove', handleMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
    };
  }, []);

  // Celebrate on click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const id = ++burstId.current;
      const emojis = ['✨', '⭐', '💥', '🎉', '🦀', '🚀'];
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      setClickBursts((prev) => [...prev, { id, x: e.clientX, y: e.clientY, emoji }]);
      setMode('celebrate');
      if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
      celebrateTimer.current = setTimeout(() => setMode('normal'), 1400);
      setTimeout(() => {
        setClickBursts((prev) => prev.filter((b) => b.id !== id));
      }, 1500);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Squish when next section enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target instanceof HTMLElement && entry.target.dataset.squisher === 'true') {
            if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
              setMode('squish');
            } else if (!entry.isIntersecting) {
              setMode('normal');
            }
          }
        }
      },
      { threshold: [0, 0.3, 0.6, 1] },
    );
    document.querySelectorAll('[data-squisher="true"]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Eye/head rotation: max 12deg, follows cursor
  const eyeOffsetX = Math.max(-6, Math.min(6, mouse.x * 6));
  const eyeOffsetY = Math.max(-4, Math.min(4, mouse.y * 4));
  const bodyRotate = Math.max(-8, Math.min(8, mouse.x * 8));

  // Transform based on mode
  let transform = `rotate(${bodyRotate}deg)`;
  if (mode === 'celebrate') {
    transform = 'rotate(0deg) translateY(-20px) scale(1.1)';
  } else if (mode === 'squish') {
    transform = `rotate(${bodyRotate}deg) scaleY(0.55) scaleX(1.15) translateY(8px)`;
  }

  return (
    <>
      {/* Click bursts */}
      <div className="pointer-events-none fixed inset-0 z-40">
        {clickBursts.map((b) => (
          <div
            key={b.id}
            className="absolute animate-burst text-2xl"
            style={{ left: b.x, top: b.y, transform: 'translate(-50%, -50%)' }}
          >
            {b.emoji}
          </div>
        ))}
      </div>

      {/* Clawd mascot */}
      <div
        className="relative transition-transform duration-300 ease-out"
        style={{ width: size, height: size, transform }}
      >
        <svg
          viewBox="0 0 200 200"
          width={size}
          height={size}
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_10px_30px_rgba(232,93,31,0.5)]"
        >
          <defs>
            <radialGradient id="clawd-body" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#FB8B3C" />
              <stop offset="60%" stopColor="#E85D1F" />
              <stop offset="100%" stopColor="#9C3A0F" />
            </radialGradient>
            <radialGradient id="clawd-belly" cx="50%" cy="60%" r="50%">
              <stop offset="0%" stopColor="#FFE7CC" />
              <stop offset="100%" stopColor="#FFB266" />
            </radialGradient>
            <linearGradient id="clawd-claw" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FB8B3C" />
              <stop offset="100%" stopColor="#9C3A0F" />
            </linearGradient>
            <pattern id="clawd-pixel" width="6" height="6" patternUnits="userSpaceOnUse">
              <rect width="6" height="6" fill="transparent" />
              <rect width="3" height="3" fill="#000" opacity="0.05" />
            </pattern>
          </defs>

          {/* Shadow */}
          <ellipse cx="100" cy="180" rx="60" ry="6" fill="#000" opacity="0.4" />

          {/* Legs (4) — back row */}
          <g className={mode === 'squish' ? 'opacity-80' : ''}>
            <rect x="35" y="150" width="14" height="22" rx="6" fill="url(#clawd-claw)" transform="rotate(-25 42 161)" />
            <rect x="151" y="150" width="14" height="22" rx="6" fill="url(#clawd-claw)" transform="rotate(25 158 161)" />
          </g>

          {/* Legs (4) — front row */}
          <g>
            <rect x="58" y="155" width="14" height="20" rx="6" fill="url(#clawd-claw)" transform="rotate(-10 65 165)" />
            <rect x="128" y="155" width="14" height="20" rx="6" fill="url(#clawd-claw)" transform="rotate(10 135 165)" />
          </g>

          {/* Main body — rounded crab shell */}
          <ellipse cx="100" cy="115" rx="70" ry="55" fill="url(#clawd-body)" />

          {/* Shell texture — pixel grid overlay */}
          <ellipse cx="100" cy="115" rx="70" ry="55" fill="url(#clawd-pixel)" opacity="0.3" />

          {/* Shell highlight */}
          <ellipse cx="100" cy="95" rx="55" ry="20" fill="#FFD1A0" opacity="0.4" />

          {/* Belly area */}
          <ellipse cx="100" cy="140" rx="45" ry="25" fill="url(#clawd-belly)" opacity="0.6" />

          {/* Shell line detail */}
          <path
            d="M 50 110 Q 100 95 150 110"
            stroke="#9C3A0F"
            strokeWidth="2"
            fill="none"
            opacity="0.5"
            strokeLinecap="round"
          />

          {/* Claws — left and right, large pincer-style */}
          {/* Left claw arm */}
          <g className={mode === 'celebrate' ? 'origin-bottom-left' : ''} style={{ transformOrigin: '40px 105px' }}>
            <rect
              x="14"
              y="95"
              width="32"
              height="16"
              rx="8"
              fill="url(#clawd-claw)"
              transform="rotate(-15 30 103)"
            />
            {/* Left claw pincer */}
            <g transform="translate(8, 92)">
              <path
                d="M 0 0 Q -10 -8 -8 -16 Q 4 -22 14 -18 L 12 -8 Q 8 -2 0 0 Z"
                fill="url(#clawd-claw)"
                stroke="#6F2A0A"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M 0 6 Q -10 14 -6 22 Q 6 26 16 20 L 14 10 Q 8 6 0 6 Z"
                fill="url(#clawd-claw)"
                stroke="#6F2A0A"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {/* Pincer gap */}
              <line x1="-2" y1="2" x2="14" y2="6" stroke="#6F2A0A" strokeWidth="1" opacity="0.5" />
            </g>
          </g>

          {/* Right claw arm */}
          <g style={{ transformOrigin: '160px 105px' }}>
            <rect
              x="154"
              y="95"
              width="32"
              height="16"
              rx="8"
              fill="url(#clawd-claw)"
              transform="rotate(15 170 103)"
            />
            {/* Right claw pincer — mirrored */}
            <g transform="translate(192, 92) scale(-1, 1)">
              <path
                d="M 0 0 Q -10 -8 -8 -16 Q 4 -22 14 -18 L 12 -8 Q 8 -2 0 0 Z"
                fill="url(#clawd-claw)"
                stroke="#6F2A0A"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M 0 6 Q -10 14 -6 22 Q 6 26 16 20 L 14 10 Q 8 6 0 6 Z"
                fill="url(#clawd-claw)"
                stroke="#6F2A0A"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <line x1="-2" y1="2" x2="14" y2="6" stroke="#6F2A0A" strokeWidth="1" opacity="0.5" />
            </g>
          </g>

          {/* Eyes — large white with pupils that follow mouse */}
          {/* Left eye */}
          <g>
            <ellipse cx="80" cy="90" rx="18" ry="22" fill="#FFFFFF" />
            <ellipse cx="80" cy="90" rx="18" ry="22" fill="none" stroke="#6F2A0A" strokeWidth="2.5" />
            {/* Pupil — moves with mouse */}
            <circle
              cx={80 + eyeOffsetX}
              cy={90 + eyeOffsetY}
              r="6"
              fill="#1A0F08"
            />
            {/* Eye shine */}
            <circle
              cx={82 + eyeOffsetX}
              cy={86 + eyeOffsetY}
              r="2"
              fill="#FFFFFF"
            />
          </g>

          {/* Right eye */}
          <g>
            <ellipse cx="120" cy="90" rx="18" ry="22" fill="#FFFFFF" />
            <ellipse cx="120" cy="90" rx="18" ry="22" fill="none" stroke="#6F2A0A" strokeWidth="2.5" />
            <circle
              cx={120 + eyeOffsetX}
              cy={90 + eyeOffsetY}
              r="6"
              fill="#1A0F08"
            />
            <circle
              cx={122 + eyeOffsetX}
              cy={86 + eyeOffsetY}
              r="2"
              fill="#FFFFFF"
            />
          </g>

          {/* Mouth — small smile, opens when celebrating */}
          {mode === 'celebrate' ? (
            <path
              d="M 88 130 Q 100 145 112 130"
              stroke="#6F2A0A"
              strokeWidth="3"
              fill="#9C3A0F"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M 92 130 Q 100 136 108 130"
              stroke="#6F2A0A"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          )}

          {/* Antennae (small details) */}
          <line x1="85" y1="68" x2="80" y2="55" stroke="#6F2A0A" strokeWidth="2" strokeLinecap="round" />
          <line x1="115" y1="68" x2="120" y2="55" stroke="#6F2A0A" strokeWidth="2" strokeLinecap="round" />
          <circle cx="80" cy="55" r="3" fill="#FFD1A0" />
          <circle cx="120" cy="55" r="3" fill="#FFD1A0" />
        </svg>

        {/* Mood indicator text */}
        {mode === 'celebrate' && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap animate-bounce rounded-full bg-brasa-500 px-3 py-1 text-xs font-bold text-white shadow-glow">
            🦀 yay!
          </div>
        )}
        {mode === 'squish' && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-warn px-3 py-1 text-xs font-bold text-bg shadow-lg">
            aaai, calma! 😅
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes burst {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(0.5) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -100px) scale(1.5) rotate(180deg);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -200px) scale(0.8) rotate(360deg);
          }
        }
        .animate-burst {
          animation: burst 1.5s ease-out forwards;
        }
      `}</style>
    </>
  );
}
