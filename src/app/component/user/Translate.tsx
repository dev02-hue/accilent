"use client";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: {
          new (options: object, containerId: string): void;
          InlineLayout: {
            SIMPLE: string;
            HORIZONTAL: string;
            VERTICAL: string;
          };
        };
      };
    };
  }
}

const Translate = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;

    const addScript = () => {
      if (window.google?.translate || document.querySelector('script[src*="translate.google.com"]')) {
        return;
      }

      const script = document.createElement("script");
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      script.onload = () => setIsLoaded(true);
      document.body.appendChild(script);

      window.googleTranslateElementInit = () => {
        if (window.google?.translate && !document.getElementById('google_translate_element')?.hasChildNodes()) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: "en",
              includedLanguages: getAllLanguages().join(','),
              layout: window.google.translate.TranslateElement.InlineLayout.HORIZONTAL,
              autoDisplay: false,
              multilanguagePage: true
            },
            "google_translate_element"
          );
          setInitialized(true);
        }
      };
    };

    addScript();

    return () => {
      const iframe = document.querySelector('iframe[src*="translate.google.com"]');
      if (iframe) {
        iframe.remove();
      }
    };
  }, [initialized]);

  const getAllLanguages = () => {
    return [
      'af', 'sq', 'am', 'ar', 'hy', 'az', 'eu', 'be', 'bn', 'bs', 'bg', 'ca', 'ceb', 'zh-CN', 'zh-TW',
      'co', 'hr', 'cs', 'da', 'nl', 'en', 'eo', 'et', 'fi', 'fr', 'fy', 'gl', 'ka', 'de', 'el', 'gu',
      'ht', 'ha', 'haw', 'he', 'hi', 'hmn', 'hu', 'is', 'ig', 'id', 'ga', 'it', 'ja', 'jv', 'kn', 'kk',
      'km', 'rw', 'ko', 'ku', 'ky', 'lo', 'la', 'lv', 'lt', 'lb', 'mk', 'mg', 'ms', 'ml', 'mt', 'mi',
      'mr', 'mn', 'my', 'ne', 'no', 'ny', 'or', 'ps', 'fa', 'pl', 'pt', 'pa', 'ro', 'ru', 'sm', 'gd',
      'sr', 'st', 'sn', 'sd', 'si', 'sk', 'sl', 'so', 'es', 'su', 'sw', 'sv', 'tl', 'tg', 'ta', 'tt',
      'te', 'th', 'tr', 'tk', 'uk', 'ur', 'ug', 'uz', 'vi', 'cy', 'xh', 'yi', 'yo', 'zu',
      'as', 'ay', 'bm', 'bi', 'dv', 'dz', 'ee', 'fj', 'gn', 'gsw', 'ht', 'ik', 'iu', 'kl', 'ln',
      'lg', 'mfe', 'na', 'nr', 'om', 'rn', 'sg', 'sq', 'ss', 'ti', 'ts', 'tw', 've', 'wo'
    ];
  };

  return (
    <div className="relative w-full">
      <div 
        id="google_translate_element" 
        className={`w-full transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
      
      {!isLoaded && (
        <div className="flex items-center justify-center p-4 bg-black rounded-lg">
          <div className="flex space-x-4 animate-pulse">
            <div className="w-24 h-8 rounded bg-emerald-500"></div>
            <div className="w-24 h-8 rounded bg-emerald-500"></div>
          </div>
        </div>
      )}

      {/* Inject styles using a style tag */}
      <style jsx global>{`
        .goog-logo-link,
        .goog-te-banner-frame.skiptranslate,
        .goog-te-menu-value {
          display: none !important;
        }
        .goog-te-gadget {
          color: transparent !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif !important;
        }
        .goog-te-gadget .goog-te-combo {
          color: #ffffff !important;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          border: 2px solid #10b981;
          background-color: #000000;
          font-family: inherit;
          width: 100%;
          max-width: 200px;
          transition: all 0.2s;
        }
        .goog-te-combo:hover {
          border-color: #34d399 !important;
          background-color: #111827 !important;
        }
        .goog-te-combo option {
          background-color: #000000;
          color: #10b981;
        }
        body {
          top: 0px !important;
        }
        @media (max-width: 640px) {
          .goog-te-combo {
            padding: 0.5rem;
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Translate;