'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';

interface ClaudeMascotProps {
  size?: number;
}

// Claude person — mascote oficial 3D do Claude (Anthropic)
// Imagem em /public/mascots/claude-person.jpg
// Aplica efeito 3D via CSS perspective + parallax por movimento do mouse
// Exportado como `Clawd` para manter compatibilidade com import no page.tsx
export function Clawd({ size = 240 }: ClaudeMascotProps) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<'normal' | 'celebrate' | 'squish'>('normal');
  const [clickBursts, setClickBursts] = useState<Array<{ id: number; x: number; y: number; emoji: string }>>([]);
  const burstId = useRef(0);
  const celebrateTimer = useRef<NodeJS.Timeout | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Track mouse / touch for 3D parallax
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

  // === 3D Parallax math ===
  // Mouse x,y = -1 to 1
  // The image tilts TOWARD the cursor (so it looks at the mouse)
  // We also shift the drop-shadow position to fake a light source at the mouse
  const maxRotate = 18; // degrees max tilt
  const maxTranslate = 14; // pixels max translate
  const rotateY = mouse.x * maxRotate; // left/right tilt
  const rotateX = -mouse.y * maxRotate; // up/down tilt (inverted: looking up = negative rotateX)
  const translateX = mouse.x * maxTranslate;
  const translateY = mouse.y * maxTranslate * 0.6;

  // Shadow follows the light source (opposite of the cursor)
  const shadowX = -mouse.x * 30;
  const shadowY = -mouse.y * 30;

  // Base 3D transform
  let baseTransform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateX(${translateX}px) translateY(${translateY}px)`;

  if (mode === 'celebrate') {
    // Jump up and rotate
    baseTransform = `perspective(900px) rotateX(-15deg) rotateY(${
      mouse.x * 8
    }deg) translateY(-26px) scale(1.08)`;
  } else if (mode === 'squish') {
    // Flatten vertically, stretch horizontally — like being pressed down
    baseTransform = `perspective(900px) rotateX(${
      rotateX * 0.3
    }deg) rotateY(${rotateY * 0.3}deg) scaleY(0.6) scaleX(1.18) translateY(14px)`;
  }

  const containerStyle: CSSProperties = {
    width: size,
    height: size,
    perspective: 900,
    transformStyle: 'preserve-3d',
  };

  const imgStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    transform: baseTransform,
    transformStyle: 'preserve-3d',
    transition: mode === 'celebrate' || mode === 'squish'
      ? 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
      : 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
    filter: `drop-shadow(${shadowX}px ${shadowY}px 22px rgba(232, 93, 31, 0.45))
             drop-shadow(${shadowX * 0.3}px ${shadowY * 0.3}px 8px rgba(0, 0, 0, 0.3))`,
    willChange: 'transform',
    userSelect: 'none',
    pointerEvents: 'none',
  };

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

      <div
        className="relative"
        style={containerStyle}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src="/mascots/claude-person.jpg"
          alt="Claude mascot"
          draggable={false}
          style={imgStyle}
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
