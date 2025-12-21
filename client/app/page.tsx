// client/app/page.tsx (または client/src/app/page.tsx)

'use client'; // ← 必須！ブラウザ側で動くコードだと宣言

import { useEffect,useState } from 'react';
import { io,Socket } from 'socket.io-client';

let socket : Socket; // コンポーネントの外で定義する (再レンダリング対策の簡易版)
export function GlowingCard({ children, className = "" }) {
  return (
    // 1. 外側のラッパー（ここが虹色に光る）
    <div className="relative group rounded-xl p-[2.5px] overflow-hidden ">
      
      {/* 2. 虹色のグラデーション背景とぼかし（グロー効果） */}
      {/* absoluteで背後に配置し、ぼかし(blur)をかけることで発光を表現 */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-70 blur-md transition-opacity duration-500 group-hover:opacity-100 group-hover:blur-lg" 
        aria-hidden="true"
      ></div>

      {/* 3. 実際のコンテンツが入るカード（内側） */}
      {/* 親要素のp-[1px]の分だけ内側に配置され、縁取りに見える */}
      <div className={`relative h-full w-full bg-gray-900 rounded-xl p-6 ${className}`}>
        {children}
      </div>
    </div>
  );
}


export default function Home() {
  // const [message, set_Message] = useState<string>("");
  // const [socket,setSocket] = useState<Socket | null> (null);

  // 盤面の定義(9個の配列)
  const [board,setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  // 勝者の状態設定
  const [winner,setWinner] = useState<(string | null)>(null);
  // 消えるマスの状態設定
  const [nextInv,setNextInv] = useState<number[]>([]);

  useEffect(() => {
    // 1. サーバー(3001番)に接続！

    const newsocket = io('http://localhost:3001');
    socket = newsocket;
    // console.log(socket);

    // 2. 盤面の更新が来たらStateを変更
    // フロント側で勝敗の更新情報を受け取り勝者を表示させる
    newsocket.on('update_board', (data) => {
      // console.log(data);
      // サーバーからwinner,boardというオブジェクトが届く
      // console.log("サーバーから届いた生データ:", data);
      setBoard(data.board);
      setWinner(data.winner);
      setNextInv(data.nextInv || []);
    });
  

    // 3. お片付け（画面を閉じた時などに切断）
    return () => {
      newsocket.off("update_board");
      newsocket.disconnect();
    };
  }, []); // [] は「最初の1回だけ実行」という意味

// マスを押したときの処理
  const handlcelClick =  (index:number) => {
    // サーバにどのマス目に置きたいか
    // socketが存在するときだけ実行する
    if(socket){
      socket.emit("place_mark", index)
    }
  };
  const handleRiset = () => {
    console.log("リセットボタンが押されました");
    if(socket){
      socket.emit("reset_board");
    }
  }
  
  return (
    // 以下はページ全てを返すjsx
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4">
      <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">消える〇✖ゲーム</h1>
      <p className="pt text-white-600 pb-4">交互に配置されます</p>
      {/* グリッドの生成 */}
      <div className="grid grid-cols-3 gap-2 bg-white-500 p-2 rounded-l ">
        {board.map((cel,index) => {
          const isNextInv = nextInv.includes(index);
          console.log("生のnextInv:", nextInv)
          // 以下はボタンを返すためのjsx
          return (  
            <div key={index} 
            className={`relative p-[1px] rounded-xl overflow-hidden transition-all duration-500 ${isNextInv ? 'opacity-40 scale-95' : 'opacity-100'}`}>
              <div className={`inset-0 bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500
                ${isNextInv ? 'blur-[1]' : 'blur-[5] opacity-50'}`}>
                <button
                className={`
                   relative w-24 h-24 bg-slate-900 rounded-xl text-5xl font-bold flex items-center justify-center rounded-lg  transition-all duration-300 transform active:scale-95 transition-colors
                
                   ${!cel && !winner ? 'hover:bg-slate-800' : ''}
                   ${!cel ? 'bg-black-700 hover:bg-black-600' : 'bg-white-600'}
                   ${isNextInv ? 'opacity-30 border-2 border-dashed border-red-400' : 'opacity-100'}
                  `}
                key={index}
                onClick={() => handlcelClick(index)}>
                {/* nullなら空文字　‘〇'なら〇 */}
                {cel === '○' && <span className='text-blue-500 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]'>○</span>}
                {cel === '×' && <span className='text-red-500 drop-shadow-[0_0_10px_rgba(244,114,182,0.8)]'>×</span>}
                </button>
              </div>
            </div>
          )
        })}
      </div>
      {winner && (
        <h2 className='mt-4 mb-6 text-2xl font-bold text-white animate-bounce'>
          <span className={winner === '○' ? 'text-cyan-400' : 'text-pink-500'}>
            {winner === "○" ? "○" : "×"}の方が勝利です！おめでとうございます！
          </span>
        </h2>
        )}
      <GlowingCard className='animate-pulse hover:animate-none'><button onClick={handleRiset} className="text-slate-300 transition">リセットボタン</button></GlowingCard>
    </div>
  );
}