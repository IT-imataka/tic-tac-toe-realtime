"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { GlowingCard } from "../page";

const socket = io(
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  {
    autoConnect: false,
  }
);

function GameContent() {
  // 2.生成されたランダム文字列から部屋番号の情報を受け取る
  const seachparam = useSearchParams();
  const roomID = seachparam.get("room");

  // 盤面の定義(9個の配列)
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  // 勝者の状態設定
  const [winner, setWinner] = useState<string | null>(null);
  // 消えるマスの状態設定
  const [isNext, setisNext] = useState<boolean>(true);
  const [oMoves, setOMoves] = useState<number[]>([]);
  const [xMoves, setXMoves] = useState<number[]>([]);
  // 部屋毎の状態管理
  const [inviteURL, setInviteURL] = useState("");


  useEffect(() => {
    // 1. サーバー(localは3001番)に接続！
    if (typeof window !== "undefined") {
      setInviteURL(window.location.href);
    }
    // 3.部屋が存在すれば入室(socketが定義されているかも同時に判定)
    if (roomID && socket) {
      if (!socket.connected) {
        console.log("🔗 接続先URL:", (socket.io as any).uri);
        console.log("サーバーに接続します", roomID);
        socket.connect();
        socket.emit("join_room", roomID);
        // 4. 盤面の更新が来たらStateを変更
        // フロント側で勝敗の更新情報を受け取り勝者を表示させる
        socket.on("update_board", (data) => {
          console.log("📨 サーバーから受信:", data);
          // サーバーからwinner,boardというオブジェクトが届く
          // console.log("サーバーから届いた生データ:", data);
          setBoard(data.board);
          setWinner(data.winner);
          setOMoves(data.oMoves);
          setXMoves(data.xMoves);
          setisNext(data.isNext);
        });
      }
    }
    // 3. お片付け（画面を閉じた時などに切断）
    return () => {
      socket.off("update_board");
      socket.disconnect();
    };
  }, [roomID]);

  // マスを押したときの処理
  const handlcelClick = (index: number) => {
    // サーバにどのマス目に置きたいか
    // socketが存在するときだけ実行する
    console.log(socket);
    if (socket) {
      console.log(socket);
      socket.emit("place_mark", {
        index: index,
        roomID: roomID,
      });
    }
  };
  const handleReset = () => {
    console.log("リセットボタンが押されました");
    if (socket) {
      socket.emit("reset_board", roomID);
    }
  };

  return (
    // 以下はページ全てを返すjsx
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4">
      <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
        消える〇✖ゲーム
      </h1>
      <p className="pt text-white-600 pb-4">交互に配置されます</p>
      {/* グリッドの生成 */}
      <div className="grid grid-cols-3 gap-2 bg-white-500 p-2 rounded-l ">
        {board.map((cel, index) => {
          // 消えるギミック判定のflagを立てる
          let invisibleflag = false;
          if (isNext) {
            // 各手番、最初に置かれた駒を判定
            if (oMoves.length >= 3 && oMoves[0] === index) {
              invisibleflag = true;
            }
            if (xMoves.length >= 3 && xMoves[0] === index) {
              invisibleflag = true;
            }
          }
          // console.log("生のnextInv:", nextInv)
          // 以下はボタンを返すためのjsx
          return (
            <div key={index} className={`relative p-[1px] rounded-xl overflow-hidden transition-all duration-500 ${invisibleflag ? "opacity-40 scale-95" : "opacity-100"}`}
            >
              <div
                className={`inset-0 bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500
                ${invisibleflag ? "blur-[1]" : "blur-[5] opacity-50"}`}
              >
                <button
                  className={`
                    relative w-24 h-24 bg-slate-900 rounded-xl text-5xl font-bold flex items-center justify-center rounded-lg  transition-all duration-300 transform active:scale-95 transition-colors

                    ${!cel && !winner ? "hover:bg-slate-800" : ""}
                    ${!cel
                      ? "bg-black-700 hover:bg-black-600"
                      : "bg-white-600"
                    }
                    ${invisibleflag
                      ? "opacity-30 border-2 border-dashed border-red-400"
                      : "opacity-100"
                    }
                      `}
                  key={index}
                  onClick={() => handlcelClick(index)}
                >
                  {/* nullなら空文字　‘〇'なら〇 */}
                  {cel === "○" && (
                    <span className="text-cyan-300 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]">
                      ○
                    </span>
                  )}
                  {cel === "×" && (
                    <span className="text-pink-500 drop-shadow-[0_0_10px_rgba(244,114,182,0.8)]">
                      ×
                    </span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {winner && (
        <h2 className="mt-4 mb-6 text-2xl font-bold text-white animate-bounce">
          <span className={winner === "○" ? "text-cyan-400" : "text-pink-500"}>
            {winner === "○" ? "○" : "×"}
            の方が勝利です！おめでとうございます！
          </span>
        </h2>
      )}
      <button onClick={handleReset} className="mt-4 text-slate-300 transition">
        <GlowingCard className="animate-pulse hover:animate-none">
          リセットボタン
        </GlowingCard>
      </button>
      {inviteURL && (
        <h2 className="mt-6">
          <a
            className="hover:underline hover:text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400"
            target="_blank"
            href={`${inviteURL}`}
          >
            {inviteURL}
          </a>
          &nbsp;を送ってね！
        </h2>
      )}
    </div>
  );
}

export default function Game() {
  return (
    <Suspense
      fallback={
        <div
          style={{ color: "red", backgroundColor: "white", padding: "20px" }}
          className="pt-8 bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400"
        >
          ロード中！！！
        </div>
      }
    >
      <GameContent />;
    </Suspense>
  );
}
