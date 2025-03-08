'use client';

import dynamic from 'next/dynamic';

const GameComponent = dynamic(
  () => import('@/components/Game').then((mod) => mod.Game),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black">
      <GameComponent />
    </main>
  );
}
