import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] },
});

// ゲームの状態を定義(9つ)
// null = なし,'〇' = まる,'×' = ばつ

// 最初はnullを入れる
let board = Array(9).fill(null);

// ターン判定 turn ：まる,false : ばつ
let isPlayerturn = true;
let isXNext = true;

// 勝者
let winner: string | null = null;

// 履歴を保存
let xMoves: number[] = [];
let oMoves: number[] = [];

io.on("connection", (socket) => {
  console.log("✅ユーザーが接続", socket.id);

  // 接続ユーザーに盤面状況の共有
  socket.emit("update_board", { board, winner });

  // クライアントからの置きたいマス目の指示を受け取る
  socket.on("place_mark", (index: number) => {
    // すでに勝者がいる場合や盤面が埋まっている場合はなら早期リターン
    if (winner || board[index]) return;
    const currentPlayer = isXNext ? "○" : "×";
    const currentMoves = isXNext ? oMoves : xMoves;

    const winnermap = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ] as const;

    const checkWinner = (ele: (string | null)[]) => {
      for (const pattern of winnermap) {
        const [a, b, c] = pattern;
        // マス目がすべて同じかつ、空でない場合
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
          return board[a];
        }
      }
      return null;
    };
    // console.log(board[index]);
    // 既にある場所には置けないように
    if (board[index] !== null) return;

    // console.log(isPlayerturn);
    // 盤面を更新
    // board[index] = isPlayerturn ? "○" : "×";

    // 盤面の更新と履歴の保存
    board[index] = currentPlayer;
    currentMoves.push(index);
    console.log("確認用：", currentMoves.push(index));
    console.log("currentMoves：", currentMoves);
    // 保存されたマークの履歴が4つ以上になった時

    console.log(`--- ターン開始 ---`);
    console.log(`置いた人: ${isXNext ? "O" : "X"}, 場所: ${index}`);
    console.log(`Xの履歴: [${xMoves}], Oの履歴: [${oMoves}]`);
    if (currentMoves.length > 3) {
      // 一番古いマークから削除
      const oldIndex = currentMoves.shift();
      // undefinedじゃなかったら削除する
      if (oldIndex !== undefined) {
        board[oldIndex] = null;
      }
    }

    // console.log("ボード：", board);
    // console.log("ボードの添え字", board[index]);
    // 勝者の判定
    winner = checkWinner(board);

    if (winner) {
      console.log(`勝者決定:${winner}`);
    }
    // ターン交代
    isXNext = !isXNext;

    // 全員に盤面変更の放送
    io.emit("update_board", { board, winner });

    socket.on("reset_board", () => {
      console.log("ボタンを受信しました");
      // 勝敗判定後の情報リセット (board,winner)
      board = Array(9).fill(null);
      winner = null;
      isPlayerturn = true;
      isXNext = true;
      // 履歴もリセット
      xMoves = [];
      oMoves = [];

      // 最後に全員に通知
      io.emit("update_board", { board, winner });
    });
  });

  // 切断処理
  socket.on("disconneted", () => {
    console.log("✖:ユーザーが切断:", socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 サーバー起動中: http://localhost:${PORT}`);
});
