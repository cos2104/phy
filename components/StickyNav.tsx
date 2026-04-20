'use client';

import { useState, useEffect, useRef } from 'react';
// 💡 카테고리 아이콘 + 위로가기(ArrowUp) 아이콘만 임포트
import { 
  Atom, Zap, Move, Sun, Boxes, Microscope, Magnet, Activity, Wind, 
  Droplets, Thermometer, Eye, Compass, Waves, Flame, Rocket, Orbit, 
  Satellite, Cpu, Layers, Gauge, FlaskConical, Feather, 
  ArrowUp 
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  Move, Zap, Sun, Atom, Boxes, Microscope, Magnet, Activity, Wind,
  Droplets, Thermometer, Eye, Compass, Waves, Flame, Rocket, Orbit,
  Satellite, Cpu, Layers, Gauge, FlaskConical, Feather
};

export default function StickyNav({ categories = [] }: { categories?: any[] }) {
  const [isCompact, setIsCompact] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isHoverExpanded, setIsHoverExpanded] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const updateMobile = () => setIsMobile(mediaQuery.matches);
    updateMobile();

    const handleMediaChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
    }

    const updateScrollState = () => {
      const currentY = window.scrollY;
      setShowTopBtn(currentY > 500);
      const compactStartY = isMobile ? 260 : 320;
      const nextCompact = currentY > compactStartY;
      setIsCompact((prev) => (prev === nextCompact ? prev : nextCompact));
    };

    const handleScroll = () => {
      if (rafRef.current) return;
      rafRef.current = window.requestAnimationFrame(() => {
        updateScrollState();
        rafRef.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateScrollState();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
    };
  }, []);

  const safeCategories = Array.isArray(categories) ? categories : [];
  if (safeCategories.length === 0) return null;

  const canExpandDesktop = isCompact && !isMobile;
  const expanded = !isCompact || (canExpandDesktop && isHoverExpanded) || (isCompact && isMobile && isMobileExpanded);

  const bgOpacity = isCompact ? 0.95 : 1;
  const blurAmount = isCompact ? 10 : 0;
  const cardRadius = expanded ? 16 : 999;
  const fontSize = expanded ? (isMobile ? 12 : 13) : (isMobile ? 11 : 12);
  const iconSize = expanded ? 16 : 13;
  const cardHeight = expanded ? (isMobile ? 42 : 46) : (isMobile ? 34 : 36);
  const gapSize = expanded ? (isMobile ? 8 : 12) : (isMobile ? 8 : 10);
  const navTop = isMobile ? 56 : 64;
  const containerHeight = expanded ? (isMobile ? 220 : 170) : (isMobile ? 56 : 58);
  const wrapperHeight = isCompact ? containerHeight + (isMobile ? 12 : 18) : 0;

  return (
    <>
      <div id="explore" className="scroll-mt-32" style={{ height: `${wrapperHeight}px` }} />

      <div 
        className={`w-full transition-all duration-300 ${isCompact ? 'fixed left-0 z-40 shadow-md border-b border-gray-100' : 'relative z-10'}`}
        style={{
          top: isCompact ? `${navTop}px` : undefined,
          backgroundColor: `rgba(255, 255, 255, ${bgOpacity})`,
          backdropFilter: `blur(${blurAmount}px)`,
          paddingTop: isCompact ? (isMobile ? '6px' : '8px') : '16px',
          paddingBottom: isCompact ? (isMobile ? '6px' : '8px') : '16px',
        }}
        onMouseEnter={() => canExpandDesktop && setIsHoverExpanded(true)}
        onMouseLeave={() => canExpandDesktop && setIsHoverExpanded(false)}
      >
        <nav className={`mx-auto max-w-6xl ${isMobile ? 'px-3' : 'px-4'}`}>
          {isCompact && isMobile && (
            <button
              type="button"
              onClick={() => setIsMobileExpanded((prev) => !prev)}
              className="w-full mb-2 h-10 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600"
            >
              {isMobileExpanded ? '카테고리 접기' : '카테고리 펼치기'}
            </button>
          )}
          <div 
            className={`items-center ${expanded ? 'flex flex-wrap justify-center' : 'flex justify-center'} ${isCompact && isMobile && !isMobileExpanded ? 'hidden' : ''}`}
            style={{ gap: `${gapSize}px` }}
          >
            {safeCategories.map((cat) => {
              if (!cat) return null;
              const IconComponent = ICON_MAP[cat.icon_name] || Boxes;

              return (
                <a
                  key={cat.id}
                  href={`#${cat.id}`}
                  className="group bg-white border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 flex shrink-0 transition-all duration-300 shadow-sm hover:shadow-md"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: `${cardHeight}px`,
                    borderRadius: `${cardRadius}px`,
                    padding: expanded ? (isMobile ? '0 10px' : '0 12px') : '0 10px',
                  }}
                >
                  <div
                    className={`flex items-center justify-center rounded-2xl transition-all duration-300 ${cat.bg_class || 'bg-slate-50'} ${cat.color_class || 'text-slate-500'}`}
                    style={{
                      width: expanded ? '28px' : '24px',
                      height: expanded ? '28px' : '24px',
                      marginBottom: '0px',
                      marginRight: '6px',
                    }}
                  >
                    <IconComponent size={iconSize} />
                  </div>
                  
                  <span
                    className="font-bold text-slate-700 whitespace-nowrap"
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {cat.name}
                  </span>
                </a>
              );
            })}
          </div>
        </nav>
      </div>

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-5 right-4 sm:bottom-8 sm:right-8 p-3 sm:p-4 bg-gray-900 text-white rounded-full shadow-2xl transition-all duration-500 z-50 hover:bg-blue-600 hover:-translate-y-2 ${
          showTopBtn ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-90 pointer-events-none'
        }`}
        title="맨 위로 가기"
      >
        <ArrowUp size={isMobile ? 18 : 24} />
      </button>
    </>
  );
}