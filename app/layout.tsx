import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Open Physics Labs | 물리 시뮬레이션 허브',
  description: '직접 조작하며 배우는 인터랙티브 물리 실험실',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans antialiased">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold">Φ</div>
              <span className="text-xl font-bold tracking-tight">Open Physics Labs</span>
            </Link>
            
            <nav className="flex items-center gap-6">
              <Link href="/" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">실험실</Link>
              <Link href="/upload" className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow transition-colors hover:bg-blue-500">
                시뮬레이션 등록
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-grow">
          {children}
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-800 bg-slate-900/50 py-8">
          <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-500">
              © 2026 Open Physics Labs. 전라남도 물리 교육 연구회 지원.
            </div>
            <div className="flex gap-6 text-sm text-slate-400">
              <Link href="#" className="hover:text-white">이용약관</Link>
              <Link href="#" className="hover:text-white">개인정보처리방침</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}