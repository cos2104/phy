'use client';

import './globals.css';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import ToasterProvider from './ToasterProvider';
import { Atom } from 'lucide-react';

function AuthStatus() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();
    if (data) setIsAdmin(data.is_admin);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      if (event === 'SIGNED_OUT') {
        router.push('/');
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, router]);

  const handleLogin = () => supabase.auth.signInWithOAuth({ 
    provider: 'google', 
    options: { redirectTo: window.location.origin } 
  });

  return (
    <div className="flex items-center gap-2 md:gap-3 relative z-[101]">
      {user && pathname !== '/upload' && (
        <Link href="/upload" className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-xl hover:bg-blue-100 transition-all">
          실험 등록
        </Link>
      )}
      {user && (
        <Link href="/manage" className="text-sm font-bold text-slate-600 px-3 py-2 rounded-xl hover:bg-slate-100 transition-all">
          내 실험실
        </Link>
      )}
      {isAdmin && (
        <Link href="/admin" className="text-sm font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl hover:bg-amber-100 transition-all">
          사용자 관리
        </Link>
      )}
      <div className="flex items-center gap-3 ml-1 md:ml-2 border-l border-slate-200 pl-3 md:pl-4">
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-500 hidden sm:inline-block">
              {user.email?.split('@')[0]}님
            </span>
            <button onClick={() => supabase.auth.signOut()} className="text-sm font-bold text-red-600 bg-red-50 border border-red-100 px-3 md:px-4 py-2 rounded-xl hover:bg-red-600 hover:text-white transition-all">
              로그아웃
            </button>
          </div>
        ) : (
          <button onClick={handleLogin} className="text-sm font-bold text-white bg-blue-600 px-5 py-2 rounded-xl hover:bg-blue-700 transition-all shadow-md">
            로그인
          </button>
        )}
      </div>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // 💡 [수정] 현재 메인 페이지(/)에 있다면 강제로 새로고침하여 검색창 상태를 날려버림
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault(); 
    if (window.location.pathname === '/') {
      window.location.href = '/'; 
    } else {
      router.push('/'); 
    }
  };

  return (
    <html lang="ko">
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans antialiased">
        <ToasterProvider /> 
        <header className="sticky top-0 z-[100] w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <a 
              href="/"
              onClick={handleLogoClick}
              className="relative z-[110] flex items-center gap-3 hover:opacity-70 transition-all cursor-pointer group select-none"
            >
              <div className="bg-blue-600 text-white w-9 h-9 rounded-xl flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform">
                <Atom size={22} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-[10px] font-black text-blue-600 tracking-tight leading-none mb-1">
                  전남물리교육연구회
                </span>
                <span className="text-lg font-extrabold tracking-tight leading-none text-slate-800">
                  물리 시뮬레이션
                </span>
              </div>
            </a>
            <nav className="relative z-[110]"><AuthStatus /></nav>
          </div>
        </header>
        <main className="flex-grow">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-8 mt-12 text-center text-sm text-slate-400 font-medium">
          © 2026 전남물리교육연구회 Open Physics Labs.
        </footer>
      </body>
    </html>
  );
}