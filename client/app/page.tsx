// client/app/page.tsx (または client/src/app/page.tsx)

'use client'; // ← 必須！ブラウザ側で動くコードだと宣言

import { Nerko_One } from 'next/font/google';
import { useEffect,useState } from 'react';
import { io,Socket } from 'socket.io-client';

// let socket : Socket; // コンポーネントの外で定義する (再レンダリング対策の簡易版)

export default function Home() {
  const [message, set_Message] = useState<string>("");
  const [socket,setSocket] = useState<Socket | null> (null);

  // 盤面の定義(9個の配列)
  // const [borad,setBorad] = useState<(string | null[])>(Array(9).fill(null));

  useEffect(() => {
    // 1. サーバー(3001番)に接続！

    const newsocket = io('http://localhost:3001');

    // 2. 接続成功したらブラウザのコンソールに表示
    newsocket.on('connect', () => {
      console.log('クライアント: サーバーに繋がりました！ ID:', newsocket.id);
    });
    // サーバから返事が来たら画面の文字を更新する
    newsocket.on('reply_message',(data) => {
      console.log("サーバから返事が来ました！",data);
      set_Message(data);
    })
    setSocket(newsocket);

    // 3. お片付け（画面を閉じた時などに切断）
    return () => {
      newsocket.disconnect();
    };
  }, []); // [] は「最初の1回だけ実行」という意味

  // ボタンを押したときの処理
  const handleSendMessage =  () => {
    if(socket){
      console.log("送信中...");
      // サーバに向かって"send_message"という合言葉をデータで投げる
      socket.emit('send_message',`こんばんは～`);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">通信テスト中...</h1>
      {/* サーバからの返事を表示 */}
      <p className='text-2xl mb-4'>サーバからの返事:{message}</p>

      {/* 送信ボタン */}
      <button onClick={handleSendMessage} className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'>
        送信する
      </button>
    </div>
  );
}