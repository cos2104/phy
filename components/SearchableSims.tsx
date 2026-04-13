// components/SearchableSims.tsx
'use client';

import { useState, useMemo, useRef } from 'react';
import { Search, X, Boxes } from 'lucide-react';
import SimulationCard from './SimulationCard';
import { Simulation, Category } from '@/app/types/physics';

interface Props {
  simulations: Simulation[];
  categories: Category[];
}

export default function SearchableSims({ simulations, categories }: Props) {
  const [query, setQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredSims = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return simulations;
    return simulations.filter((s: Simulation) => 
      s.title.toLowerCase().includes(term) || s.description.toLowerCase().includes(term)
    );
  }, [simulations, query]);

  const isSearching = query.trim().length > 0;

  return (
    <div className="relative w-full">
      {/* 🔍 검색창 영역: Sticky 설정과 배경 Blur 처리 */}
      <div className="sticky top-[64px] z-40 w-full transition-all duration-300">
        {/* 아래 div가 실제 배경 역할을 하며 그림자/높이를 조절합니다. */}
        <div className={`w-full bg-white/80 backdrop-blur-xl transition-all duration-500 py-6 ${isSearching ? 'border-b border-slate-100 shadow-sm' : ''}`}>
          <div className="max-w-2xl mx-auto px-6">
            <div className="relative group">
              <Search className={`absolute left-6 top-1/2 -translate-y-1/2 transition-colors duration-300 ${isSearching ? 'text-blue-600' : 'text-slate-400 group-focus-within:text-blue-600'}`} size={22} />
              <input 
                ref={searchInputRef}
                type="text"
                placeholder="검색어를 입력하면 실험 목록이 즉시 필터링됩니다..."
                className={`w-full bg-white border rounded-[2rem] pl-16 pr-14 py-4 shadow-xl outline-none transition-all duration-300 font-bold text-slate-700 ${isSearching ? 'border-blue-400 ring-4 ring-blue-50' : 'border-slate-200 shadow-slate-200/50 focus:ring-4 focus:ring-blue-50'}`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {isSearching && (
                <button 
                  onClick={() => setQuery('')}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 transition-all p-1 hover:scale-110"
                >
                  <X size={24} />
                </button>
              )}
            </div>
            
            {/* 결과 개수 표시 (레이아웃 흔들림 방지를 위해 절대 위치 혹은 고정 높이 사용) */}
            <div className="h-6 mt-2 ml-6">
              {isSearching && (
                <p className="text-xs font-black text-blue-600 animate-in fade-in slide-in-from-top-1 duration-300">
                  총 {filteredSims.length}개의 물리 시뮬레이션을 찾았습니다.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 💡 검색 결과: min-h를 설정하여 결과가 줄어들어도 페이지가 훅 올라가지 않게 보호 */}
      <div className="container mx-auto px-6 mt-12 space-y-24 min-h-[600px]">
        {categories.map((cat: Category) => {
          const catSims = filteredSims.filter((s: Simulation) => s.category === cat.id);
          if (catSims.length === 0) return null;

          return (
            <section key={cat.id} id={cat.id} className="scroll-mt-48">
              <div className="flex items-center justify-between mb-10 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white text-blue-600 rounded-2xl shadow-sm border border-slate-100"><Boxes size={28} /></div>
                  <h2 className="text-2xl font-black text-slate-900">{cat.name} 실험실</h2>
                </div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono bg-white px-3 py-1 rounded-full border border-slate-100">{catSims.length} Units</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {catSims.map((sim: Simulation) => (
                  <SimulationCard key={sim.id} sim={sim} />
                ))}
              </div>
            </section>
          );
        })}

        {/* 결과 없음 상태 */}
        {filteredSims.length === 0 && (
          <div className="py-40 text-center animate-in zoom-in-95 duration-500 bg-white rounded-[3rem] border border-slate-100">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6"><Search size={40} className="text-slate-200" /></div>
            <p className="text-slate-900 font-black text-2xl mb-2">원하시는 실험을 찾지 못했습니다.</p>
            <button onClick={() => setQuery('')} className="mt-6 text-blue-600 font-bold hover:underline font-black">모든 실험 다시 보기</button>
          </div>
        )}
      </div>
    </div>
  );
}