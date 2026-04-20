'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Plus, ArrowRight, LogIn } from 'lucide-react';

export default function HeroButtons() {
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  if (!mounted) return <div className="h-[52px] sm:h-[60px]" />; 

  return (
    <div className="flex flex-col items-center gap-5 sm:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        {user ? (
          <Link 
            href="/upload" 
            className="px-5 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-blue-600 text-white text-sm sm:text-base font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200 active:scale-95"
          >
            <Plus size={18} className="sm:w-5 sm:h-5" /> 실험 등록하기
          </Link>
        ) : (
          <button 
            onClick={handleGoogleLogin}
            className="px-5 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-slate-900 text-white text-sm sm:text-base font-bold hover:bg-black transition-all flex items-center gap-2 shadow-xl shadow-slate-200 active:scale-95"
          >
            <LogIn size={18} className="sm:w-5 sm:h-5" /> 구글로 시작하기
          </button>
        )}
        
        <a 
          href="#explore" 
          className="px-5 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white text-slate-600 text-sm sm:text-base border border-slate-200 font-bold hover:bg-slate-50 transition-all flex items-center gap-2 active:scale-95"
        >
          실험 탐구하기 <ArrowRight size={18} />
        </a>
      </div>

      {!user && (
        <p className="text-xs sm:text-sm font-medium text-slate-400 bg-slate-100 px-3 sm:px-4 py-2 rounded-full">
          💡 로그인하시면 나만의 물리 시뮬레이션을 등록하고 관리할 수 있습니다.
        </p>
      )}
    </div>
  );
}