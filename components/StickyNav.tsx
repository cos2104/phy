'use client';

import { useState, useEffect, useRef } from 'react';
import { Boxes, Move, Zap, Sun, Atom, ArrowUp } from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  Move: Move,
  Zap: Zap,
  Sun: Sun,
  Atom: Atom,
  Boxes: Boxes,
};

export default function StickyNav({ categories = [] }: { categories?: any[] }) {
  const [progress, setProgress] = useState(0); 
  const [isFixed, setIsFixed] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setShowTopBtn(currentY > 500);

      // 애니메이션 구간: 100px 지점부터 변하기 시작해서 300px에서 완료
      const startY = 100;
      const endY = 300;
      const distance = endY - startY;

      if (currentY <= startY) {
        setProgress(0);
        setIsFixed(false);
      } else if (currentY > startY && currentY < endY) {
        setProgress((currentY - startY) / distance);
        setIsFixed(true); // 변하기 시작할 때부터 상단 고정
      } else {
        setProgress(1);
        setIsFixed(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); 
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const safeCategories = Array.isArray(categories) ? categories : [];
  if (safeCategories.length === 0) return null;

  const p = progress;
  
  // 💡 수정된 핵심 부분: 고정되지 않았을 때는 배경을 하얗게, 고정되었을 때는 반투명하게
  const bgOpacity = isFixed ? (0.85 + 0.1 * p) : 1; 
  const blurAmount = isFixed ? (12 * p) : 0;

  // 크기 조절 수치
  const cardWidth = 160 - (60 * p); 
  const cardHeight = 160 - (112 * p);
  const cardRadius = 32 - (16 * p);
  const cardPadding = 24 - (16 * p);
  const iconBoxSize = 56 - (24 * p);
  const iconSize = 28 - (10 * p);
  const fontSize = 16 - (2 * p);
  const gapSize = 24 - (12 * p);

  return (
    <>
      {/* 앵커 공간: 고정 모드일 때 아래 콘텐츠가 튀어 오르는 것을 방지 */}
      <div id="explore" className="scroll-mt-32" style={{ height: isFixed ? '180px' : '0px' }} />

      <div 
        className={`w-full transition-shadow duration-300 ${isFixed ? 'fixed top-16 left-0 z-40 shadow-md border-b border-gray-100' : 'relative z-10'}`}
        style={{
          backgroundColor: `rgba(255, 255, 255, ${bgOpacity})`,
          backdropFilter: `blur(${blurAmount}px)`,
          paddingTop: isFixed ? '10px' : '20px',
          paddingBottom: isFixed ? '10px' : '20px',
        }}
      >
        <nav className="mx-auto max-w-6xl px-4">
          <div 
            className="flex flex-wrap justify-center items-center"
            style={{ gap: `${gapSize}px` }}
          >
            {safeCategories.map((cat) => {
              if (!cat) return null;
              const IconComponent = ICON_MAP[cat.icon_name] || Boxes;
              const isRow = p > 0.4; // 절반 정도 내려오면 가로 배열로 스위치

              return (
                <a
                  key={cat.id}
                  href={`#${cat.id}`}
                  className="group bg-white border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 flex shrink-0 transition-all duration-300 shadow-sm hover:shadow-md"
                  style={{
                    flexDirection: isRow ? 'row' : 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: isFixed ? 'auto' : `calc(50% - ${gapSize}px)`,
                    maxWidth: isFixed ? 'none' : `${cardWidth}px`,
                    height: `${cardHeight}px`,
                    borderRadius: `${cardRadius}px`,
                    padding: isFixed ? '0 20px' : `${cardPadding}px`,
                  }}
                >
                  <div
                    className={`flex items-center justify-center rounded-2xl transition-all duration-300 ${cat.bg_class || 'bg-slate-50'} ${cat.color_class || 'text-slate-500'}`}
                    style={{
                      width: `${iconBoxSize}px`,
                      height: `${iconBoxSize}px`,
                      marginBottom: isRow ? '0px' : `${16 - (32 * p)}px`,
                      marginRight: isRow ? '10px' : '0px',
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
        className={`fixed bottom-8 right-8 p-4 bg-gray-900 text-white rounded-full shadow-2xl transition-all duration-500 z-50 hover:bg-blue-600 hover:-translate-y-2 ${
          showTopBtn ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-90 pointer-events-none'
        }`}
        title="맨 위로 가기"
      >
        <ArrowUp size={24} />
      </button>
    </>
  );
}