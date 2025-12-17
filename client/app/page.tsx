// client/app/page.tsx (または client/src/app/page.tsx)

'use client'; // ← 必須！ブラウザ側で動くコードだと宣言

import { useEffect,useState } from 'react';
import { io,Socket } from 'socket.io-client';

let socket : Socket; // コンポーネントの外で定義する (再レンダリング対策の簡易版)

export default function Home() {
  // const [message, set_Message] = useState<string>("");
  // const [socket,setSocket] = useState<Socket | null> (null);

  // 盤面の定義(9個の配列)
  const [borad,setBorad] = useState<(string | null)[]>(Array(9).fill(null));

  useEffect(() => {
    // 1. サーバー(3001番)に接続！

    const newsocket = io('http://localhost:3001');
    socket = newsocket;
    // console.log(socket);

    // 2. 盤面の更新が来たらStateを変更
    newsocket.on('update_board', (newBoard) => {
      console.log("★クライアントにデータが届いた瞬間！",newBoard);
      setBorad(newBoard);
    });

    // サーバから返事が来たら画面の文字を更新する
    // newsocket.on('reply_message',(data) => {
    //   console.log("サーバから返事が来ました！",data);
    //   set_Message(data);
    // })
    // setSocket(newsocket);

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
  

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">〇✖ゲーム</h1>
      {/* グリッドの生成 */}
      <div className="grid grid-cols-3 gap-2 bg-gray-800 p-2 rounded-l">
        {borad.map((cel,index) => (
          <button 
          className="w-24 h-24 bg-white text-5xl font-bold flex items-center justify-center hover:bg-gray-200 transition"
          key={index}
          onClick={() => handlcelClick(index)}>
            {/* nullなら空文字　‘〇'なら〇 */}
            {cel === '○' && <span className='text-blue-500'>○</span>}
            {cel === '×' && <span className='text-red-500'>×</span>}
          </button>
        ))}
      </div>
      <p className="mt-4 text-gray-600">くりっくして交互に配置</p>
    </div>
  );
}