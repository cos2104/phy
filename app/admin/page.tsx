'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

// 💡 반드시 'export default'가 붙어 있어야 Next.js가 페이지로 인식합니다.
export default function AdminPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProfiles = async () => {
      // 1. 세션 확인
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }

      // 2. 현재 접속자가 '마스터 관리자(is_admin)'인지 최종 확인
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

      if (!myProfile?.is_admin) {
        toast.error('관리자만 접근 가능한 페이지입니다.');
        router.push('/');
        return;
      }

      // 3. 전체 사용자 목록 가져오기
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        toast.error('사용자 목록을 불러올 수 없습니다.');
      } else {
        setProfiles(data || []);
      }
      setLoading(false);
    };

    fetchProfiles();
  }, [router]);

  // 승인 상태 토글 함수
  const toggleApprove = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_approved: !currentStatus })
      .eq('id', id);
    
    if (!error) {
      toast.success('사용 권한이 변경되었습니다.');
      setProfiles(profiles.map(p => p.id === id ? { ...p, is_approved: !currentStatus } : p));
    } else {
      toast.error('변경 실패: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <span className="ml-3 font-bold text-gray-600">관리자 권한 확인 중...</span>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-black text-gray-900">사용자 관리</h1>
        <p className="text-gray-500 mt-2 font-medium">사용자 가입 승인 및 권한 관리</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="divide-y divide-gray-100">
          {profiles.map((p) => (
            <div key={p.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div>
                <p className="font-bold text-gray-900">{p.email}</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-[10px] text-gray-400">ID: {p.id.slice(0, 8)}...</span>
                  <span className="text-[10px] text-gray-400">가입: {new Date(p.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.is_approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {p.is_approved ? '승인됨' : '대기중'}
                </span>
                <button 
                  onClick={() => toggleApprove(p.id, p.is_approved)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    p.is_approved 
                    ? 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100'
                  }`}
                >
                  {p.is_approved ? '승인 취소' : '승인하기'}
                </button>
              </div>
            </div>
          ))}
          {profiles.length === 0 && (
            <div className="py-20 text-center text-gray-500">가입한 사용자가 없습니다.</div>
          )}
        </div>
      </div>
    </main>
  );
}