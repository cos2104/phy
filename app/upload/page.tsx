'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert('HTML 파일을 선택해주세요.');
    
    setLoading(true);

    try {
      // 1. Supabase Storage에 파일 업로드
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `files/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('simulations')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. 업로드된 파일의 공개 URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('simulations')
        .getPublicUrl(filePath);

      // 3. DB(simulations 테이블)에 정보 저장
      const { error: dbError } = await supabase
        .from('simulations')
        .insert([{ 
          title, 
          description, 
          url: publicUrl, // 저장된 파일 주소를 넣음
          image_url: null // 3번 단계에서 구현할 예정
        }]);

      if (dbError) throw dbError;

      alert('성공적으로 등록되었습니다!');
      router.push('/');
      router.refresh();
    } catch (err: any) {
      alert('에러 발생: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
        <h1 className="text-3xl font-bold mb-8 text-blue-400">새 시뮬레이션 등록</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">실험 제목</label>
            <input 
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="예: 광전효과 가상 실험"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">실험 설명</label>
            <textarea 
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white h-32 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="실험의 목적과 조작 방법을 설명해주세요."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">HTML 파일 업로드</label>
            <input 
              type="file"
              accept=".html"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 transition-all"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
          >
            {loading ? '파일 분석 및 업로드 중...' : '시뮬레이션 등록하기'}
          </button>
        </form>
      </div>
    </main>
  );
}