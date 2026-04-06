// app/page.tsx
import { supabase } from '@/lib/supabase';

export default async function HomePage() {
  // Supabase의 'simulations' 테이블에서 데이터를 가져옵니다.
  const { data: simulations, error } = await supabase.from('simulations').select('*');

  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold text-blue-600 mb-8">물리 시뮬레이션 연구실</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {simulations?.map((sim) => (
          <div key={sim.id} className="border p-4 rounded-xl shadow-sm hover:shadow-md transition">
            <h2 className="text-xl font-semibold">{sim.title}</h2>
            <p className="text-gray-600 my-2">{sim.description}</p>
            <a href={sim.url} className="text-blue-500 font-medium">실험하러 가기 →</a>
          </div>
        ))}
      </div>
    </main>
  );
}