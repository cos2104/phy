'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import html2canvas from 'html2canvas'; // 캡처 도구 임포트

export default function UploadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // 캡처를 위한 숨겨진 보관소 참조
  const hiddenContainerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !hiddenContainerRef.current) return alert('파일을 선택해주세요.');
    
    setLoading(true);

    try {
      // --- [Step 1: HTML 파일 읽기 및 캡처 준비] ---
      const htmlText = await file.text();
      const container = hiddenContainerRef.current;
      container.innerHTML = htmlText; // 숨겨진 곳에 HTML 주입

      // 스타일이 깨지지 않게 잠시 대기 후 캡처
      await new Promise((resolve) => setTimeout(resolve, 500));
      const canvas = await html2canvas(container, {
        width: 800,
        height: 450,
        scale: 1,
        logging: false,
        useCORS: true
      });

      // 캡처된 이미지를 파일(Blob)로 변환
      const imageBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!imageBlob) throw new Error('캡처 실패');

      // --- [Step 2: 파일명 정의] ---
      const timestamp = Date.now();
      const htmlFileName = `files/${timestamp}_${file.name}`;
      const thumbFileName = `thumbs/${timestamp}_thumb.png`;

      // --- [Step 3: HTML 파일 업로드] ---
      const { error: htmlError } = await supabase.storage
        .from('simulations')
        .upload(htmlFileName, file);
      if (htmlError) throw htmlError;

      // --- [Step 4: 썸네일 이미지 업로드] ---
      const { error: thumbError } = await supabase.storage
        .from('simulations')
        .upload(thumbFileName, imageBlob);
      if (thumbError) throw thumbError;

      // --- [Step 5: 공개 URL 가져오기] ---
      const { data: { publicUrl: htmlUrl } } = supabase.storage.from('simulations').getPublicUrl(htmlFileName);
      const { data: { publicUrl: thumbUrl } } = supabase.storage.from('simulations').getPublicUrl(thumbFileName);

      // --- [Step 6: DB에 최종 저장] ---
      const { error: dbError } = await supabase.from('simulations').insert([{ 
        title, 
        description, 
        url: htmlUrl, 
        image_url: thumbUrl // 자동 생성된 이미지 주소 저장!
      }]);

      if (dbError) throw dbError;

      alert('시뮬레이션과 썸네일이 자동으로 등록되었습니다!');
      router.push('/');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert('에러 발생: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
        <h1 className="text-3xl font-bold mb-8 text-blue-400">시뮬레이션 등록</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 제목/설명 입력창은 동일하게 유지 */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">실험 제목</label>
            <input required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">실험 설명</label>
            <textarea required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white h-32" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">HTML 파일 업로드</label>
            <input type="file" accept=".html" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-blue-600 file:text-white" />
          </div>
          
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all">
            {loading ? '시뮬레이션 분석 및 캡처 중...' : '자동 썸네일과 함께 등록하기'}
          </button>
        </form>
      </div>

      {/* 📸 캡처를 위한 보이지 않는 보관소 (화면 밖으로 치워둠) */}
      <div 
        ref={hiddenContainerRef} 
        style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '800px', height: '450px', background: 'white', overflow: 'hidden' }}
      />
    </main>
  );
}