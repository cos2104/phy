'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
// Eye(조회수), Heart(좋아요) 아이콘 추가
import { ChevronLeft, Maximize2, RotateCcw, Share2, Download, FileText, Eye, Heart } from 'lucide-react';

export default function ViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  
  const [sim, setSim] = useState<any>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // 💡 좋아요 관련 상태
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [viewCount, setViewCount] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    
    async function fetchData() {
      try {
        // 1. 기본 데이터 가져오기
        const { data, error } = await supabase.from('simulations').select('*').eq('id', id).single();
        if (error) throw error;
        setSim(data);
        setLikes(data.like_count || 0);
        setViewCount((data.view_count || 0) + 1);

        // 2. 조회수 1 증가시키기 (간편한 직접 업데이트 방식)
        await supabase.from('simulations').update({ view_count: (data.view_count || 0) + 1 }).eq('id', id);

        // 3. 시뮬레이션 HTML 내용 가져오기
        const response = await fetch(data.url);
        const text = await response.text();
        setHtmlContent(text);

        // 4. 현재 사용자가 이 실험을 '좋아요' 했는지 확인
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: likeData } = await supabase
            .from('simulation_likes')
            .select('*')
            .eq('simulation_id', id)
            .eq('user_id', session.user.id)
            .maybeSingle();
          setIsLiked(!!likeData);
        }
      } catch (err) {
        console.error('로드 실패:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  // 💡 좋아요 토글 핸들러
  const handleLike = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return toast.error('로그인이 필요한 기능입니다.');

    try {
      if (isLiked) {
        // 좋아요 취소
        await supabase.from('simulation_likes').delete().eq('simulation_id', id).eq('user_id', session.user.id);
        await supabase.from('simulations').update({ like_count: likes - 1 }).eq('id', id);
        setLikes(prev => prev - 1);
        setIsLiked(false);
      } else {
        // 좋아요 추가
        await supabase.from('simulation_likes').insert({ simulation_id: id, user_id: session.user.id });
        await supabase.from('simulations').update({ like_count: likes + 1 }).eq('id', id);
        setLikes(prev => prev + 1);
        setIsLiked(true);
        toast.success('이 실험을 좋아합니다! ❤️');
      }
    } catch (err) {
      toast.error('오류가 발생했습니다.');
    }
  };

  const handleReload = () => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = htmlContent;
      toast.success('실험을 초기화했습니다.');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('실험실 링크가 복사되었습니다!');
    } catch (err) {
      toast.error('링크 복사에 실패했습니다.');
    }
  };

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
        <p className="text-slate-500 font-bold">실험 장비를 세팅 중입니다...</p>
      </div>
    </div>
  );

  if (!sim) return <div className="fixed inset-0 bg-white z-[100] flex items-center justify-center font-bold">실험실을 찾을 수 없습니다.</div>;

  return (
    <main className="fixed inset-0 z-[100] flex flex-col bg-white overflow-hidden font-sans antialiased text-slate-900">
      
      {/* 1. 상단 헤더 */}
      <header className="h-14 border-b border-slate-200 bg-white flex justify-between items-center px-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all">
            <ChevronLeft size={20} />
          </button>
          <div className="h-4 w-[1px] bg-slate-200" />
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
          <button onClick={toggleFullScreen} className="ml-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-100 transition-all active:scale-95">
            <Maximize2 size={14} /> 전체 화면
          </button>
        </div>
      </header>

      {/* 2. 메인 영역 */}
      <div className="flex-grow flex overflow-hidden">
        
        {/* 좌측 패널 */}
        <aside className="w-80 border-r border-slate-200 bg-white hidden lg:flex flex-col shrink-0 overflow-y-auto">
          <div className="p-6 flex flex-col h-full">
            
            {/* 제목과 통계 (조회수, 좋아요) */}
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-slate-900 leading-tight mb-3">
                {sim.title}
              </h2>
              <div className="flex items-center gap-4 text-[11px] font-bold tracking-wider">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Eye size={14} /> {viewCount}
                </div>
                <button 
                  onClick={handleLike}
                  className={`flex items-center gap-1.5 transition-colors ${isLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-400'}`}
                >
                  <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} /> {likes}
                </button>
                <span className="text-slate-200">|</span>
                <span className="text-slate-400 uppercase">{new Date(sim.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* 실험 설명 */}
            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap mb-8">
              {sim.description || '등록된 설명이 없습니다.'}
            </div>

            {/* 학습 자료 */}
            {sim.worksheet_url && (
              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">학습 자료</h3>
                <a 
                  href={sim.worksheet_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  download
                  className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                >
                  <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-100 group-hover:text-blue-600 transition-colors">
                    <FileText size={20} className="text-slate-500 group-hover:text-blue-600" />
                  </div>
                  <div className="flex flex-col flex-grow">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Worksheet</span>
                    <span className="text-sm font-bold text-slate-700 group-hover:text-blue-700 transition-colors">학습지 다운로드</span>
                  </div>
                  <Download size={18} className="text-slate-400 group-hover:text-blue-500" />
                </a>
              </div>
            )}
          </div>
        </aside>

        {/* 우측 시뮬레이션 영역 */}
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

      <style jsx global>{`
        :fullscreen { background-color: black !important; }
        :fullscreen iframe { width: 100vw !important; height: 100vh !important; }
      `}</style>
    </main>
  );
}