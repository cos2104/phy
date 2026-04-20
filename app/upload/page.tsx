'use client';

import { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { ChevronDown, Check, FileText, X, ArrowLeft } from 'lucide-react';

function UploadForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(''); 
  
  const [isCatOpen, setIsCatOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [uploadMode, setUploadMode] = useState<'file' | 'code'>('code');
  const [htmlCode, setHtmlCode] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [worksheetFile, setWorksheetFile] = useState<File | null>(null);
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingData, setExistingData] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeSrcDoc, setIframeSrcDoc] = useState(''); 

  // 💡 이전 페이지(히스토리)로 돌아가는 함수
  const handleGoBack = () => {
    router.back();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsCatOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let mounted = true;

    const initData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (mounted) setIsAuthChecking(false);
          router.replace('/');
          return;
        }

        const { data: profile } = await supabase.from('profiles').select('is_approved').eq('id', session.user.id).single();
        if (!profile?.is_approved) {
          toast.error('승인된 사용자만 실험을 등록할 수 있습니다.');
          if (mounted) setIsAuthChecking(false);
          router.replace('/');
          return;
        }

        const { data: catData } = await supabase.from('categories').select('*').order('sort_order');
        if (catData) {
          setCategories(catData);
          if (!editId) setCategory(catData[0]?.id || '');
        }

        if (editId) {
          const { data } = await supabase.from('simulations').select('*').eq('id', editId).single();
          if (data) {
            setExistingData(data);
            setTitle(data.title);
            setDescription(data.description);
            setCategory(data.category || (catData ? catData[0]?.id : ''));
            setPreviewUrl(data.image_url);
            setUploadMode('code');
            const res = await fetch(data.url);
            const text = await res.text();
            setHtmlCode(text); 
          }
        }
      } catch (err) {
        toast.error('인증 정보를 확인하는 중 오류가 발생했습니다.');
      } finally {
        if (mounted) setIsAuthChecking(false);
      }
    };
    initData();
    return () => {
      mounted = false;
    };
  }, [editId, router]);

  useEffect(() => {
    const injectScript = `<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script><script>(function(){const o=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,a){if(t==='webgl'||t==='webgl2'){a=a||{};a.preserveDrawingBuffer=true;}return o.call(this,t,a);};})();</script>`;
    if (uploadMode === 'code') {
      setIframeSrcDoc(htmlCode ? injectScript + htmlCode : '');
    } else if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setIframeSrcDoc(injectScript + (e.target?.result as string));
      };
      reader.readAsText(file);
    } else {
      setIframeSrcDoc('');
    }
  }, [htmlCode, file, uploadMode]);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.name.endsWith('.html')) {
      setFile(droppedFile);
      setUploadMode('file');
      toast.success('파일 로드 완료');
    } else {
      toast.error('HTML 파일만 업로드 가능합니다.');
    }
  };

  const handleCapture = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || !iframe?.contentDocument) return;
    const h2c = (iframe.contentWindow as any).html2canvas;
    if (!h2c) return toast.error('캡처 준비 중... 잠시 후 다시 시도해주세요.');

    const win = iframe.contentWindow;
    const width = win.innerWidth;
    const height = win.innerHeight;

    h2c(iframe.contentDocument.body, { 
      useCORS: true, 
      allowTaint: true, 
      backgroundColor: null, 
      logging: false,
      width: width,
      height: height,
      x: win.scrollX,
      y: win.scrollY,
      windowWidth: width,
      windowHeight: height
    }).then((canvas: HTMLCanvasElement) => {
      canvas.toBlob((blob) => {
        if (blob) {
          setThumbnail(new File([blob], "thumb.png", { type: "image/png" }));
          setPreviewUrl(URL.createObjectURL(blob));
          toast.success('캡처 성공! 📸');
        }
      }, 'image/png');
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return toast.error('제목을 입력해주세요.');
    if (!description.trim()) return toast.error('설명을 입력해주세요.');
    if (uploadMode === 'file' && !file && !existingData?.url) return toast.error('HTML 파일을 첨부해주세요.');
    if (uploadMode === 'code' && !htmlCode.trim() && !existingData?.url) return toast.error('HTML 코드를 입력해주세요.');

    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();

    try {
      let finalUrl = existingData?.url || '';
      let finalImageUrl = existingData?.image_url || null;
      let finalWorksheetUrl = existingData?.worksheet_url || null;

      if (file || (uploadMode === 'code' && htmlCode)) {
        const path = `files/${Date.now()}_${Math.random().toString(36).substring(7)}.html`;
        const content = uploadMode === 'file' ? file! : new Blob([htmlCode], { type: 'text/html' });
        await supabase.storage.from('simulations').upload(path, content);
        finalUrl = supabase.storage.from('simulations').getPublicUrl(path).data.publicUrl;
      }

      if (thumbnail) {
        const path = `thumbnails/${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
        await supabase.storage.from('simulations').upload(path, thumbnail);
        finalImageUrl = supabase.storage.from('simulations').getPublicUrl(path).data.publicUrl;
      }

      if (worksheetFile) {
        try {
          const fileExt = worksheetFile.name.split('.').pop();
          const path = `worksheets/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const { error: wsError } = await supabase.storage.from('simulations').upload(path, worksheetFile);
          if (wsError) throw wsError;
          finalWorksheetUrl = supabase.storage.from('simulations').getPublicUrl(path).data.publicUrl;
        } catch (wsErr: any) {
          setLoading(false);
          return toast.error(`학습지 업로드 실패: ${wsErr.message}`); 
        }
      }

      const payload: any = { 
        title, 
        description, 
        category, 
        url: finalUrl, 
        image_url: finalImageUrl,
        worksheet_url: finalWorksheetUrl,
        user_id: session?.user.id 
      };
      if (editId) payload.id = editId;

      const { error: dbError } = await supabase.from('simulations').upsert(payload);
      if (dbError) throw dbError;
      
      toast.success('성공적으로 저장되었습니다!');
      
      // 💡 [중요] 특정 페이지로 이동하는 router.push('/manage')를 완전히 제거했습니다.
      // 💡 router.back()을 호출하면 브라우저가 이전 페이지의 위치를 기억하며 돌아갑니다.
      router.back(); 

    } catch (err: any) {
      toast.error('저장 오류: ' + err.message);
    } finally { 
      setLoading(false); 
    }
  };

  const currentCategoryName = categories.find(c => c.id === category)?.name || '영역 선택';

  if (isAuthChecking) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center font-sans antialiased">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="font-bold text-sm text-slate-500 tracking-tight">사용자 권한 확인 중...</p>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-4 max-w-7xl font-sans antialiased">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 왼쪽 폼 영역 */}
        <div className="lg:col-span-6 space-y-2">
          <div className="flex justify-between items-center px-1">
            <h1 className="text-lg font-black text-slate-900 tracking-tight">
              {editId ? '시뮬레이션 수정하기' : '시뮬레이션 등록하기'}
            </h1>
            
            {/* 💡 "홈으로 가기" 대신 브라우저 기록을 이용하는 뒤로가기 버튼 */}
            <button 
              type="button"
              onClick={handleGoBack}
              className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-blue-600 transition-all active:scale-95"
            >
              <ArrowLeft size={14} />
              이전 페이지로
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="bg-white p-4 rounded-[1.2rem] border border-slate-200 shadow-sm space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <input 
                required 
                placeholder="실험 제목" 
                className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-bold shadow-inner placeholder:text-slate-400 focus:ring-2 focus:ring-blue-100 transition-all" 
                value={title} 
                onChange={(e)=>setTitle(e.target.value)} 
              />
              
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsCatOpen(!isCatOpen)}
                  className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-bold shadow-inner flex justify-between items-center text-slate-800 hover:bg-slate-100/50 transition-all focus:ring-2 focus:ring-blue-100"
                >
                  <div className="flex gap-3 items-center">
                    <span className="text-slate-400 font-bold shrink-0">영역 선택</span>
                    <span>{currentCategoryName}</span>
                  </div>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isCatOpen ? 'rotate-180' : ''}`} />
                </button>

                {isCatOpen && (
                  <div className="absolute top-[105%] left-0 w-full bg-white border border-slate-100 rounded-xl shadow-2xl z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => { setCategory(cat.id); setIsCatOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold transition-colors ${category === cat.id ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        {cat.name}
                        {category === cat.id && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <textarea 
                required 
                placeholder="실험 설명" 
                className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-bold h-14 resize-none shadow-inner placeholder:text-slate-400 focus:ring-2 focus:ring-blue-100 transition-all" 
                value={description} 
                onChange={(e)=>setDescription(e.target.value)} 
              />
            </div>

            <div className="flex p-1 bg-slate-100 rounded-lg">
              <button type="button" onClick={()=>setUploadMode('code')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${uploadMode==='code'?'bg-white text-blue-600 shadow-sm':'text-slate-500'}`}>코드 직접 입력</button>
              <button type="button" onClick={()=>setUploadMode('file')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${uploadMode==='file'?'bg-white text-blue-600 shadow-sm':'text-slate-500'}`}>HTML 파일 첨부</button>
            </div>

            {uploadMode === 'file' ? (
              <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} className={`border-2 border-dashed rounded-xl p-4 text-center transition-all relative ${isDragging ? 'border-blue-500 bg-blue-50 shadow-inner' : 'border-slate-200 bg-slate-50 shadow-inner'}`}>
                <input 
                  type="file" 
                  accept=".html" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) setFile(e.target.files[0]);
                  }} 
                />
                <p className="text-xs text-slate-500 font-bold">{file ? `✅ ${file.name}` : 'HTML 파일을 이곳에 놓거나 클릭'}</p>
              </div>
            ) : (
              <textarea 
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs font-mono h-24 shadow-inner placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none leading-relaxed" 
                value={htmlCode} 
                onChange={(e)=>setHtmlCode(e.target.value)} 
                placeholder="여기에 HTML 코드를 붙여넣으세요."
              />
            )}

            <div className="space-y-1.5 pt-1.5 border-t border-slate-100">
              <label className="text-[10px] font-black text-slate-400 uppercase px-1">학습지 첨부 (선택)</label>
              <div className="relative group">
                <input 
                  type="file" 
                  accept=".pdf,.hwp,.docx,.zip" 
                  className="hidden" 
                  id="ws-upload" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) setWorksheetFile(e.target.files[0]);
                  }} 
                />
                <label 
                  htmlFor="ws-upload" 
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-dashed transition-all cursor-pointer ${worksheetFile ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50 hover:border-blue-200'}`}
                >
                  <FileText size={16} className={worksheetFile ? 'text-green-500' : 'text-slate-400'} />
                  <span className="text-xs font-bold text-slate-600 flex-grow truncate">
                    {worksheetFile ? worksheetFile.name : '학습지 업로드 (PDF, HWP 등)'}
                  </span>
                  {worksheetFile && (
                    <button type="button" onClick={(e) => { e.preventDefault(); setWorksheetFile(null); }} className="p-1 hover:bg-green-200 rounded-full text-green-600">
                      <X size={14} />
                    </button>
                  )}
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-blue-50/50 p-2 rounded-xl border border-blue-100 shadow-sm">
              <div className="flex-shrink-0 w-20 h-12 bg-white rounded-lg border border-blue-200 overflow-hidden shadow-sm">
                {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100" />}
              </div>
              <div className="flex flex-col flex-1 gap-1.5">
                <button type="button" onClick={handleCapture} className="w-full bg-blue-600 text-white text-[10px] font-bold py-1.5 rounded-md hover:bg-blue-700 active:scale-95 transition-all shadow-sm">📸 자동 캡처</button>
                <label htmlFor="t-in" className="w-full cursor-pointer bg-white text-blue-600 border border-blue-200 text-[10px] font-bold py-1.5 rounded-md text-center hover:bg-blue-50 transition-all">🖼️ 직접 변경</label>
                <input type="file" accept="image/*" className="hidden" id="t-in" onChange={(e)=>{
                  const f = e.target.files?.[0];
                  if(f){ setThumbnail(f); setPreviewUrl(URL.createObjectURL(f)); }
                }}/>
              </div>
            </div>

            <button disabled={loading} className="w-full bg-slate-900 text-white font-black py-2.5 rounded-xl shadow-xl hover:bg-black transition-all disabled:opacity-50 text-sm mt-1">
              {loading ? '처리 중...' : (editId ? '시뮬레이션 업데이트' : '시뮬레이션 저장 및 게시')}
            </button>
          </form>
        </div>

        {/* 오른쪽 미리보기 영역 */}
        <div className="lg:col-span-6 lg:sticky lg:top-20">
          <div className="mb-3 px-1">
            <h2 className="text-lg font-black text-slate-800 tracking-tight">시뮬레이션 미리보기</h2>
          </div>
          <div className="aspect-[16/10] w-full border-[5px] border-white bg-slate-200 rounded-[1.5rem] overflow-hidden shadow-xl relative ring-1 ring-slate-100">
            <iframe ref={iframeRef} srcDoc={iframeSrcDoc} className="absolute top-0 left-0 w-[200%] h-[200%] scale-50 origin-top-left border-none bg-black" sandbox="allow-scripts allow-same-origin" />
          </div>
          <div className="mt-3 p-3 bg-slate-900 rounded-xl border border-slate-800 shadow-xl">
             <p className="text-[11px] text-blue-400 text-center font-bold leading-relaxed">
             조작 후 <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded mx-1 text-[10px]">자동 캡처</span> 버튼을 누르면<br />
             현재 실험 화면이 썸네일로 저장됩니다.
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center text-sm font-bold text-slate-500">환경 로딩 중...</div>}>
      <UploadForm />
    </Suspense>
  );
}