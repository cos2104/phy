// app/page.tsx
export const dynamic = 'force-dynamic';

import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default async function HomePage() {
  const { data: simulations, error } = await supabase.from('simulations').select('*');

  // 에러 발생 시 처리
  if (error) {
    return <div className="p-10 text-red-500 bg-slate-900 min-h-screen">에러 발생: {error.message}</div>;
  }

  return (
    <main className="p-10 bg-slate-900 min-h-screen text-white">
      {/* 헤더 섹션: 제목과 버튼이 항상 세트로 보입니다 */}
      <div className="flex justify-between items-center mb-12 border-b border-slate-700 pb-6">
        <h1 className="text-3xl font-bold text-blue-400">물리 시뮬레이션 연구실</h1>
        <Link href="/upload" className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg font-bold transition-colors">
          신규 등록
        </Link>
      </div>

      {/* 시뮬레이션 목록 섹션 */}
      {!simulations || simulations.length === 0 ? (
        // 데이터가 없을 때
        <div className="text-center py-20 bg-slate-800 rounded-2xl border-2 border-dashed border-slate-700">
          <p className="text-xl text-slate-400">아직 등록된 시뮬레이션이 없습니다.</p>
          <p className="text-sm text-slate-500 mt-2">우측 상단의 '신규 등록' 버튼을 눌러 첫 실험을 추가해보세요!</p>
        </div>
      ) : (
        // 데이터가 있을 때 그리드 표시
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {simulations.map((sim) => (
            <div key={sim.id} className="border border-slate-700 p-6 rounded-xl shadow-sm bg-slate-800 hover:border-blue-500 transition-all group">
              <h2 className="text-xl font-semibold group-hover:text-blue-400 transition-colors">{sim.title}</h2>
              <p className="text-slate-400 my-4 text-sm leading-relaxed">{sim.description}</p>
              {/* 내부 링크라면 <a> 대신 <Link>를 쓰는 것이 Next.js 성능에 더 좋습니다 */}
              <Link href={sim.url} className="text-blue-400 font-medium hover:underline text-sm">
                실험하러 가기 →
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}