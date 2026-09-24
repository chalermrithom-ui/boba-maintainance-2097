import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Languages } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: 'header' | 'pill' | 'minimal';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { currentLang, setLang } = useLanguage();

  if (variant === 'minimal') {
    return (
      <div className={`inline-flex items-center gap-1 text-xs font-medium ${className}`}>
        <button
          type="button"
          onClick={() => setLang('th')}
          className={`px-2 py-1 rounded transition-colors ${
            currentLang === 'th'
              ? 'bg-blue-600 text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          ไทย
        </button>
        <span className="text-slate-300">|</span>
        <button
          type="button"
          onClick={() => setLang('en')}
          className={`px-2 py-1 rounded transition-colors ${
            currentLang === 'en'
              ? 'bg-blue-600 text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          EN
        </button>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 shadow-xs ${className}`}
      role="group"
      aria-label="Language selection"
    >
      <Languages className="w-3.5 h-3.5 ml-1.5 mr-1 text-slate-500" />
      <button
        type="button"
        id="btn-lang-th"
        onClick={() => setLang('th')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
          currentLang === 'th'
            ? 'bg-white text-blue-700 shadow-xs font-bold border border-slate-200/50'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
        }`}
      >
        ไทย
      </button>
      <button
        type="button"
        id="btn-lang-en"
        onClick={() => setLang('en')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
          currentLang === 'en'
            ? 'bg-white text-blue-700 shadow-xs font-bold border border-slate-200/50'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
        }`}
      >
        English
      </button>
    </div>
  );
};
