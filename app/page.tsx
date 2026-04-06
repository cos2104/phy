// app/page.tsx 수정 버전
export const dynamic = 'force-dynamic';
import { supabase } from '@/lib/supabase';

export default async function HomePage() {
  const { data: simulations, error } = await supabase.from('simulations').select('*');

  // 만약 에러가 났다면 화면에 에러 내용을 뿌려줍니다.
  if (error) {
    return <div className="p-10 text-red-500">에러 발생: {error.message}</div>;
  }

  // 데이터가 성공적으로 왔는데 비어있는 경우
  if (!simulations || simulations.length === 0) {
    return <div className="p-10 text-white">데이터베이스가 비어있습니다. Supabase를 확인해주세요!</div>;
  }

  return (
    <main className="p-10 bg-slate-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold text-blue-400 mb-8">물리 시뮬레이션 연구실</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {simulations.map((sim) => (
          <div key={sim.id} className="border border-slate-700 p-4 rounded-xl shadow-sm bg-slate-800">
            <h2 className="text-xl font-semibold">{sim.title}</h2>
            <p className="text-slate-400 my-2">{sim.description}</p>
            <a href={sim.url} className="text-blue-400 font-medium">실험하러 가기 →</a>
          </div>
        ))}
      </div>
    </main>
  );
}