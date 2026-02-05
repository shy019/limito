'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownProps {
  targetDate: string;
}

export default function Countdown({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!mounted) return null;

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center">
      <div className="flex items-center justify-center gap-2 mb-6">
        <Clock className="w-6 h-6" style={{ color: 'var(--accent-color, #ffd624)' }} />
        <h2 className="text-2xl font-black" style={{ color: '#ffffff' }}>PRÓXIMO DROP</h2>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'DÍAS', value: timeLeft.days },
          { label: 'HORAS', value: timeLeft.hours },
          { label: 'MIN', value: timeLeft.minutes },
          { label: 'SEG', value: timeLeft.seconds }
        ].map((item) => (
          <div key={item.label} className="bg-black/30 rounded-xl p-4">
            <div className="text-4xl font-black mb-1" style={{ color: 'var(--accent-color, #ffd624)' }}>
              {item.value.toString().padStart(2, '0')}
            </div>
            <div className="text-xs font-bold" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
