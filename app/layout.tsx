'use client';

import './globals.css';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import ToasterProvider from './ToasterProvider';

// ---------------------------------------------------------
// AuthStatus 컴포넌트: 로그인 상태 및 메뉴 노출 제어
// ---------------------------------------------------------
function AuthStatus() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const getSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();
        
        setIsAdmin(profile?.is_admin || false);
      }
    };

    getSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();
        setIsAdmin(profile?.is_admin || false);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  // 💡 수정된 부분: 로그아웃 시 메인 페이지로 리다이렉트
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/'); // 메인 페이지로 이동
    router.refresh(); // 최신 상태 반영
  };

  return (
    <div className="flex items-center gap-4 md:gap-6">
      
      {/* 로그인 상태이고, 업로드 페이지가 아닐 때만 '실험 등록' 노출 */}
      {user && pathname !== '/upload' && (
        <Link 
          href="/upload" 
          className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-all"
        >
          실험 등록
        </Link>
      )}
      
      {user && (
        <Link href="/manage" className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors">관리</Link>
      )}

      {isAdmin && (
        <Link href="/admin" className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-all">
          사용자 승인
        </Link>
      )}

      <div className="flex items-center gap-4 border-l border-gray-200 pl-4">
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-500 hidden lg:inline">{user.email?.split('@')[0]}님</span>
            <button onClick={handleLogout} className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors">로그아웃</button>
          </div>
        ) : (
          <button onClick={handleLogin} className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">로그인</button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// RootLayout: 전체 웹사이트의 뼈대
// ---------------------------------------------------------
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 text-gray-900 min-h-screen flex flex-col font-sans antialiased">
        <ToasterProvider /> 
        
        <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            {/* 로고 영역 */}
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold">Φ</div>
              <span className="text-xl font-extrabold tracking-tight text-gray-900">물리 시뮬레이션 실험실</span>
            </Link>
            
            <nav>
              <AuthStatus />
            </nav>
          </div>
        </header>

        <main className="flex-grow">
          {children}
        </main>

        <footer className="border-t border-gray-200 bg-white py-8 mt-12">
          <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-500 font-medium">
              © 2026 Open Physics Labs.
            </div>
            <div className="flex gap-6 text-sm text-gray-500 font-medium">
              <Link href="#" className="hover:text-gray-900 transition-colors">이용약관</Link>
              <Link href="#" className="hover:text-gray-900 transition-colors">개인정보처리방침</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}