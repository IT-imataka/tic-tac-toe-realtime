import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { Socket } from "net";

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http:}//localhost:3000/", methods: ["GET", "POST"] },
});

// ゲームの状態を定義(9つ)
// null = なし,'〇' = まる,'×' = ばつ

// 最初はnullを入れる
let borad = Array(9).fill(null);

// ターン判定 turn ：まる,false : ばつ
let isPlayerturn = true;

io.on("connection", (socket) => {
  console.log("✅ユーザーが接続", socket.id);

  // 接続ユーザーに盤面状況の共有
  socket.emit("update_board", borad);

  // クライアントからの置きたいマス目の指示を受け取る
  socket.on("place_mark", (index: number) => {
    // 既にある場所には置けないように
    if (borad[index] !== null) return;

    // 盤面を更新
    borad[index] = isPlayerturn ? "〇" : "×";

    // ターン交代
    isPlayerturn = !isPlayerturn;

    // 全員に盤面変更の放送
    io.emit("update_borad", borad);

    // 切断処理
    socket.on("disconnected", () => {
      console.log("✖:ユーザーが切断:", socket.id);
    });
  });
});

// デバック処理
// 再起動無しで盤面をリセットしたい場合
io.on("reset_game", () => {
  borad = Array(9).fill(null);
  isPlayerturn = true;
  io.emit("update_borad", borad);
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 サーバー起動中: http://localhost:${PORT}`);
});
