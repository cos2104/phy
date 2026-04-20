'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
  ChevronLeft, Maximize2, RotateCcw, Share2, 
  Download, FileText, Eye, Heart, Calendar, 
  Atom, Info, Sparkles 
} from 'lucide-react';

export default function ViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  
  const [sim, setSim] = useState<any>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [viewCount, setViewCount] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    
    async function fetchData() {
      try {
        const { data, error } = await supabase.from('simulations').select('*').eq('id', id).single();
        if (error) throw error;
        setSim(data);
        setLikes(data.like_count || 0);
        setViewCount((data.view_count || 0) + 1);

        await supabase.from('simulations').update({ view_count: (data.view_count || 0) + 1 }).eq('id', id);

        const response = await fetch(data.url);
        const text = await response.text();
        setHtmlContent(text);

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

  const handleLike = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return toast.error('로그인이 필요한 기능입니다.');

    try {
      if (isLiked) {
        await supabase.from('simulation_likes').delete().eq('simulation_id', id).eq('user_id', session.user.id);
        await supabase.from('simulations').update({ like_count: likes - 1 }).eq('id', id);
        setLikes(prev => prev - 1);
        setIsLiked(false);
      } else {
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
        <p className="text-slate-500 font-bold tracking-tight">실험 장비를 세팅 중입니다...</p>
      </div>
    </div>
  );

  if (!sim) return <div className="fixed inset-0 bg-white z-[100] flex items-center justify-center font-bold">실험실을 찾을 수 없습니다.</div>;

  return (
    <main className="fixed inset-0 z-[100] flex flex-col bg-white overflow-hidden font-sans antialiased text-slate-900">
      
      {/* 1. 상단 헤더 (높이 고정) */}
      <header className="h-14 border-b border-slate-200 bg-white flex justify-between items-center px-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all">
            <ChevronLeft size={20} />
          </button>
          <div className="h-4 w-[1px] bg-slate-200" />
          <div className="flex items-center gap-2">
            <Atom size={18} className="text-blue-600" />
            <h1 className="text-sm font-black text-slate-800 tracking-tight truncate max-w-sm">
              {sim.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={handleReload} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="다시 시작">
            <RotateCcw size={18} />
          </button>
          <button onClick={handleShare} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="링크 복사">
            <Share2 size={18} />
          </button>
          <button onClick={toggleFullScreen} className="ml-2 bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-slate-200">
            <Maximize2 size={14} /> 전체 화면
          </button>
        </div>
      </header>

      {/* 2. 메인 영역 (스크롤 방지: h-full과 overflow-hidden 활용) */}
      <div className="flex-grow flex overflow-hidden bg-slate-50">
        
        {/* 좌측 패널 (연구실 스타일 테마 적용) */}
        <aside className="w-[340px] border-r border-slate-200 bg-white hidden lg:flex flex-col shrink-0">
          <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
            
            {/* 상단 배지 */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
              <Sparkles size={12} /> Physics Lab
            </div>

            {/* 제목 영역 */}
            <h2 className="text-2xl font-black text-slate-900 leading-[1.15] mb-6 tracking-tighter">
              {sim.title}
            </h2>

            {/* 통계 배지 그룹 (세련된 스타일) */}
            <div className="flex flex-wrap gap-2 mb-8">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                <Eye size={13} /> {viewCount} Views
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                <Calendar size={13} /> {new Date(sim.created_at).toLocaleDateString()}
              </div>
            </div>

            {/* 실험 설명 섹션 */}
            <div className="space-y-4 mb-10">
              <div className="flex items-center gap-2 text-slate-400">
                <Info size={16} />
                <span className="text-[11px] font-black uppercase tracking-widest">실험 가이드</span>
              </div>
              <p className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                {sim.description || '이 실험에 대한 설명이 아직 등록되지 않았습니다.'}
              </p>
            </div>

            {/* 학습 자료 카드 */}
            {sim.worksheet_url && (
              <div className="mb-8">
                <a 
                  href={sim.worksheet_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-900/5 transition-all group"
                >
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 group-hover:bg-blue-50 transition-colors">
                    <FileText size={20} className="text-slate-400 group-hover:text-blue-600" />
                  </div>
                  <div className="flex flex-col flex-grow">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Document</span>
                    <span className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors">학습지 다운로드</span>
                  </div>
                  <Download size={18} className="text-slate-300 group-hover:text-blue-500" />
                </a>
              </div>
            )}
          </div>

          {/* 💡 3. 분리된 좋아요 버튼 영역 (하단 고정) */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/50">
            <button 
              onClick={handleLike}
              className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 ${
                isLiked 
                ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100' 
                : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} className={isLiked ? 'animate-pulse' : ''} />
              {isLiked ? '이 실험을 좋아합니다' : '이 실험 추천하기'}
              <span className="ml-1 opacity-60">({likes})</span>
            </button>
          </div>
        </aside>

        {/* 우측 시뮬레이션 영역 (배젤 느낌 추가) */}
        <div ref={containerRef} className="flex-grow p-4 lg:p-6 overflow-hidden">
          <div className="w-full h-full bg-black rounded-[2rem] overflow-hidden shadow-2xl relative border-[8px] border-slate-800 shadow-blue-900/10">
            <iframe 
              ref={iframeRef}
              srcDoc={htmlContent} 
              className="absolute inset-0 w-full h-full border-none"
              sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
              title={sim.title}
            />
          </div>
        </div>
      </div>

      <style jsx global>{`
        :fullscreen { background-color: black !important; padding: 0 !important; }
        :fullscreen iframe { width: 100vw !important; height: 100vh !important; border: none !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </main>
  );
}