export const dynamic = 'force-dynamic';

import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default async function HomePage() {
  const { data: simulations, error } = await supabase
    .from('simulations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return <div className="p-10 text-red-500 text-center">데이터 로드 실패: {error.message}</div>;

  return (
    <main className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="mb-16 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">
          Interactive Physics Lab
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          웹 브라우저에서 바로 실행되는 물리 시뮬레이션입니다. <br/>
          변수를 직접 조작하며 물리 현상의 원리를 시각적으로 탐구해보세요.
        </p>
      </section>

      {/* Simulation Grid */}
      {!simulations || simulations.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-slate-800 rounded-3xl">
          <p className="text-slate-500 mb-4 text-lg">등록된 시뮬레이션이 없습니다.</p>
          <Link href="/upload" className="text-blue-500 hover:underline">첫 번째 실험 등록하기 →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {simulations.map((sim) => (
            <div key={sim.id} className="group relative flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 shadow-2xl">
              {/* Image Preview */}
              <div className="aspect-video bg-slate-800 relative overflow-hidden">
                {sim.image_url ? (
                  <img src={sim.image_url} alt={sim.title} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600 italic">No Preview</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
              </div>

              {/* Info */}
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">{sim.title}</h3>
                <p className="text-slate-400 text-sm line-clamp-2 mb-6 h-10">{sim.description}</p>
                <Link 
                  href={sim.url} 
                  className="inline-flex h-10 items-center justify-center rounded-md bg-slate-800 px-4 text-sm font-bold text-white hover:bg-blue-600 transition-colors w-full"
                >
                  실험 시작하기
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}