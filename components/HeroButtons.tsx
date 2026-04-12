'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Plus, ArrowRight } from 'lucide-react';

export default function HeroButtons() {
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false); // 💡 하이드레이션 오류 방지용

  useEffect(() => {
    setMounted(true); // 컴포넌트가 브라우저에 안착했음을 알림

    // 1. 초기 세션 확인
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkUser();

    // 2. 상태 변화 실시간 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 아직 브라우저 준비가 안 됐다면 아무것도 그리지 않음 (번쩍임 방지)
  if (!mounted) return <div className="h-[60px]" />; 

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 animate-in fade-in duration-700">
      {/* 💡 로그인한 사용자에게만 '실험 등록하기' 버튼 노출 */}
      {user ? (
        <Link 
          href="/upload" 
          className="px-8 py-4 rounded-2xl bg-slate-900 text-white font-bold hover:bg-black transition-all flex items-center gap-2 shadow-xl shadow-slate-200 active:scale-95"
        >
          <Plus size={20} /> 실험 등록하기
        </Link>
      ) : (
        /* 로그인 안 했을 때 보여줄 메시지나 다른 버튼 (선택 사항) */
        <p className="text-sm font-bold text-blue-500 bg-blue-50 px-4 py-2 rounded-full">
          로그인하시면 실험을 등록할 수 있습니다.
        </p>
      )}
      
      <a 
        href="#explore" 
        className="px-8 py-4 rounded-2xl bg-white text-slate-600 border border-slate-200 font-bold hover:bg-slate-50 transition-all flex items-center gap-2 active:scale-95"
      >
        실험 탐구하기 <ArrowRight size={18} />
      </a>
    </div>
  );
}