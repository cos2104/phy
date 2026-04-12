export const dynamic = 'force-dynamic';

import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Atom, 
  Zap, 
  Move, 
  Sun, 
  ChevronRight, 
  Plus, 
  Boxes,
  Microscope,
  ArrowRight
} from 'lucide-react';
import StickyNav from '@/components/StickyNav';
import HeroButtons from '@/components/HeroButtons'; 

const ICON_MAP: Record<string, any> = {
  Move: Move,
  Zap: Zap,
  Sun: Sun,
  Atom: Atom,
  Boxes: Boxes,
};

export default async function HomePage() {
  const [simRes, catRes] = await Promise.all([
    supabase.from('simulations').select('*').order('created_at', { ascending: false }),
    supabase.from('categories').select('*').order('sort_order', { ascending: true })
  ]);

  const simulations = Array.isArray(simRes.data) ? simRes.data : [];
  const categories = Array.isArray(catRes.data) ? catRes.data : [];

  if (simRes.error || catRes.error) {
    return <div className="p-10 text-red-500 text-center font-bold">데이터 로드 실패</div>;
  }

  const getGroupedSims = (catId: string) => {
    return simulations.filter(sim => sim.category === catId);
  };

  return (
    <main className="min-h-screen bg-white pb-24 font-sans antialiased relative">
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-blue-50/50 to-transparent blur-[120px] rounded-full -z-10"></div>
        
        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-500 text-xs font-bold mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            가상 시뮬레이션 실험실
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter text-slate-900 leading-[1.1]">
            수식 너머의 물리를 <br />
            <span className="text-blue-600 font-black ">직관으로 경험하다</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-12 font-medium">
            정적인 그림이 아닌, 직접 수치를 조절하며 확인하는 <br className="hidden md:block" />
            실시간 인터랙티브 물리 시뮬레이션 공간입니다.
          </p>

          <HeroButtons />
        </div>
      </section>

      <StickyNav categories={categories} />

      <div className="container mx-auto px-6 space-y-32 mt-16">
        {categories.map((cat) => {
          if (!cat) return null;
          const catSims = getGroupedSims(cat.id);
          const IconComponent = ICON_MAP[cat.icon_name] || Boxes;
          
          if (catSims.length === 0 && cat.id !== 'others') return null;

          // 💡 수정됨: 주석을 return 바깥으로 뺐습니다.
          // 핵심: 메뉴바에 제목이 가려지지 않도록 scroll-mt-48 적용
          return (
            <section key={cat.id} id={cat.id} className="scroll-mt-48">
              <div className="flex items-center justify-between mb-10 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 ${cat.bg_class || 'bg-slate-50'} ${cat.color_class || 'text-slate-500'} rounded-2xl`}>
                    <IconComponent size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">{cat.name} 실험실</h2>
                    <p className="text-sm text-slate-400 font-medium">원리를 탐구하는 핵심 시뮬레이션</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono">{catSims.length} Units</span>
              </div>

              {catSims.length === 0 ? (
                <div className="py-20 bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200 text-center">
                  <Microscope className="mx-auto mb-4 text-slate-300" size={48} strokeWidth={1} />
                  <p className="text-slate-400 font-bold">이 분야의 첫 번째 실험을 기다리고 있습니다.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {catSims.map((sim) => (
                    <SimulationCard key={sim?.id || Math.random()} sim={sim} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}

function SimulationCard({ sim }: { sim: any }) {
  if (!sim) return null;
  return (
    <div className="group bg-white rounded-[2rem] border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-blue-100/50 transition-all duration-500 flex flex-col">
      
      {/* 💡 썸네일 영역에 Link 추가: 이미지를 눌러도 입장 가능 */}
      <Link href={`/view/${sim.id}`} className="block aspect-[16/10] bg-slate-100 relative overflow-hidden">
        {sim.image_url ? (
          <img 
            src={sim.image_url} 
            alt={sim.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
            <Boxes size={48} strokeWidth={1} />
          </div>
        )}
        {/* 마우스 올렸을 때 나타나는 은은한 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </Link>
      
      <div className="p-8 flex flex-col flex-grow">
        {/* 제목 클릭 시에도 입장 가능하도록 제목에 Link 적용 가능 (선택 사항) */}
        <Link href={`/view/${sim.id}`}>
          <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-blue-600 transition-colors tracking-tight line-clamp-1">
            {sim.title}
          </h3>
        </Link>
        
        <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-8 font-medium h-10">
          {sim.description}
        </p>
        
        {/* 하단 입장 버튼 (기존 유지) */}
        <Link 
          href={`/view/${sim.id}`} 
          className="mt-auto flex items-center justify-between group/btn"
        >
          <span className="text-xs font-black text-slate-900 group-hover/btn:text-blue-600 transition-colors uppercase tracking-widest">실험실 입장</span>
          <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center group-hover/btn:bg-blue-600 group-hover/btn:translate-x-1 transition-all shadow-lg">
            <ChevronRight size={18} />
          </div>
        </Link>
      </div>
    </div>
  );
}