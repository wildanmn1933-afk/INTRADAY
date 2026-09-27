import React from 'react';
import { Globe2 } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

interface LanguageToggleProps {
  className?: string;
  variant?: 'pill' | 'button';
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  className = '',
  variant = 'pill',
}) => {
  const { language, setLanguage, toggleLanguage } = useLanguage();

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        className={`h-7 px-2 rounded flex items-center gap-1.5 transition-colors cursor-pointer select-none bg-[var(--bg-section-alt)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-primary)] font-mono text-xs font-semibold ${className}`}
        title={language === 'id' ? 'Ganti ke Bahasa Inggris (Switch to English)' : 'Switch to Indonesian (Ganti ke Bahasa Indonesia)'}
        aria-label="Toggle Language"
        id="language-toggle-btn"
      >
        <Globe2 className="w-3.5 h-3.5 text-[var(--accent)]" />
        <span>{language.toUpperCase()}</span>
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Language selection"
      className={`inline-flex items-center p-0.5 rounded-full select-none transition-colors duration-150 border border-[var(--border-subtle)] bg-[var(--bg-section-alt)] font-mono text-[10px] ${className}`}
      id="language-toggle-pill"
    >
      {/* ID (Bahasa Indonesia) */}
      <button
        type="button"
        onClick={() => setLanguage('id')}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-bold transition-all duration-150 cursor-pointer ${
          language === 'id'
            ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
            : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
        }`}
        title="Bahasa Indonesia"
      >
        <span>ID</span>
      </button>

      {/* EN (English) */}
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-bold transition-all duration-150 cursor-pointer ${
          language === 'en'
            ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
            : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
        }`}
        title="English"
      >
        <span>EN</span>
      </button>
    </div>
  );
};
