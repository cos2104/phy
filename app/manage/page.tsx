'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { 
  Settings2, Plus, X, Shield, Lock, Search, 
  Filter, User, ArrowUpDown, SortAsc, Calendar 
} from 'lucide-react';

export default function ManagePage() {
  const router = useRouter();
  const [simulations, setSimulations] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState<{ id: string; is_admin: boolean } | null>(null);

  const [showCatManager, setShowCatManager] = useState(false);
  const [newCat, setNewCat] = useState({ id: '', name: '' });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'mine'>('all');
  
  // 정렬 상태 (최신순, 오래된순, 이름순)
  const [sortMode, setSortMode] = useState<'latest' | 'oldest' | 'name'>('latest');

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    if (data) setCategories(data);
  };

  useEffect(() => {
    const initPage = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error('로그인이 필요합니다.');
          router.push('/');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, is_approved, is_admin')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!profile) {
          setLoading(false);
          return;
        }

        setMyProfile(profile);

        const [simRes, catRes] = await Promise.all([
          supabase.from('simulations').select('*'),
          supabase.from('categories').select('*').order('sort_order')
        ]);

        if (simRes.data) setSimulations(simRes.data);
        if (catRes.data) setCategories(catRes.data);

      } catch (err) {
        toast.error('시스템 오류가 발생했습니다.');
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    };

    initPage();
  }, [router]);

  // 필터링 후 정렬 처리
  const filteredAndSortedSimulations = useMemo(() => {
    // 1. 필터링
    let result = simulations.filter(sim => {
      const matchesFilter = filterMode === 'all' || sim.user_id === myProfile?.id;
      const matchesSearch = sim.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });

    // 2. 정렬 적용
    return result.sort((a, b) => {
      if (sortMode === 'latest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortMode === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortMode === 'name') {
        return a.title.localeCompare(b.title, 'ko');
      }
      return 0;
    });
  }, [simulations, searchQuery, filterMode, sortMode, myProfile]);

  const handleDelete = async (id: string, userId: string) => {
    const canDelete = myProfile?.is_admin || myProfile?.id === userId;
    if (!canDelete) return toast.error('권한이 없습니다.');
    if (!confirm('정말로 삭제하시겠습니까?')) return;

    const loadingToast = toast.loading('삭제 중...');
    try {
      const { error } = await supabase.from('simulations').delete().eq('id', id);
      if (error) throw error;
      toast.success('삭제 완료!', { id: loadingToast });
      setSimulations(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      toast.error('삭제 실패: ' + err.message, { id: loadingToast });
    }
  };

  // 💡 [복구됨] 실수로 지워졌던 카테고리 추가 함수
  const addCategory = async () => {
    if (!newCat.id || !newCat.name) return toast.error('ID와 이름을 입력하세요.');
    
    // DB 제약 조건을 피하기 위한 기본값 세팅
    const payload = {
      id: newCat.id.trim().toLowerCase(),
      name: newCat.name,
      icon_name: 'Boxes',
      bg_class: 'bg-slate-50',
      color_class: 'text-slate-500',
      sort_order: categories.length + 1
    };

    const { error } = await supabase.from('categories').insert([payload]);
    
    if (error) {
      console.error(error);
      return toast.error('추가 실패: ' + error.message);
    }
    toast.success('카테고리가 추가되었습니다.');
    setNewCat({ id: '', name: '' });
    fetchCategories();
  };

  // 💡 [복구됨] 실수로 지워졌던 카테고리 삭제 함수
  const deleteCategory = async (id: string) => {
    if (!confirm('해당 카테고리를 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) return toast.error('삭제 실패: ' + error.message);
    fetchCategories();
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center font-sans antialiased">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
      <p className="font-bold text-gray-500 tracking-tight">시스템 로드 중...</p>
    </div>
  );

  return (
    <main className="container mx-auto px-4 py-12 max-w-5xl font-sans antialiased">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-gray-900 mb-1">관리 페이지</h1>
          <p className="text-sm font-medium text-gray-400">데이터 정렬 및 게시물 관리 시스템</p>
        </div>
        <div className="flex gap-3">
          {myProfile?.is_admin && (
            <button onClick={() => setShowCatManager(!showCatManager)} className="bg-white border border-gray-200 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 shadow-sm transition-all">
              <Settings2 size={18} /> 카테고리 설정
            </button>
          )}
          <Link href="/upload" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center gap-2 transition-all">
            <Plus size={18} /> 새 시뮬레이션
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="찾으시는 실험 제목을 입력하세요..." 
            className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 shadow-inner shrink-0">
            <button onClick={() => setFilterMode('all')} className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${filterMode === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>전체</button>
            <button onClick={() => setFilterMode('mine')} className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${filterMode === 'mine' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>내 실험</button>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 shadow-inner shrink-0">
            <button onClick={() => setSortMode('latest')} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${sortMode === 'latest' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>
              <ArrowUpDown size={14} /> 최신순
            </button>
            <button onClick={() => setSortMode('oldest')} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${sortMode === 'oldest' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>
              <Calendar size={14} /> 오래된순
            </button>
            <button onClick={() => setSortMode('name')} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${sortMode === 'name' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>
              <SortAsc size={14} /> 이름순
            </button>
          </div>
        </div>
      </div>

      {showCatManager && myProfile?.is_admin && (
        <section className="mb-10 bg-slate-50 border border-slate-200 p-6 rounded-3xl animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-sm font-black mb-4 flex items-center gap-2 text-slate-700 uppercase tracking-widest">
            <Shield size={16} className="text-blue-500" /> 마스터 카테고리 관리
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <span className="text-xs font-bold text-slate-700">{cat.name} <span className="text-[10px] text-slate-300 ml-2 font-mono uppercase">{cat.id}</span></span>
                  <button onClick={() => deleteCategory(cat.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1"><X size={14}/></button>
                </div>
              ))}
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">새 카테고리 추가</p>
              <input 
                placeholder="영역 ID (예: fluid)" 
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-mono focus:ring-1 focus:ring-blue-500"
                value={newCat.id} onChange={e => setNewCat({...newCat, id: e.target.value})}
              />
              <input 
                placeholder="영역 이름 (예: 유체역학)" 
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold focus:ring-1 focus:ring-blue-500"
                value={newCat.name} onChange={e => setNewCat({...newCat, name: e.target.value})}
              />
              <button onClick={addCategory} className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-black transition-all">
                <Plus size={14} /> 추가하기
              </button>
            </div>
          </div>
        </section>
      )}

      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">미리보기</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">시뮬레이션 정보</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">권한</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredAndSortedSimulations.map((sim) => {
              const hasPermission = myProfile?.is_admin || myProfile?.id === sim.user_id;
              const catName = categories.find(c => c.id === sim.category)?.name || '미분류';

              return (
                <tr key={sim.id} className="hover:bg-gray-50/40 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="w-16 h-10 bg-gray-100 rounded-lg overflow-hidden border border-gray-100 relative">
                      {sim.image_url ? (
                        <img src={sim.image_url} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300 uppercase italic">No Img</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-800 text-sm tracking-tight">{sim.title}</div>
                    <div className="text-[10px] text-slate-400 font-bold mt-1">
                      {catName} <span className="mx-1">•</span> {new Date(sim.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {sim.user_id === myProfile?.id ? 
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-2.5 py-1.5 rounded-lg font-bold border border-blue-100 flex items-center gap-1 w-fit"><User size={10}/> 내 실험</span> :
                      myProfile?.is_admin ? <span className="text-[10px] bg-purple-50 text-purple-600 px-2.5 py-1.5 rounded-lg font-bold border border-purple-100">Master</span> :
                      <div className="flex items-center gap-1 text-[10px] text-gray-300 font-medium tracking-tight"><Lock size={10} /> 읽기 전용</div>
                    }
                  </td>
                  <td className="px-6 py-4 text-right">
                    {hasPermission ? (
                      <div className="flex justify-end gap-1">
                        <Link href={`/upload?id=${sim.id}`} className="text-xs font-bold text-blue-500 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">수정</Link>
                        <button onClick={() => handleDelete(sim.id, sim.user_id)} className="text-xs font-bold text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">삭제</button>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-200 px-3 py-1.5 uppercase tracking-widest select-none">Locked</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredAndSortedSimulations.length === 0 && !loading && (
          <div className="py-32 text-center">
            <Search size={40} className="mx-auto text-gray-200 mb-4" strokeWidth={1.5} />
            <p className="text-sm font-bold text-gray-400">검색 조건에 맞는 실험이 없습니다.</p>
          </div>
        )}
      </div>
    </main>
  );
}