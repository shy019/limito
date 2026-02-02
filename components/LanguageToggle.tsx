'use client';

interface LanguageToggleProps {
  locale: string;
  onToggle: () => void;
}

export default function LanguageToggle({ locale, onToggle }: LanguageToggleProps) {
  return (
    <button 
      onClick={onToggle}
      className="text-2xl rounded-full w-12 h-12 shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
    >
      {locale === 'es' ? '🇪🇸' : '🇺🇸'}
    </button>
  );
}
