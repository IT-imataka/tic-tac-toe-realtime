import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.get("/", (req, res) => {
  res.send("Server is running.");
});
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://tic-tac-toe-client-brp5.onrender.com",
    ],
    methods: ["GET", "POST"],
  },
});

// 複数の同時接続を可能にするインターフェイスを定義
interface roomData {
  board: (string | null)[];
  isNext: boolean;
  winner: string | null;
  xMoves: number[];
  oMoves: number[];
}
// 部屋の台帳を作成
const rooms: Record<string, roomData> = {};

// ゲームの状態を定義(9つ)
// null = なし,'〇' = まる,'×' = ばつ

// 最初はnullを入れる
// let board = Array(9).fill(null);
// ターン判定 turn ：まる,false : ばつ
// let isXNext = true;
// 勝者
// let winner: string | null = null;
// 履歴を保存
// let xMoves: number[] = [];
// let oMoves: number[] = [];

// app/page.tsx

io.on("connection", (socket) => {
  console.log("✅ユーザーが接続", socket.id);
  // ユーザー接続時に部屋に通す玄関口の設定
  socket.on("join_room", (roomIDs: string) => {
    // ここにインターフェイスで定義した変数を初期化する
    console.log(roomIDs);
    socket.join(roomIDs);

    // 部屋の登録情報がなければ作成、初期化した部屋オブジェクトは動的に変化するためブラケットで参照する
    if (!rooms[roomIDs]) {
      console.log(`🏨部屋番号を作成", ${roomIDs}`);
      rooms[roomIDs] = {
        board: Array(9).fill(null),
        isNext: true,
        winner: null,
        xMoves: [],
        oMoves: [],
      };
    }

    // 部屋の情報(盤面、勝者など)を入室者だけに通知
    const room = rooms[roomIDs];
    socket.emit("update_board", {
      board: room.board,
      winner: room.winner,
    });

    // game/page.tsx

    // クライアントからの置きたいマス目の指示を受け取る
    socket.on("place_mark", (data: { index: number; roomID: string }) => {
      // 分割代入
      const { index, roomID } = data;
      console.log(`place_mark：受信 index:${index} roomID:${roomID}`);
      // 部屋の有無の判定　あれば早期リターン　なければ作成
      const room = rooms[roomID];
      if (!room) return;

      // すでに勝者がいる場合や盤面が埋まっている場合の判定
      if (room.winner || room.board[index]) return;

      // ターン、プレイヤー判定は下記のように修正
      const currentPlayer = room.isNext ? "○" : "×";
      const currentMoves = room.isNext ? room.oMoves : room.xMoves;

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
          if (
            room.board[a] &&
            room.board[a] === room.board[b] &&
            room.board[a] === room.board[c]
          ) {
            return room.board[a];
          }
        }
        return null;
      };
      // console.log(board[index]);
      // 既にある場所には置けないように
      if (room.board[index] !== null) return;

      // 盤面の更新と履歴の保存
      room.board[index] = currentPlayer;
      currentMoves.push(index);
      // console.log("確認用：", currentMoves.push(index));
      // console.log("currentMoves：", currentMoves);

      // 保存されたマークの履歴が4つ以上になった時

      console.log(`--- ターン開始 ---`);
      console.log(`置いた人: ${room.isNext ? "O" : "X"}, 場所: ${index}`);
      console.log(`Xの履歴: [${room.xMoves}], Oの履歴: [${room.oMoves}]`);

      if (currentMoves.length > 3) {
        // 一番古いマークから削除
        const oldIndex = currentMoves?.shift();
        // undefinedじゃなかったら削除する
        if (oldIndex !== undefined) {
          room.board[oldIndex] = null;
        }
      }

      // console.log("ボード：", board);
      // console.log("ボードの添え字", board[index]);
      // 勝者の判定
      room.winner = checkWinner(room.board);

      if (room) {
        console.log(`勝者決定:${room.winner}`);
      }
      // ターン交代
      room.isNext = !room.isNext;
      const nextInv: number[] = [];

      // 転送する前にサーバーの変数を更新する

      if (room.xMoves.length >= 3 && room.xMoves[0] !== undefined) {
        nextInv.push(room.xMoves[0]);
      }
      if (room.oMoves.length >= 3 && room.oMoves[0] !== undefined) {
        nextInv.push(room.oMoves[0]);
      }

      // 全員に盤面変更の放送からその部屋の住人のみに放送
      io.to(roomID).emit("update_board", {
        board: room.board,
        winner: room.winner,
        oMoves: room.oMoves,
        xMoves: room.xMoves,
        isNext: room.isNext,
      });
    });
    socket.on("reset_board", (roomID: string) => {
      const room = rooms[roomID];
      if (room) {
        // 勝敗判定後の情報リセット (board,winner)
        room.board = Array(9).fill(null);
        room.winner = null;

        // ×に戻す
        room.isNext = true;

        // 履歴もリセット
        room.xMoves = [];
        room.oMoves = [];

        console.log("送出データ:", { isNext: room.isNext });
        // 最後に全員に通知
        io.to(roomID).emit("update_board", {
          board: room.board,
          winner: room.winner,
          isNext: room.isNext,
          oMoves: room.oMoves,
          xMoves: room.xMoves,
        });
      } else {
        console.log(
          `リセットできませんでした。部屋：${room}が見つかりません。`
        );
      }
    });
  });

  // 切断処理
  socket.on("disconneted", () => {
    console.log("✖:ユーザーが切断:", socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 サーバー起動中: http://localhost:${PORT}`);
});
// Render更新用のコメント（これ追加して保存！）
