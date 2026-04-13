'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Atom, ChevronRight, Boxes, Microscope, 
  Search, Eye, Heart, X, Sparkles 
} from 'lucide-react';
import StickyNav from '@/components/StickyNav';
import HeroButtons from '@/components/HeroButtons'; 

interface Category {
  id: string;
  name: string;
  icon_name: string;
  bg_class: string;
  color_class: string;
  sort_order: number;
}

interface Simulation {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string | null;
  view_count: number;
  like_count: number;
  created_at: string;
}

const ICON_MAP: Record<string, any> = {
  Atom: Atom,
  Boxes: Boxes,
};

export default function HomePage() {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const isSearching = searchQuery.trim().length > 0;

  useEffect(() => {
    if (isSearching) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isSearching]);

  useEffect(() => {
    async function fetchData() {
      const [simRes, catRes] = await Promise.all([
        supabase
          .from('simulations')
          .select('id, title, description, category, image_url, view_count, like_count, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('categories')
          .select('id, name, icon_name, bg_class, color_class, sort_order')
          .order('sort_order', { ascending: true })
      ]);
      
      if (simRes.data) setSimulations(simRes.data as Simulation[]);
      if (catRes.data) setCategories(catRes.data as Category[]);
      setLoading(false);
    }
    fetchData();
  }, []);

  const filteredSimulations = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return simulations;
    return simulations.filter(sim => 
      sim.title?.toLowerCase().includes(term) || 
      sim.description?.toLowerCase().includes(term)
    );
  }, [simulations, searchQuery]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50/50 pb-24 font-sans antialiased relative">
      
      {/* 1. 히어로 섹션 */}
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isSearching ? 'max-h-0 opacity-0' : 'max-h-[600px] opacity-100'}`}>
        <section className="bg-white pt-24 pb-8 relative">
          <div className="container mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-black shadow-sm mb-6">
              <Sparkles size={12} className="animate-pulse" />
              전남물리교육연구회 오픈 랩
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black mb-6 tracking-tight text-slate-900 leading-[1.1]">
              수식 너머의 물리를 <br className="hidden md:block" /> 
              <span className="text-blue-600">직관으로 경험하다</span>
            </h1>
            
            <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium text-lg mb-10">
              직접 수치를 조절하며 확인하는 실시간 인터랙티브 시뮬레이션입니다.
            </p>
            <HeroButtons />
          </div>
        </section>
      </div>

      {/* 2. 검색창 (💡 크기를 슬림하게 조절했습니다) */}
      <div className={`w-full transition-all duration-300 ${isSearching ? 'sticky top-[64px] z-[90] bg-slate-50/95 backdrop-blur-md py-3 shadow-sm border-b border-slate-200/50' : 'relative bg-white py-4 z-10'}`}>
        {/* max-w-2xl -> max-w-xl 로 너비 축소 */}
        <div className="max-w-xl mx-auto px-4">
          <div className={`bg-white p-1.5 rounded-full transition-all duration-300 ${isSearching ? 'shadow-md ring-2 ring-blue-100' : 'shadow border border-slate-100'}`}>
            <div className="relative group flex items-center">
              {/* 아이콘 크기 22 -> 18, left-6 -> left-5 */}
              <Search className={`absolute left-5 transition-colors duration-300 ${isSearching ? 'text-blue-600' : 'text-slate-400'}`} size={18} />
              <input 
                type="text"
                placeholder="어떤 물리 원리가 궁금하신가요?"
                /* py-4 -> py-3, 텍스트 크기를 text-sm으로 변경하여 날렵하게 */
                className="w-full bg-transparent pl-12 pr-12 py-3 outline-none text-sm font-bold text-slate-700 placeholder-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isSearching && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="absolute right-5 text-slate-300 hover:text-red-500 p-1 transition-all hover:scale-110"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
          
          {/* 검색 결과 개수 표시 */}
          {isSearching && (
            <div className="mt-2 ml-5 absolute">
              <p className="text-[11px] font-black text-blue-600 animate-in fade-in slide-in-from-top-1">
                총 {filteredSimulations.length}개의 실험을 찾았습니다.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. 카테고리 메뉴 */}
      {!isSearching && (
        <div className="bg-white">
          <StickyNav categories={categories} />
        </div>
      )}

      {/* 4. 검색 결과 리스트 */}
      <div className={`container mx-auto px-6 min-h-screen transition-all duration-500 ${isSearching ? 'pt-8' : 'pt-16'}`}>
        {categories.map((cat) => {
          const catSims = filteredSimulations.filter(sim => sim.category === cat.id);
          if (catSims.length === 0) return null;

          const IconComponent = ICON_MAP[cat.icon_name] || Boxes;

          return (
            <section key={cat.id} id={cat.id} className="scroll-mt-48 mb-24">
              <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-white text-blue-600 rounded-2xl shadow-sm border border-slate-100">
                    <IconComponent size={24} />
                  </div>
                  <h2 className="text-xl font-black text-slate-900">{cat.name} 실험실</h2>
                </div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-100">
                  {catSims.length} Units
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {catSims.map((sim) => (
                  <SimulationCard key={sim.id} sim={sim} />
                ))}
              </div>
            </section>
          );
        })}

        {/* 결과 없음 상태 */}
        {filteredSimulations.length === 0 && isSearching && (
          <div className="py-32 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={32} className="text-slate-200" />
            </div>
            <p className="text-slate-900 font-black text-2xl mb-2">원하시는 실험을 찾지 못했습니다.</p>
            <p className="text-slate-400 font-medium mb-8">다른 검색어를 사용하거나 전체 목록을 확인해 보세요.</p>
            <button 
              onClick={() => {
                setSearchQuery('');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} 
              className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg active:scale-95"
            >
              모든 실험 다시 보기
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function SimulationCard({ sim }: { sim: Simulation }) {
  return (
    <div className="group bg-white rounded-[2.5rem] border border-slate-200 shadow-md overflow-hidden hover:shadow-2xl hover:shadow-blue-200/40 hover:-translate-y-2 transition-all duration-500 flex flex-col relative">
      <Link href={`/view/${sim.id}`} className="block aspect-[16/10] bg-slate-50 relative overflow-hidden">
        {sim.image_url ? (
          <img src={sim.image_url} alt={sim.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-200 bg-slate-50">
            <Boxes size={56} strokeWidth={1} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </Link>
      <div className="p-8 flex flex-col flex-grow">
        <Link href={`/view/${sim.id}`}>
          <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-blue-600 transition-colors tracking-tight line-clamp-1">{sim.title}</h3>
        </Link>
        <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-8 font-medium h-10">{sim.description}</p>
        <div className="mt-auto pt-5 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-4 text-slate-400 text-[11px] font-black uppercase tracking-widest">
            <div className="flex items-center gap-1.5"><Eye size={14} /> {sim.view_count || 0}</div>
            <div className="flex items-center gap-1.5"><Heart size={14} className={(sim.like_count || 0) > 0 ? "text-red-400 fill-red-400" : ""} /> {sim.like_count || 0}</div>
          </div>
          <Link href={`/view/${sim.id}`} className="flex items-center gap-2 py-2 px-4 bg-slate-50 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
            <span className="text-[10px] font-black uppercase tracking-widest">Explore</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}