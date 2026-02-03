'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedButtonProps {
  text: string;
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit';
  loading?: boolean;
}

export default function AnimatedButton({ text, onClick, disabled = false, fullWidth = false, type = 'button', loading = false }: AnimatedButtonProps) {
  const [animationPhase, setAnimationPhase] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const checkRef = useRef<SVGPathElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (checkRef.current) {
      const path = checkRef.current;
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
    }
  }, []);

  useEffect(() => {
    if (loading) {
      setAnimationPhase(1);
      const t1 = setTimeout(() => setAnimationPhase(2), 200);
      const t2 = setTimeout(() => setAnimationPhase(3), 600);
      const t3 = setTimeout(() => setAnimationPhase(4), 1000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else {
      setAnimationPhase(0);
    }
  }, [loading]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    
    if (type === 'button' && onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div style={{ position: 'relative', width: fullWidth ? '100%' : '200px', height: '40px' }}>
      <button
        ref={buttonRef}
        type={type}
        onClick={handleClick}
        disabled={disabled || loading}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'transparent',
          border: 'none',
          cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
          zIndex: 10
        }}
      />
      
      <div
        ref={containerRef}
        style={{
          background: disabled ? '#666666' : '#D4AF37',
          height: animationPhase >= 2 ? '8px' : '40px',
          width: animationPhase >= 4 ? '0' : (fullWidth ? '100%' : '200px'),
          textAlign: 'center',
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          left: 0,
          right: 0,
          margin: '0 auto',
          borderRadius: animationPhase >= 2 ? '100px' : '8px',
          transition: 'all 0.3s ease',
          opacity: disabled ? 0.5 : 1,
          pointerEvents: 'none'
        }}
      >
        <div
          ref={textRef}
          style={{
            fontWeight: 'bold',
            fontSize: '0.75rem',
            lineHeight: 1,
            fontFamily: 'inherit',
            color: '#000000',
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            left: 0,
            right: 0,
            transition: 'opacity 0.15s',
            textTransform: 'uppercase',
            opacity: animationPhase >= 1 ? 0 : 1
          }}
        >
          {text}
        </div>
      </div>

      <div
        ref={progressRef}
        style={{
          position: 'absolute',
          height: animationPhase >= 4 ? '40px' : '8px',
          width: animationPhase >= 4 ? '40px' : (animationPhase >= 3 ? (fullWidth ? '100%' : '300px') : '0'),
          right: 0,
          top: '50%',
          left: '50%',
          borderRadius: animationPhase >= 4 ? '40px' : '200px',
          transform: 'translateY(-50%) translateX(-50%)',
          background: '#D4AF37',
          transition: animationPhase >= 4 ? 'all 0.4s ease 0.1s' : 'width 0.4s ease',
          pointerEvents: 'none'
        }}
      />

      <svg
        ref={svgRef}
        x="0px"
        y="0px"
        viewBox="0 0 25 30"
        style={{
          width: '20px',
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%) translateX(-50%)',
          left: '50%',
          right: 0,
          pointerEvents: 'none',
          opacity: animationPhase >= 4 ? 1 : 0,
          transition: 'opacity 0.2s ease 0.3s'
        }}
      >
        <path
          ref={checkRef}
          d="M2,19.2C5.9,23.6,9.4,28,9.4,28L23,2"
          style={{
            fill: 'none',
            stroke: '#000000',
            strokeWidth: 4,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeDashoffset: animationPhase >= 4 ? 0 : checkRef.current?.getTotalLength() || 100,
            transition: 'stroke-dashoffset 0.3s ease 0.4s'
          }}
        />
      </svg>
    </div>
  );
}
