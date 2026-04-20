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
    // 💡 모바일에서는 간격(gap)을 줄이고 텍스트 줄바꿈을 방지(whitespace-nowrap)합니다.
    <div className="flex items-center gap-1 sm:gap-2 md:gap-3 relative z-[101]">
      {user && pathname !== '/upload' && (
        <Link href="/upload" className="text-[10px] sm:text-sm font-bold text-blue-600 bg-blue-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl hover:bg-blue-100 transition-all whitespace-nowrap">
          실험 등록
        </Link>
      )}
      {user && (
        <Link href="/manage" className="text-[10px] sm:text-sm font-bold text-slate-600 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl hover:bg-slate-100 transition-all whitespace-nowrap">
          내 실험실
        </Link>
      )}
      {isAdmin && (
        <Link href="/admin" className="text-[10px] sm:text-sm font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl hover:bg-amber-100 transition-all whitespace-nowrap">
          사용자 관리
        </Link>
      )}
      <div className="flex items-center gap-1.5 sm:gap-3 ml-0.5 sm:ml-1 md:ml-2 border-l border-slate-200 pl-1.5 sm:pl-3 md:pl-4">
        {user ? (
          <div className="flex items-center gap-1.5 sm:gap-3">
            <span className="text-sm font-bold text-slate-500 hidden sm:inline-block whitespace-nowrap">
              {user.email?.split('@')[0]}님
            </span>
            <button onClick={() => supabase.auth.signOut()} className="text-[10px] sm:text-sm font-bold text-red-600 bg-red-50 border border-red-100 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl hover:bg-red-600 hover:text-white transition-all whitespace-nowrap">
              로그아웃
            </button>
          </div>
        ) : (
          <button onClick={handleLogin} className="text-[10px] sm:text-sm font-bold text-white bg-blue-600 px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl hover:bg-blue-700 transition-all shadow-md whitespace-nowrap">
            로그인
          </button>
        )}
      </div>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

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
          {/* 💡 모바일에서 양옆 여백을 줄이기 위해 px-4 -> px-2 sm:px-4 로 변경 */}
          <div className="container mx-auto px-2 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
            <a 
              href="/"
              onClick={handleLogoClick}
              className="relative z-[110] flex items-center gap-1.5 sm:gap-3 hover:opacity-70 transition-all cursor-pointer group select-none shrink-0"
            >
              <div className="bg-blue-600 text-white w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform">
                {/* 💡 아이콘 크기를 모바일에서 살짝 축소 */}
                <Atom className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col justify-center">
                {/* 💡 긴 텍스트인 '전남물리교육연구회'는 모바일에서 숨겨서 버튼 공간을 확보합니다. */}
                <span className="hidden sm:block text-[10px] font-black text-blue-600 tracking-tight leading-none mb-1 whitespace-nowrap">
                  전남물리교육연구회
                </span>
                <span className="text-[11px] sm:text-lg font-extrabold tracking-tight leading-none text-slate-800 whitespace-nowrap">
                  물리 시뮬레이션
                </span>
              </div>
            </a>
            
            {/* 💡 기종에 따라 화면이 극단적으로 좁을 때를 대비해 스크롤 허용(overflow-x-auto) 및 우측 정렬 */}
            <nav className="relative z-[110] flex-1 flex justify-end overflow-x-auto custom-scrollbar pl-2">
              <AuthStatus />
            </nav>
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