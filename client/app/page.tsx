// client/app/page.tsx (または client/src/app/page.tsx)

// ブラウザで動きますよ宣言
"use client";

import { useRouter } from "next/navigation";

// 虹色のカードコンポーネント
export function GlowingCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    // 1. 外側のラッパー（ここが虹色に光る）
    <div className="relative group rounded-xl p-[7.5px] overflow-hidden ">
      {/* 2. 虹色のグラデーション背景とぼかし（グロー効果） */}
      {/* absoluteで背後に配置し、ぼかし(blur)をかけることで発光を表現 */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-70 blur-md transition-opacity duration-500 group-hover:opacity-100 group-hover:blur-lg"
        aria-hidden="true"
      ></div>

      {/* 3. 実際のコンテンツが入るカード（内側） */}
      {/* 親要素のp-[1px]の分だけ内側に配置され、縁取りに見える */}
      <div
        className={`relative h-full w-full bg-gray-900 rounded-xl p-6 ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

export default function Home() {
  // Hooksは全て一番上に宣言する
  // 条件分岐、ループ、任意の関数内、returnの後、イベントハンドラ、クラスコンポーネント内で宣言しない
  const router = useRouter();

  // Hooksはコンポーネントの中でしか動かないためグローバルな場所に書かない
  const createRoom = () => {
    const newRoomid = Math.random().toString(36).slice(-10);
    router.push(`/game?room=${newRoomid}`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4">
      <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
        消える〇✖ゲーム
      </h1>
      <p>新しい部屋を作って友達を招待しよう！</p>
      <div className="mt-6">
        <GlowingCard>
          <button onClick={createRoom}>部屋を作る</button>
        </GlowingCard>
      </div>
    </div>
  );
}
