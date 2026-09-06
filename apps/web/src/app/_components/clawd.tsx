'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';

interface ClawdProps {
  size?: number;
}

// Claude person oficial — mascote 3D do Claude (Anthropic)
// 3 camadas separadas: corpo (estático) + 2 olhos (independentes que seguem o mouse)
// Imagens em /public/mascots/:
//   - claude-body.png (corpo sem fundo, sem olhos)
//   - eye-left.png   (olho esquerdo recortado)
//   - eye-right.png  (olho direito recortado)
export function Clawd({ size = 240 }: ClawdProps) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<'normal' | 'celebrate' | 'squish'>('normal');
  const [clickBursts, setClickBursts] = useState<Array<{ id: number; x: number; y: number; emoji: string }>>([]);
  const burstId = useRef(0);
  const celebrateTimer = useRef<NodeJS.Timeout | null>(null);

  // Track mouse / touch
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      let cx: number;
      let cy: number;
      if ('touches' in e && e.touches.length > 0) {
        cx = e.touches[0]!.clientX;
        cy = e.touches[0]!.clientY;
      } else if ('clientX' in e) {
        cx = e.clientX;
        cy = e.clientY;
      } else {
        return;
      }
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
      const emojis: string[] = ['✨', '⭐', '💥', '🎉', '🤖', '🚀'];
      const emoji: string = emojis[Math.floor(Math.random() * emojis.length)] ?? '✨';
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

  // === Body 3D parallax (sutil — só o corpo inclina um pouco) ===
  const maxBodyRotate = 10; // degrees — sutil pra não exagerar
  const rotateY = mouse.x * maxBodyRotate;
  const rotateX = -mouse.y * maxBodyRotate;
  const shadowX = -mouse.x * 30;
  const shadowY = -mouse.y * 30;

  // === Eye tracking (PRINCIPAL movimento) ===
  // Olhos se movem ±10px em X, ±6px em Y seguindo o mouse
  const eyeOffsetX = mouse.x * 10;
  const eyeOffsetY = mouse.y * 6;

  // Body transform based on mode
  let bodyTransform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  if (mode === 'celebrate') {
    bodyTransform = `perspective(900px) rotateX(-12deg) translateY(-22px) scale(1.08)`;
  } else if (mode === 'squish') {
    bodyTransform = `perspective(900px) rotateX(${rotateX * 0.3}deg) rotateY(${rotateY * 0.3}deg) scaleY(0.6) scaleX(1.18) translateY(12px)`;
  }

  const containerStyle: CSSProperties = {
    position: 'relative',
    width: size,
    height: size * (516 / 387), // Maintain aspect ratio
    perspective: 900,
    transformStyle: 'preserve-3d',
  };

  const bodyStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    transform: bodyTransform,
    transition: mode === 'celebrate' || mode === 'squish'
      ? 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
      : 'transform 0.3s ease-out',
    filter: `drop-shadow(${shadowX}px ${shadowY}px 22px rgba(232, 93, 31, 0.45))
             drop-shadow(${shadowX * 0.3}px ${shadowY * 0.3}px 8px rgba(0, 0, 0, 0.3))`,
    willChange: 'transform',
    userSelect: 'none',
    pointerEvents: 'none',
  };

  // Eye dimensions (90x90 PNG with eye centered, has padding for movement)
  const eyeW = size * 90 / 387;
  const eyeH = eyeW;
  // Position relative to image: 387x516 original
  // Left eye center at (134, 214), Right eye at (280, 206) — verified from PNG analysis
  const eyeLeftX = (134 / 387) * size - eyeW / 2;
  const eyeLeftY = (214 / 516) * size * (516 / 387) - eyeH / 2;
  const eyeRightX = (280 / 387) * size - eyeW / 2;
  const eyeRightY = (206 / 516) * size * (516 / 387) - eyeH / 2;

  const makeEyeStyle = (): CSSProperties => ({
    position: 'absolute',
    width: eyeW,
    height: eyeH,
    pointerEvents: 'none',
    transform: `translate(${eyeOffsetX}px, ${eyeOffsetY}px)`,
    transition: 'transform 0.15s ease-out',
    willChange: 'transform',
  });

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

      <div style={containerStyle}>
        {/* Body layer (no eyes, no background) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mascots/claude-body.png"
          alt="Claude body"
          draggable={false}
          style={bodyStyle}
        />

        {/* Left eye — moves independently */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mascots/eye-left.png"
          alt=""
          draggable={false}
          aria-hidden
          style={{
            ...makeEyeStyle(),
            left: eyeLeftX,
            top: eyeLeftY,
          }}
        />

        {/* Right eye — moves independently */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mascots/eye-right.png"
          alt=""
          draggable={false}
          aria-hidden
          style={{
            ...makeEyeStyle(),
            left: eyeRightX,
            top: eyeRightY,
          }}
        />

        {/* Mood indicator */}
        {mode === 'celebrate' && (
          <div
            className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap animate-bounce rounded-full bg-brasa-500 px-3 py-1 text-xs font-bold text-white shadow-glow"
            style={{ zIndex: 10 }}
          >
            🤖 yay!
          </div>
        )}
        {mode === 'squish' && (
          <div
            className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-warn px-3 py-1 text-xs font-bold text-bg shadow-lg"
            style={{ zIndex: 10 }}
          >
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
