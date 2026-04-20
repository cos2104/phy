'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Atom, Zap, Move, Sun, Boxes, Microscope, Magnet, Activity, Wind, 
  Droplets, Thermometer, Eye, Compass, Waves, Flame, Rocket, Orbit, 
  Satellite, Cpu, Layers, Gauge, FlaskConical, Feather, 
  ChevronRight, ArrowRight, Plus, Sparkles, Search, Heart, X,
  Pencil // 💡 수정하기(연필) 아이콘 추가
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
  user_id: string; // 💡 작성자 아이디 추가
}

const ICON_MAP: Record<string, any> = {
  Move, Zap, Sun, Atom, Boxes, Microscope, Magnet, Activity, Wind,
  Droplets, Thermometer, Eye, Compass, Waves, Flame, Rocket, Orbit,
  Satellite, Cpu, Layers, Gauge, FlaskConical, Feather, Sparkles, Search, Heart, X
};

export default function HomePage() {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 💡 현재 로그인한 유저의 프로필(관리자 여부 등)을 저장할 상태 추가
  const [myProfile, setMyProfile] = useState<{ id: string; is_admin: boolean } | null>(null);

  const isSearching = searchQuery.trim().length > 0;

  useEffect(() => {
    if (isSearching) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isSearching]);

  useEffect(() => {
    async function fetchData() {
      // 1. 시뮬레이션 목록과 카테고리 가져오기
      const [simRes, catRes] = await Promise.all([
        supabase
          .from('simulations')
          // 💡 select 쿼리에 user_id 추가
          .select('id, title, description, category, image_url, view_count, like_count, created_at, user_id')
          .order('created_at', { ascending: false }),
        supabase
          .from('categories')
          .select('id, name, icon_name, bg_class, color_class, sort_order')
          .order('sort_order', { ascending: true })
      ]);
      
      if (simRes.data) setSimulations(simRes.data as Simulation[]);
      if (catRes.data) setCategories(catRes.data as Category[]);

      // 2. 💡 현재 접속 중인 세션(유저) 정보 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, is_admin')
          .eq('id', session.user.id)
          .maybeSingle();
        if (profile) setMyProfile(profile);
      }

      setLoading(false);
      setTimeout(() => {
        const savedPos = sessionStorage.getItem('main_scroll_pos');
        if (savedPos) {
          window.scrollTo(0, parseInt(savedPos));
          sessionStorage.removeItem('main_scroll_pos'); // 한 번 쓰면 지우기
        }
      }, 100); // 0.1초 정도의 아주 미세한 지연을 주어 렌더링 시간을 확보합니다.
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
    <main className="min-h-screen bg-slate-50/50 pb-20 sm:pb-24 font-sans antialiased relative">
      
      {/* 1. 히어로 섹션 */}
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isSearching ? 'max-h-0 opacity-0' : 'max-h-[600px] opacity-100'}`}>
        <section className="bg-white pt-16 sm:pt-16 pb-6 sm:pb-8 relative">
          <div className="container mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[11px] sm:text-xs font-black shadow-sm mb-4 sm:mb-5">
              <Sparkles size={12} className="animate-pulse" />
              전남물리교육연구회 오픈 랩
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 sm:mb-5 tracking-tight text-slate-900 leading-[1.2] sm:leading-[1.15]">
              수식 너머의 물리를 <br className="hidden md:block" /> 
              <span className="text-blue-600">직관으로 경험하다</span>
            </h1>
            
            <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium text-sm sm:text-base mb-6 sm:mb-8 px-2 sm:px-0">
              직접 수치를 조절하며 확인하는 실시간 인터랙티브 시뮬레이션입니다.
            </p>
            <HeroButtons />
          </div>
        </section>
      </div>

      {/* 2. 검색창 */}
      <div className={`w-full transition-all duration-300 ${isSearching ? 'sticky top-14 sm:top-[64px] z-[90] bg-slate-50/95 backdrop-blur-md py-2.5 sm:py-3 shadow-sm border-b border-slate-200/50' : 'relative bg-white py-3 sm:py-4 z-10'}`}>
        <div className="max-w-xl mx-auto px-4">
          <div className={`bg-white p-1.5 rounded-full transition-all duration-300 ${isSearching ? 'shadow-md ring-2 ring-blue-100' : 'shadow border border-slate-100'}`}>
            <div className="relative group flex items-center">
              <Search className={`absolute left-5 transition-colors duration-300 ${isSearching ? 'text-blue-600' : 'text-slate-400'}`} size={18} />
              <input 
                type="text"
                placeholder="어떤 물리 원리가 궁금하신가요?"
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
      <div className={`container mx-auto px-3 sm:px-5 lg:px-6 min-h-screen transition-all duration-500 ${isSearching ? 'pt-6 sm:pt-8' : 'pt-10 sm:pt-12'}`}>
        {categories.map((cat) => {
          const catSims = filteredSimulations.filter(sim => sim.category === cat.id);
          if (catSims.length === 0) return null;

          const IconComponent = ICON_MAP[cat.icon_name] || Boxes;

          return (
            <section key={cat.id} id={cat.id} className="scroll-mt-36 sm:scroll-mt-44 mb-12 sm:mb-16">
              <div className="flex items-center justify-between mb-6 sm:mb-8 border-b border-slate-100 pb-4 sm:pb-5">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-2.5 bg-white text-blue-600 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100">
                    <IconComponent size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">{cat.name} 실험실</h2>
                </div>
                <span className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-widest bg-white px-2.5 sm:px-3 py-1 rounded-full border border-slate-100">
                  {catSims.length} Units
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
                {catSims.map((sim) => (
                  <SimulationCard key={sim.id} sim={sim} myProfile={myProfile} />
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

// 💡 Props로 myProfile을 함께 받습니다.
function SimulationCard({ sim, myProfile }: { sim: Simulation, myProfile: { id: string; is_admin: boolean } | null }) {
  // 💡 작성자이거나 관리자일 경우 true
  const canEdit = myProfile && (myProfile.is_admin || myProfile.id === sim.user_id);

  return (
    <div className="group bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm sm:shadow-md overflow-hidden hover:shadow-xl hover:shadow-blue-200/40 sm:hover:-translate-y-1.5 transition-all duration-300 flex flex-col relative">
      
      {/* 💡 권한이 있을 경우 썸네일 우측 상단에 나타나는 수정 버튼 */}
      {canEdit && (
        <Link 
          href={`/upload?id=${sim.id}`}
          onClick={() => sessionStorage.setItem('main_scroll_pos', window.scrollY.toString())}
          className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 p-2 bg-white/90 hover:bg-white text-slate-500 hover:text-blue-600 rounded-xl shadow-sm backdrop-blur-md transition-all z-20 opacity-90 hover:opacity-100 hover:scale-105"
          title="수정하기"
        >
          <Pencil size={15} className="sm:w-[18px] sm:h-[18px]" />
        </Link>
      )}

      <Link href={`/view/${sim.id}`} className="block aspect-video bg-slate-100 relative overflow-hidden flex items-center justify-center">
        {sim.image_url ? (
          <img 
            src={sim.image_url} 
            alt={sim.title} 
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
            <Boxes size={48} strokeWidth={1.5} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </Link>

      <div className="p-3 sm:p-4 lg:p-5 flex flex-col flex-grow bg-white z-10">
        <Link href={`/view/${sim.id}`}>
          <h3 className="text-sm sm:text-base lg:text-lg font-black text-slate-900 mb-1.5 sm:mb-2 group-hover:text-blue-600 transition-colors tracking-tight line-clamp-2 sm:line-clamp-1">{sim.title}</h3>
        </Link>
        <p className="text-slate-500 text-xs sm:text-sm leading-relaxed line-clamp-2 mb-3 sm:mb-4 font-medium min-h-[2.2rem] sm:min-h-[2.6rem]">{sim.description}</p>
        <div className="mt-auto pt-2.5 sm:pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 text-slate-400 text-[10px] sm:text-[11px] font-black uppercase tracking-wide">
            <div className="flex items-center gap-1"><Eye size={12} className="sm:w-[14px] sm:h-[14px]" /> {sim.view_count || 0}</div>
            <div className="flex items-center gap-1"><Heart size={12} className={`sm:w-[14px] sm:h-[14px] ${(sim.like_count || 0) > 0 ? "text-red-400 fill-red-400" : ""}`} /> {sim.like_count || 0}</div>
          </div>
          <Link href={`/view/${sim.id}`} className="flex items-center gap-1 sm:gap-2 py-1.5 sm:py-2 px-2.5 sm:px-3 bg-slate-50 rounded-lg sm:rounded-xl hover:bg-blue-600 hover:text-white transition-all min-h-[34px]">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wide">실험하기</span>
            <ChevronRight size={12} className="sm:w-[14px] sm:h-[14px]" />
          </Link>
        </div>
      </div>
    </div>
  );
}