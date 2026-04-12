'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ChevronLeft, Maximize2, RotateCcw, Share2 } from 'lucide-react';

export default function ViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  
  const [sim, setSim] = useState<any>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    async function fetchData() {
      try {
        const { data, error } = await supabase.from('simulations').select('*').eq('id', id).single();
        if (error) throw error;
        setSim(data);

        const response = await fetch(data.url);
        const text = await response.text();
        setHtmlContent(text);
      } catch (err) {
        console.error('데이터 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleReload = () => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = htmlContent;
      toast.success('실험을 초기화했습니다.');
    }
  };

  // ✅ [수정] 링크 즉시 복사 기능
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('실험실 링크가 복사되었습니다!');
    } catch (err) {
      toast.error('링크 복사에 실패했습니다.');
    }
  };

  // ✅ [수정] 전체 화면 기능 (여백 제거)
  const toggleFullScreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch((err) => {
          toast.error(`전체 화면 전환 실패: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  if (loading) return (
    <div className="fixed inset-0 bg-white z-[100] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500 font-bold">실험 장비를 세팅 중입니다...</p>
      </div>
    </div>
  );

  if (!sim) return <div className="fixed inset-0 bg-white z-[100] flex items-center justify-center font-bold">실험실을 찾을 수 없습니다.</div>;

  return (
    // ✅ [수정] fixed inset-0 로 레이아웃 고정 (하단 푸터 무시)
    <main className="fixed inset-0 z-[100] flex flex-col bg-white overflow-hidden font-sans antialiased text-slate-900">
      
      {/* 1. 상단 헤더 */}
      <header className="h-14 border-b border-slate-200 bg-white flex justify-between items-center px-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/')} 
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="h-4 w-[1px] bg-slate-200" />
          {/* 실제 제목만 강조 */}
          <h1 className="text-sm font-black text-slate-800 tracking-tight truncate max-w-sm">
            {sim.title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleReload} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="다시 시작">
            <RotateCcw size={18} />
          </button>
          <button onClick={handleShare} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="링크 복사">
            <Share2 size={18} />
          </button>
          <button 
            onClick={toggleFullScreen}
            className="ml-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-100 transition-all active:scale-95"
          >
            <Maximize2 size={14} /> 전체 화면
          </button>
        </div>
      </header>

      {/* 2. 메인 영역 */}
      <div className="flex-grow flex overflow-hidden">
        
        {/* 좌측 패널 (레이블 제거 및 스타일 정리) */}
        <aside className="w-72 border-r border-slate-100 bg-slate-50/50 hidden lg:flex flex-col p-6 shrink-0 overflow-y-auto">
          {/* 💡 "실험 목표" 제목 제거, 실제 제목만 크게 표시 */}
          <div className="mb-8">
            <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
              {sim.title}
            </h2>
          </div>

          <div className="space-y-6">
            {/* 💡 "실험 설명" 레이블 제거, 실제 내용만 카드로 표시 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {sim.description || '설명이 없습니다.'}
            </div>
            
            <div className="pt-6 border-t border-slate-200">
              <ul className="space-y-3">
                <li className="flex justify-between items-center text-[11px] font-medium">
                  <span className="text-slate-400 uppercase tracking-wider">Category</span>
                  <span className="text-blue-600 font-bold">물리 시뮬레이션</span>
                </li>
                <li className="flex justify-between items-center text-[11px] font-medium">
                  <span className="text-slate-400 uppercase tracking-wider">Created</span>
                  <span className="text-slate-500 font-bold">{new Date(sim.created_at).toLocaleDateString()}</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-auto pt-6">
             <div className="p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-100">
               <p className="text-[11px] text-white font-bold leading-relaxed">
                 마우스 드래그로 시점을 변경하고,<br/> 제어판을 통해 값을 조절해 보세요.
               </p>
             </div>
          </div>
        </aside>

        {/* 우측 시뮬레이션 영역 (전체 화면 대응) */}
        <div ref={containerRef} className="flex-grow bg-slate-100 relative overflow-hidden">
          <iframe 
            ref={iframeRef}
            srcDoc={htmlContent} 
            className="absolute inset-0 w-full h-full border-none shadow-inner bg-black"
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
            title={sim.title}
          />
        </div>
      </div>

      {/* 전체화면 시 브라우저 기본 스타일 제거를 위한 인라인 스타일 */}
      <style jsx global>{`
        :fullscreen {
          background-color: black !important;
        }
        :fullscreen iframe {
          width: 100vw !important;
          height: 100vh !important;
        }
      `}</style>
    </main>
  );
}