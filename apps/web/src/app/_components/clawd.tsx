'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';

interface ClawdProps {
  size?: number;
}

// Claude person oficial — mascote 3D do Claude (Anthropic)
// 3 camadas separadas: corpo (estático) + 2 olhos (que seguem mouse)
// Container tem fundo gradient sutil pra integrar o highlight 3D original ao tema
export function Clawd({ size = 240 }: ClawdProps) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<'normal' | 'celebrate' | 'squish'>('normal');
  const [clickBursts, setClickBursts] = useState<Array<{ id: number; x: number; y: number; emoji: string }>>([]);
  const burstId = useRef(0);
  const celebrateTimer = useRef<NodeJS.Timeout | null>(null);

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

  // Body tilts ±6° subtly
  const rotateY = mouse.x * 6;
  const rotateX = -mouse.y * 6;
  const shadowX = -mouse.x * 30;
  const shadowY = -mouse.y * 30;

  // Eyes follow cursor ±12px X, ±7px Y
  const eyeOffsetX = mouse.x * 12;
  const eyeOffsetY = mouse.y * 7;

  let bodyTransform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  if (mode === 'celebrate') {
    bodyTransform = `rotateX(-12deg) translateY(-22px) scale(1.08)`;
  } else if (mode === 'squish') {
    bodyTransform = `rotateX(${rotateX * 0.3}deg) rotateY(${rotateY * 0.3}deg) scaleY(0.6) scaleX(1.18) translateY(12px)`;
  }

  const aspect = 516 / 387;
  const containerStyle: CSSProperties = {
    position: 'relative',
    width: size,
    height: size * aspect,
  };

  // Body — drop-shadow + glow that follows cursor (acts as light source)
  const bodyStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    transform: bodyTransform,
    transition: mode === 'celebrate' || mode === 'squish'
      ? 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
      : 'transform 0.4s ease-out',
    filter: `drop-shadow(${shadowX}px ${shadowY}px 30px rgba(232, 93, 31, 0.5))
             drop-shadow(0 12px 24px rgba(0, 0, 0, 0.4))`,
    willChange: 'transform',
    userSelect: 'none',
    pointerEvents: 'none',
    transformStyle: 'preserve-3d',
  };

  // Eye positions (verified from PNG analysis)
  const eyeW = size * 90 / 387;
  const eyeH = eyeW;
  const eyeLeftX = (134 / 387) * size - eyeW / 2;
  const eyeLeftY = (214 / 516) * size * aspect - eyeH / 2;
  const eyeRightX = (280 / 387) * size - eyeW / 2;
  const eyeRightY = (206 / 516) * size * aspect - eyeH / 2;

  const makeEyeStyle = (): CSSProperties => ({
    position: 'absolute',
    width: eyeW,
    height: eyeH,
    pointerEvents: 'none',
    transform: `translate(${eyeOffsetX}px, ${eyeOffsetY}px)`,
    transition: 'transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
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

      {/* Glow effect behind mascot — gives it presence on dark bg */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl transition-transform duration-500"
        style={{
          width: size * 0.9,
          height: size * 0.9,
          background: 'radial-gradient(circle, rgba(232, 93, 31, 0.4) 0%, transparent 70%)',
          transform: `translate(-50%, -50%) translate(${mouse.x * 10}px, ${mouse.y * 10}px)`,
        }}
      />

      <div style={containerStyle}>
        {/* Body */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mascots/claude-body.png"
          alt="Claude mascot"
          draggable={false}
          style={bodyStyle}
        />

        {/* Eyes — follow mouse independently, masked to stay inside eye cavities */}
        <div
          className="absolute"
          style={{
            ...makeEyeStyle(),
            left: eyeLeftX,
            top: eyeLeftY,
            // Clip the eye to keep it inside the cavity even when moving
            clipPath: 'inset(35% 30% 35% 30%)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mascots/eye-left.png"
            alt=""
            draggable={false}
            aria-hidden
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))',
            }}
          />
        </div>
        <div
          className="absolute"
          style={{
            ...makeEyeStyle(),
            left: eyeRightX,
            top: eyeRightY,
            clipPath: 'inset(35% 30% 35% 30%)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mascots/eye-right.png"
            alt=""
            draggable={false}
            aria-hidden
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))',
            }}
          />
        </div>

        {/* Mood indicator */}
        {mode === 'celebrate' && (
          <div
            className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap animate-bounce rounded-full bg-brasa-500 px-3 py-1 text-xs font-bold text-white shadow-glow"
            style={{ zIndex: 10 }}
          >
            🤖 yay!
          </div>
        )}
        {mode === 'squish' && (
          <div
            className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-warn px-3 py-1 text-xs font-bold text-bg shadow-lg"
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
