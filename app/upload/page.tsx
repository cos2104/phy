'use client'; // 버튼 클릭 등 상호작용이 필요하므로 클라이언트 컴포넌트로 설정

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    image_url: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Supabase에 데이터 한 줄 추가!
    const { error } = await supabase
      .from('simulations')
      .insert([formData]);

    if (error) {
      alert('업로드 실패: ' + error.message);
    } else {
      alert('새로운 시뮬레이션이 등록되었습니다!');
      router.push('/'); // 메인 화면으로 이동
      router.refresh(); // 데이터 새로고침
    }
    setLoading(false);
  };

  return (
    <main className="p-10 bg-slate-900 min-h-screen text-white">
      <div className="max-w-md mx-auto bg-slate-800 p-8 rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold text-blue-400 mb-6">시뮬레이션 등록</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-slate-400">시뮬레이션 이름</label>
            <input 
              required
              className="w-full p-2 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-blue-500"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-slate-400">설명</label>
            <textarea 
              required
              className="w-full p-2 rounded bg-slate-700 border border-slate-600 h-24"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-slate-400">실행 주소 (예: /simulations/lens.html)</label>
            <input 
              required
              className="w-full p-2 rounded bg-slate-700 border border-slate-600"
              value={formData.url}
              onChange={(e) => setFormData({...formData, url: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-slate-400">썸네일 이미지 주소 (선택)</label>
            <input 
              className="w-full p-2 rounded bg-slate-700 border border-slate-600"
              value={formData.image_url}
              onChange={(e) => setFormData({...formData, image_url: e.target.value})}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors mt-4"
          >
            {loading ? '등록 중...' : '시뮬레이션 올리기'}
          </button>
        </form>
      </div>
    </main>
  );
}