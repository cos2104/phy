'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  ChevronLeft, Maximize2, RotateCcw, Share2, 
  Download, FileText, Eye, Heart, Calendar, 
  Atom, Info, Sparkles, Boxes, Zap, Move, Sun, Microscope, Magnet, Activity,
  Wind, Droplets, Thermometer, Compass, Waves, Flame, Rocket, Orbit, Satellite,
  Cpu, Layers, Gauge, FlaskConical, Feather, 
  PanelLeftClose, PanelLeftOpen, 
  Pencil, FileCode
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  Move, Zap, Sun, Atom, Boxes, Microscope, Magnet, Activity, Wind,
  Droplets, Thermometer, Eye, Compass, Waves, Flame, Rocket, Orbit,
  Satellite, Cpu, Layers, Gauge, FlaskConical, Feather
};

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
  
  const [categoryInfo, setCategoryInfo] = useState<{ id: string; name: string; icon_name: string } | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; icon_name: string }>>([]);
  const [menuSims, setMenuSims] = useState<Array<{ id: string; title: string; category: string }>>([]);
  const [hoveredCategory, setHoveredCategory] = useState<string>('');
  const [lockedCategory, setLockedCategory] = useState<string | null>(null);
  
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isCatalogSticky, setIsCatalogSticky] = useState(false); // 💡 메뉴 클릭 고정 상태 추가
  const [mobileTab, setMobileTab] = useState<'sim' | 'info'>('sim');

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [myProfile, setMyProfile] = useState<{ id: string; is_admin: boolean } | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const catalogRef = useRef<HTMLDivElement>(null);

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

        const [catRes, catsRes, simsRes] = await Promise.all([
          supabase.from('categories').select('id, name, icon_name').eq('id', data.category).maybeSingle(),
          supabase.from('categories').select('id, name, icon_name').order('sort_order', { ascending: true }),
          supabase.from('simulations').select('id, title, category').order('created_at', { ascending: false })
        ]);
        if (catRes.data) setCategoryInfo(catRes.data);
        if (catsRes.data) {
          setCategories(catsRes.data);
          if (!hoveredCategory && catsRes.data.length > 0) {
            setHoveredCategory(data.category || catsRes.data[0].id);
          }
        }
        if (simsRes.data) setMenuSims(simsRes.data);

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, is_admin')
            .eq('id', session.user.id)
            .maybeSingle();
          if (profile) setMyProfile(profile);

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

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!catalogRef.current) return;
      const target = event.target as Node;
      if (!catalogRef.current.contains(target)) {
        setIsCatalogOpen(false);
        setIsCatalogSticky(false); // 💡 영역 밖 클릭 시 고정 해제
        setLockedCategory(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

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

  const handleDownloadHtml = async (url: string, title: string) => {
    const loadingToast = toast.loading('파일을 준비 중입니다...');
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('파일을 가져올 수 없습니다.');
      const blob = await response.blob();
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${title}.html`;
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('다운로드가 완료되었습니다!', { id: loadingToast });
    } catch (error) {
      console.error('다운로드 오류:', error);
      toast.error('다운로드에 실패했습니다.', { id: loadingToast });
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

  const activeCategory = lockedCategory || hoveredCategory || categoryInfo?.id || sim.category;
  const simsInActiveCategory = menuSims.filter((s) => s.category === activeCategory);
  const HeaderIcon = ICON_MAP[categoryInfo?.icon_name || sim.category] || Atom;

  const canEdit = myProfile && (myProfile.is_admin || myProfile.id === sim.user_id);

  return (
    <main className="fixed inset-0 z-[100] flex flex-col bg-white overflow-hidden font-sans antialiased text-slate-900">
      
      {/* 1. 상단 헤더 */}
      <header className="h-14 border-b border-slate-200 bg-white flex justify-between items-center px-2 sm:px-4 shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-1 sm:gap-2">
          <button onClick={() => router.push('/')} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all" title="메인으로">
            <ChevronLeft size={20} />
          </button>

          <div
            ref={catalogRef}
            className="relative"
            onMouseEnter={() => setIsCatalogOpen(true)}
            onMouseLeave={() => {
              // 💡 클릭으로 고정된 상태가 아닐 때만 닫기
              if (!isCatalogSticky) {
                setIsCatalogOpen(false);
              }
            }}
          >
            <button
              onClick={() => {
                // 💡 클릭 시 메뉴 상태 토글 및 고정
                const nextState = !isCatalogSticky;
                setIsCatalogSticky(nextState);
                setIsCatalogOpen(true);
              }}
              className={`h-9 px-3 rounded-xl border transition-colors inline-flex items-center gap-2 ${
                isCatalogSticky ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              } text-xs sm:text-sm font-bold`}
            >
              <HeaderIcon size={16} className="text-blue-600" />
              <span className="max-w-[38vw] sm:max-w-[260px] truncate">{sim.title}</span>
            </button>
            
            {isCatalogOpen && (
              // 💡 top-full pt-1 로 보이지 않는 가상의 공간(경계 다리) 확보
              <div className="absolute top-full pt-1 left-0 z-30 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="w-[82vw] sm:w-[500px] max-h-[60vh] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex">
                  <div className="w-[35%] min-w-[90px] max-w-[140px] border-r border-slate-100 bg-slate-50/60 overflow-y-auto custom-scrollbar">
                    {categories.map((cat) => {
                      const CatIcon = ICON_MAP[cat.icon_name] || Boxes;
                      const selected = activeCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onMouseEnter={() => {
                            if (!lockedCategory) setHoveredCategory(cat.id);
                          }}
                          onClick={() => {
                            setHoveredCategory(cat.id);
                            setLockedCategory(cat.id);
                          }}
                          className={`w-full px-2 py-2.5 sm:px-3 sm:py-2 text-left text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                            selected ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <CatIcon size={12} className="sm:w-3.5 sm:h-3.5 shrink-0" />
                          <span className="truncate">{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex-1 overflow-y-auto p-1.5 custom-scrollbar">
                    {simsInActiveCategory.length > 0 ? (
                      simsInActiveCategory.map((item) => (
                        <Link
                          key={item.id}
                          href={`/view/${item.id}`}
                          onClick={() => {
                            setIsCatalogOpen(false);
                            setIsCatalogSticky(false);
                          }}
                          className={`block px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-lg text-[11px] sm:text-sm font-semibold transition-colors ${
                            item.id === sim.id ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {item.title}
                        </Link>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-[10px] sm:text-xs text-slate-400">해당 카테고리에 시뮬레이션이 없습니다.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {!isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="hidden lg:flex p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all animate-in fade-in zoom-in-95 duration-300"
              title="설명 패널 열기"
            >
              <PanelLeftOpen size={20} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {canEdit && (
            <Link 
              href={`/upload?id=${sim.id}`} 
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all animate-in fade-in" 
              title="실험 수정하기"
            >
              <Pencil size={18} />
            </Link>
          )}
          <button onClick={handleReload} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="다시 시작">
            <RotateCcw size={18} />
          </button>
          <button onClick={handleShare} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="링크 복사">
            <Share2 size={18} />
          </button>
          <button onClick={toggleFullScreen} className="ml-1 sm:ml-2 bg-slate-900 hover:bg-black text-white px-2 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 whitespace-nowrap transition-all active:scale-95 shadow-lg shadow-slate-200">
            <Maximize2 size={14} />
            <span className="hidden sm:inline">전체 화면</span>
          </button>
        </div>
      </header>

      {/* 모바일 탭 */}
      <div className="lg:hidden h-11 border-b border-slate-100 bg-white flex items-center px-2 gap-2 shrink-0">
        <button
          onClick={() => setMobileTab('sim')}
          className={`flex-1 h-8 rounded-lg text-xs font-bold transition-colors ${mobileTab === 'sim' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}
        >
          시뮬레이션
        </button>
        <button
          onClick={() => setMobileTab('info')}
          className={`flex-1 h-8 rounded-lg text-xs font-bold transition-colors ${mobileTab === 'info' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}
        >
          설명
        </button>
      </div>

      <div className="flex-grow flex overflow-hidden w-full h-full">
        
        {/* 2. 좌측 패널 (데스크탑) */}
        <aside 
          className={`hidden lg:flex flex-col shrink-0 transition-all duration-300 ease-in-out bg-white overflow-hidden ${
            isSidebarOpen ? 'w-[360px] border-r border-slate-200 opacity-100' : 'w-0 border-none opacity-0'
          }`}
        >
          <div className="w-[360px] flex-grow flex flex-col relative h-full">
            
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors z-10"
              title="설명 숨기기"
            >
              <PanelLeftClose size={20} />
            </button>

            <div className="flex-grow overflow-y-auto p-6 pt-7 custom-scrollbar">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black tracking-wide mb-4 pr-6">
                <HeaderIcon size={12} /> {categoryInfo?.name || sim.category}
              </div>
              {/* 💡 한글 단어 정렬 break-keep 적용 */}
              <h2 className="text-2xl font-black text-slate-900 leading-[1.15] mb-5 tracking-tighter pr-6 break-keep">{sim.title}</h2>
              
              {/* 💡 한글 단어 정렬 break-keep 적용 */}
              <div className="flex flex-wrap items-center gap-1.5 mb-8 w-full break-keep">
                <div className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold text-slate-500 uppercase tracking-tight whitespace-nowrap">
                  <Eye size={13} /> {viewCount} VIEWS
                </div>
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-tight border transition-colors whitespace-nowrap ${
                    isLiked ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-500 border-slate-100 hover:text-red-500 hover:border-red-200'
                  }`}
                >
                  <Heart size={13} fill={isLiked ? 'currentColor' : 'none'} />
                  추천 {likes}
                </button>
                <div className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold text-slate-500 uppercase tracking-tight whitespace-nowrap">
                  <Calendar size={13} /> {new Date(sim.created_at).toLocaleDateString()}
                </div>
              </div>

              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-2 text-slate-400">
                  <Info size={16} />
                  <span className="text-[11px] font-black uppercase tracking-widest">실험 가이드</span>
                </div>
                {/* 💡 한글 단어 정렬 break-keep 적용 */}
                <p className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap font-medium break-keep">
                  {sim.description || '이 실험에 대한 설명이 아직 등록되지 않았습니다.'}
                </p>
              </div>
              
              <div className="space-y-3 mb-8">
                {sim.url && (
                  <button 
                    onClick={() => handleDownloadHtml(sim.url, sim.title)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group text-left"
                  >
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 group-hover:bg-blue-50 transition-colors">
                      <FileCode size={18} className="text-slate-400 group-hover:text-blue-600" />
                    </div>
                    <div className="flex flex-col flex-grow">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Simulation</span>
                      <span className="text-xs font-black text-slate-800 group-hover:text-blue-600 transition-colors break-keep">HTML 파일 다운로드</span>
                    </div>
                    <Download size={16} className="text-slate-300 group-hover:text-blue-500" />
                  </button>
                )}

                {sim.worksheet_url && (
                  <a 
                    href={sim.worksheet_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={() => toast.success('다운로드가 완료되었습니다!')}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group"
                  >
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 group-hover:bg-blue-50 transition-colors">
                      <FileText size={18} className="text-slate-400 group-hover:text-blue-600" />
                    </div>
                    <div className="flex flex-col flex-grow">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Document</span>
                      <span className="text-xs font-black text-slate-800 group-hover:text-blue-600 transition-colors break-keep">학습지 다운로드</span>
                    </div>
                    <Download size={16} className="text-slate-300 group-hover:text-blue-500" />
                  </a>
                )}
              </div>

            </div>
          </div>
        </aside>

        {/* 3. 모바일 정보 탭 패널 */}
        <div className={`lg:hidden flex-grow overflow-y-auto bg-white px-4 py-4 custom-scrollbar ${mobileTab === 'info' ? 'block' : 'hidden'}`}>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black tracking-wide mb-3">
            <HeaderIcon size={12} /> {categoryInfo?.name || sim.category}
          </div>
          {/* 💡 한글 단어 정렬 break-keep 적용 */}
          <h2 className="text-xl font-black text-slate-900 leading-tight mb-4 break-keep">{sim.title}</h2>
          
          {/* 💡 한글 단어 정렬 break-keep 적용 */}
          <div className="flex flex-wrap gap-2 mb-5 break-keep">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-[11px] font-bold text-slate-500">
              <Eye size={13} /> {viewCount}
            </div>
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border ${
                isLiked ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-500 border-slate-100'
              }`}
            >
              <Heart size={13} fill={isLiked ? 'currentColor' : 'none'} />
              추천 {likes}
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-[11px] font-bold text-slate-500">
              <Calendar size={13} /> {new Date(sim.created_at).toLocaleDateString()}
            </div>
          </div>
          
          <div className="space-y-3 mb-8">
            {/* 💡 한글 단어 정렬 break-keep 적용 */}
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap break-keep">
              {sim.description || '이 실험에 대한 설명이 아직 등록되지 않았습니다.'}
            </p>
          </div>

          <div className="space-y-3 mb-8">
            {sim.url && (
              <button 
                onClick={() => handleDownloadHtml(sim.url, sim.title)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group text-left"
              >
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 group-hover:bg-blue-50 transition-colors">
                  <FileCode size={18} className="text-slate-400 group-hover:text-blue-600" />
                </div>
                <div className="flex flex-col flex-grow">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Simulation</span>
                  <span className="text-xs font-black text-slate-800 group-hover:text-blue-600 transition-colors break-keep">HTML 파일 다운로드</span>
                </div>
                <Download size={16} className="text-slate-300 group-hover:text-blue-500" />
              </button>
            )}

            {sim.worksheet_url && (
              <a 
                href={sim.worksheet_url} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => toast.success('다운로드가 완료되었습니다!')}
                className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group"
              >
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 group-hover:bg-blue-50 transition-colors">
                  <FileText size={18} className="text-slate-400 group-hover:text-blue-600" />
                </div>
                <div className="flex flex-col flex-grow">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Document</span>
                  <span className="text-xs font-black text-slate-800 group-hover:text-blue-600 transition-colors break-keep">학습지 다운로드</span>
                </div>
                <Download size={16} className="text-slate-300 group-hover:text-blue-500" />
              </a>
            )}
          </div>
        </div>

        {/* 4. 우측 시뮬레이션 영역 */}
        <div 
          ref={containerRef} 
          className={`flex-grow bg-slate-200/50 relative overflow-hidden transition-all duration-300 ease-in-out ${mobileTab === 'sim' ? 'block' : 'hidden lg:block'}`}
        >
          <div className="absolute inset-0 w-full h-full shadow-inner bg-white">
            <iframe 
              ref={iframeRef}
              srcDoc={htmlContent} 
              className="absolute top-0 left-0 border-none bg-white"
              style={{
                width: '130%',
                height: '130%',
                transform: 'scale(0.77)', // 💡 기존에 깨져있던 괄호 닫기 ')' 추가
                transformOrigin: 'top left'
              }}
              sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
              title={sim.title}
            />
          </div>
          
          <div className="absolute inset-0 pointer-events-none ring-1 ring-black/5 inset-shadow-sm" />
        </div>

      </div>

      <style jsx global>{`
        :fullscreen { background-color: white !important; padding: 0 !important; }
        :fullscreen iframe { width: 100vw !important; height: 100vh !important; border: none !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </main>
  );
}