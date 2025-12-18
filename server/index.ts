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

io.on("connection", (socket) => {
  console.log("✅ユーザーが接続", socket.id);

  // 接続ユーザーに盤面状況の共有
  socket.emit("update_board", board);

  // クライアントからの置きたいマス目の指示を受け取る
  socket.on("place_mark", (index: number) => {
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

    const checkWinner = () => {
      for (const pattern of winnermap) {
        const [a, b, c] = pattern;
        // マス目がすべて同じかつ、空でない場合
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
          return board[a];
        }
      }
      return null;
    };
    // console.log(board);
    console.log("受け取った");
    // 既にある場所には置けないように
    if (board[index] !== null) return;

    console.log(isPlayerturn);
    // 盤面を更新
    board[index] = isPlayerturn ? "○" : "×";
    const winner = checkWinner();
    if (winner) {
      console.log(`商社決定:${winner}`);
    }

    // ターン交代
    isPlayerturn = !isPlayerturn;

    // 全員に盤面変更の放送
    io.emit("update_board", board);

    // 以下は趣味嗜好のため時間ができたら
    // 配列の添え字を取得して縦横斜めの差が一定の時を検知する
    // const rowjudge = (index: number) => {
    //   console.log(board.indexOf(index));
    // };

    // 1行目
    // for (let i = 0; i < 3; i++) {
    //   // console.log(board);
    //   // 1列目
    //   for (let j = 0; j < 3; j++) {
    //     console.log(board[i]);
    //   }
    // }

    // 切断処理
    socket.on("disconneted", () => {
      console.log("✖:ユーザーが切断:", socket.id);
    });
  });
});

// デバック処理
// 再起動無しで盤面をリセットしたい場合
io.on("reset_game", () => {
  board = Array(9).fill(null);
  isPlayerturn = true;
  io.emit("update_board", board);
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 サーバー起動中: http://localhost:${PORT}`);
});
