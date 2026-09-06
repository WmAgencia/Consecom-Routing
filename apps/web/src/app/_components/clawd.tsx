'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';

interface ClawdProps {
  size?: number;
}

// Claude person oficial — mascote 3D do Claude (Anthropic)
// Composição de cena multi-layer (Design 3 - Hybrid):
//   - Pedestal/reflection embaixo
//   - Glow radial atrás (segue mouse)
//   - Particles orbitando lentamente
//   - Rim light sutil que segue cursor
//   - Body PNG (3 camadas: body + 2 olhos)
//   - Mood bubbles ("yay!", "calma!")
//   - Multi-signal animation states: idle / hover / celebrate / squish
export function Clawd({ size = 260 }: ClawdProps) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<'idle' | 'hover' | 'celebrate' | 'squish'>('idle');
  const [clickBursts, setClickBursts] = useState<Array<{ id: number; x: number; y: number; emoji: string }>>([]);
  const burstId = useRef(0);
  const celebrateTimer = useRef<NodeJS.Timeout | null>(null);
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);

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
      // Trigger hover state when mouse is near mascot
      if (mode === 'idle') {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        hoverTimer.current = setTimeout(() => setMode('hover'), 100);
      }
    };
    window.addEventListener('mousemove', handleMove, { passive: true });
    window.addEventListener('touchmove', handleMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
  }, [mode]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const id = ++burstId.current;
      const emojis: string[] = ['✨', '⭐', '💥', '🎉', '🤖', '🚀', '🦾'];
      const emoji: string = emojis[Math.floor(Math.random() * emojis.length)] ?? '✨';
      setClickBursts((prev) => [...prev, { id, x: e.clientX, y: e.clientY, emoji }]);
      setMode('celebrate');
      if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
      celebrateTimer.current = setTimeout(() => setMode('hover'), 1400);
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
            } else {
              setMode('hover');
            }
          }
        }
      },
      { threshold: [0, 0.3, 0.6, 1] },
    );
    document.querySelectorAll('[data-squisher="true"]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // === Scene composition math ===
  const aspect = 516 / 387;

  // Body tilt — subtle ±5° for premium feel
  const rotateY = mouse.x * 5;
  const rotateX = -mouse.y * 5;
  const shadowX = -mouse.x * 30;
  const shadowY = -mouse.y * 30;

  // Eyes follow cursor — ±14px X (more range, with clip-path so they stay inside)
  const eyeOffsetX = mouse.x * 14;
  const eyeOffsetY = mouse.y * 8;

  // Multi-signal animation per mode
  let bodyTransform = '';
  let glowIntensity = 0.55;
  let bubbleText = '';

  switch (mode) {
    case 'celebrate':
      bodyTransform = `rotateX(-10deg) translateY(-28px) scale(1.12)`;
      glowIntensity = 1;
      bubbleText = '🤖 yay!';
      break;
    case 'squish':
      bodyTransform = `rotateX(${rotateX * 0.2}deg) rotateY(${rotateY * 0.2}deg) scaleY(0.55) scaleX(1.22) translateY(18px)`;
      glowIntensity = 0.4;
      bubbleText = '😅 aaai calma!';
      break;
    case 'hover':
      bodyTransform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
      glowIntensity = 0.7;
      bubbleText = '';
      break;
    default: // idle
      bodyTransform = `rotateX(${rotateX * 0.3}deg) rotateY(${rotateY * 0.3}deg)`;
      glowIntensity = 0.45;
      bubbleText = '';
  }

  // === Container dimensions ===
  const containerWidth = size;
  const containerHeight = size * aspect;
  const totalWidth = containerWidth * 1.8; // Includes pedestal/glow space
  const totalHeight = containerHeight * 1.15;

  const containerStyle: CSSProperties = {
    position: 'relative',
    width: totalWidth,
    height: totalHeight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const mascotAreaStyle: CSSProperties = {
    position: 'relative',
    width: containerWidth,
    height: containerHeight,
  };

  const bodyStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    transform: bodyTransform,
    transition: mode === 'celebrate' || mode === 'squish'
      ? 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
      : 'transform 0.5s ease-out',
    filter: `drop-shadow(${shadowX}px ${shadowY}px 32px rgba(232, 93, 31, 0.55))
             drop-shadow(0 14px 28px rgba(0, 0, 0, 0.45))
             drop-shadow(${-mouse.x * 12}px ${-mouse.y * 8}px 8px rgba(251, 139, 60, 0.4))`,
    willChange: 'transform',
    userSelect: 'none',
    pointerEvents: 'none',
    transformStyle: 'preserve-3d',
  };

  const eyeW = containerWidth * 90 / 387;
  const eyeH = eyeW;
  const eyeLeftX = (134 / 387) * containerWidth - eyeW / 2;
  const eyeLeftY = (214 / 516) * containerHeight - eyeH / 2;
  const eyeRightX = (280 / 387) * containerWidth - eyeW / 2;
  const eyeRightY = (206 / 516) * containerHeight - eyeH / 2;

  const makeEyeStyle = (): CSSProperties => ({
    position: 'absolute',
    width: eyeW,
    height: eyeH,
    pointerEvents: 'none',
    transform: `translate(${eyeOffsetX}px, ${eyeOffsetY}px)`,
    transition: 'transform 0.18s cubic-bezier(0.22, 1, 0.36, 1)',
    willChange: 'transform',
    filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4))',
  });

  // Generate ambient particles (3 floating dots that orbit slowly)
  const particles = [
    { size: 8, x: 8, y: 20, delay: 0, duration: 6 },
    { size: 6, x: 90, y: 15, delay: 2, duration: 7 },
    { size: 10, x: 50, y: 5, delay: 1, duration: 5 },
  ];

  return (
    <>
      {/* Click bursts */}
      <div className="pointer-events-none fixed inset-0 z-50">
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
        {/* === LAYER 1: Rim light (behind everything) === */}
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            width: containerWidth * 0.85,
            height: containerWidth * 0.85,
            left: '50%',
            top: '35%',
            transform: `translate(-50%, -50%) translate(${-mouse.x * 15}px, ${-mouse.y * 15}px)`,
            background: 'radial-gradient(circle, rgba(251, 139, 60, 0.3) 0%, transparent 60%)',
            filter: 'blur(20px)',
            opacity: glowIntensity * 0.6,
            transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
          }}
        />

        {/* === LAYER 2: Main glow === */}
        <div
          className="pointer-events-none absolute rounded-full blur-3xl"
          style={{
            width: containerWidth * 0.95,
            height: containerWidth * 0.95,
            left: '50%',
            top: '40%',
            transform: `translate(-50%, -50%) translate(${mouse.x * 12}px, ${mouse.y * 12}px)`,
            background: `radial-gradient(circle, rgba(232, 93, 31, ${0.4 * glowIntensity}) 0%, transparent 65%)`,
            transition: 'transform 0.5s ease-out',
          }}
        />

        {/* === LAYER 3: Ambient particles === */}
        {particles.map((p, i) => (
          <div
            key={i}
            className="pointer-events-none absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
              background: 'radial-gradient(circle, #FFD1A0 0%, rgba(232, 93, 31, 0.4) 60%, transparent 100%)',
              boxShadow: '0 0 12px rgba(232, 93, 31, 0.6)',
              animation: `orbit ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
              opacity: 0.7,
            }}
          />
        ))}

        {/* === LAYER 4: Mascot === */}
        <div style={mascotAreaStyle}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mascots/claude-body.png"
            alt="Claude person mascot"
            draggable={false}
            style={bodyStyle}
          />

          {/* Eyes */}
          <div
            style={{
              ...makeEyeStyle(),
              left: eyeLeftX,
              top: eyeLeftY,
              clipPath: 'inset(32% 28% 32% 28%)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mascots/eye-left.png"
              alt=""
              draggable={false}
              aria-hidden
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div
            style={{
              ...makeEyeStyle(),
              left: eyeRightX,
              top: eyeRightY,
              clipPath: 'inset(32% 28% 32% 28%)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mascots/eye-right.png"
              alt=""
              draggable={false}
              aria-hidden
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
        </div>

        {/* === LAYER 5: Pedestal / reflection === */}
        <div
          className="pointer-events-none absolute"
          style={{
            left: '50%',
            bottom: '-5%',
            transform: 'translateX(-50%)',
            width: '70%',
            height: '30px',
            background: 'radial-gradient(ellipse at center, rgba(232, 93, 31, 0.3) 0%, transparent 70%)',
            filter: 'blur(8px)',
          }}
        />
        <div
          className="pointer-events-none absolute"
          style={{
            left: '50%',
            bottom: '-8%',
            transform: 'translateX(-50%) scaleY(-0.3)',
            transformOrigin: 'top',
            width: '50%',
            height: containerHeight * 0.4,
            opacity: 0.12,
            filter: 'blur(4px)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mascots/claude-body.png"
            alt=""
            draggable={false}
            aria-hidden
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        {/* === Mood bubble === */}
        {bubbleText && (
          <div
            className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brasa-500 px-3 py-1.5 text-xs font-bold text-white shadow-glow"
            style={{
              top: '0',
              animation: mode === 'celebrate' ? 'float-up 1s ease-out forwards' : 'none',
              zIndex: 10,
            }}
          >
            {bubbleText}
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
            transform: translate(-50%, -100px) scale(1.6) rotate(180deg);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -200px) scale(0.7) rotate(360deg);
          }
        }
        .animate-burst {
          animation: burst 1.5s ease-out forwards;
        }
        @keyframes orbit {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.4;
          }
          25% {
            transform: translate(15px, -20px) scale(1.2);
            opacity: 0.9;
          }
          50% {
            transform: translate(30px, 0) scale(0.9);
            opacity: 0.5;
          }
          75% {
            transform: translate(15px, 20px) scale(1.1);
            opacity: 0.8;
          }
        }
        @keyframes float-up {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(10px) scale(0.5);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(-12px) scale(1);
          }
        }
      `}</style>
    </>
  );
}
