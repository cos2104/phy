'use client'; // 👈 이 파일은 무조건 화면(클라이언트)에서만 렌더링하라는 마법 주문

import { Toaster } from 'react-hot-toast';

export default function ToasterProvider() {
  return <Toaster position="top-center" />;
}