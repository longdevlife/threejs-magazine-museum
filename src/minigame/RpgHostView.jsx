import React, { useEffect, useRef, useState } from "react";
import { ref, set, onValue, update, remove } from "firebase/database";
import { db } from "./firebaseConfig";
import { checkMapCollisions, WORLD_WIDTH, WORLD_HEIGHT } from "./rpgEngine";

const RpgHostView = ({ gameState, dbConnected, onResetRole }) => {
  const iframeRef = useRef(null);
  
  const [players, setPlayers] = useState({});
  const [books, setBooks] = useState({});
  const [traps, setTraps] = useState({});
  const [qrUrl, setQrUrl] = useState("");

  const requestRef = useRef(null);
  
  // Tọa độ bẫy di động đồng bộ lên Firebase cho game Phaser
  const localTraps = useRef({
    trap_1: { id: "trap_1", x: 480, y: 300, dy: 4.5, size: 35 },
    trap_2: { id: "trap_2", x: 1100, y: 700, dy: -4.5, size: 35 },
    trap_3: { id: "trap_3", x: 500, y: 700, dx: 5.5, size: 35 }
  });
  
  const lastSyncTime = useRef(0);

  // Tạo mã QR
  useEffect(() => {
    const url = window.location.origin + window.location.pathname + "#minigame";
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=a16b47&data=${encodeURIComponent(url)}`);
  }, []);

  // Lắng nghe dữ liệu
  useEffect(() => {
    const playersRef = ref(db, "players");
    const booksRef = ref(db, "books");
    const trapsRef = ref(db, "traps");

    const unsubPlayers = onValue(playersRef, (snapshot) => {
      setPlayers(snapshot.val() || {});
    });

    const unsubBooks = onValue(booksRef, (snapshot) => {
      setBooks(snapshot.val() || {});
    });

    const unsubTraps = onValue(trapsRef, (snapshot) => {
      setTraps(snapshot.val() || {});
    });

    return () => {
      unsubPlayers();
      unsubBooks();
      unsubTraps();
    };
  }, []);

  // Loop chạy ngầm của Host để tính toán bẫy/sách và cập nhật lên Firebase
  const hostLoop = () => {
    if (gameState.status === "playing") {
      // 1. Chạy chuyển động bẫy
      moveTrapsLocal();

      // 2. Đồng bộ lên Firebase (throttle 60ms)
      const now = Date.now();
      if (now - lastSyncTime.current > 60) {
        lastSyncTime.current = now;
        syncTrapsToFirebase();
        maintainBooksCount();
      }
    }

    requestRef.current = requestAnimationFrame(hostLoop);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(hostLoop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [books, traps, gameState.status]);

  const moveTrapsLocal = () => {
    const t = localTraps.current;
    
    // Bẫy dọc 1
    t.trap_1.y += t.trap_1.dy;
    if (t.trap_1.y < 120 || t.trap_1.y > 800) t.trap_1.dy *= -1;

    // Bẫy dọc 2
    t.trap_2.y += t.trap_2.dy;
    if (t.trap_2.y < 120 || t.trap_2.y > 800) t.trap_2.dy *= -1;

    // Bẫy ngang 3
    t.trap_3.x += t.trap_3.dx;
    if (t.trap_3.x < 480 || t.trap_3.x > 1100) t.trap_3.dx *= -1;
  };

  const syncTrapsToFirebase = () => {
    update(ref(db, "traps"), localTraps.current);
  };

  const maintainBooksCount = () => {
    const currentBooks = Object.keys(books);
    if (currentBooks.length < 6) {
      let bx = Math.floor(Math.random() * (WORLD_WIDTH - 150)) + 70;
      let by = Math.floor(Math.random() * (WORLD_HEIGHT - 150)) + 70;
      
      let attempts = 0;
      while (checkMapCollisions(bx, by, 24) && attempts < 25) {
        bx = Math.floor(Math.random() * (WORLD_WIDTH - 150)) + 70;
        by = Math.floor(Math.random() * (WORLD_HEIGHT - 150)) + 70;
        attempts++;
      }

      if (attempts < 25) {
        const newBookId = "book_" + Date.now();
        set(ref(db, `books/${newBookId}`), { x: bx, y: by });
      }
    }
  };

  const playerList = Object.entries(players).map(([id, info]) => ({ id, ...info }));
  const totalPlayers = playerList.length;

  const handleKickPlayer = async (playerId) => {
    if (window.confirm("Bạn có chắc chắn muốn kick người chơi này ra khỏi phòng?")) {
      await remove(ref(db, `players/${playerId}`));
    }
  };

  const handleStartGame = async () => {
    const updates = {};
    playerList.forEach((player) => {
      updates[`players/${player.id}/score`] = 0;
      updates[`players/${player.id}/capital`] = 20000000;
      updates[`players/${player.id}/streak`] = 0;
      updates[`players/${player.id}/isBankrupt`] = false;
      const colors = ["#ff5722", "#e91e63", "#9c27b0", "#3f51b5", "#00bcd4", "#8bc34a", "#ffc107"];
      updates[`players/${player.id}/color`] = colors[Math.floor(Math.random() * colors.length)];
    });

    await remove(ref(db, "answers"));
    await remove(ref(db, "books"));
    await remove(ref(db, "traps"));

    updates["gameState"] = {
      status: "playing",
      currentQuestion: 0,
      questionStartedAt: Date.now(),
      timeLimit: 20
    };

    update(ref(db), updates);
  };

  const handleFinishGame = () => {
    set(ref(db, "gameState/status"), "finished");
  };

  const handleResetGame = async () => {
    await remove(ref(db, "answers"));
    await remove(ref(db, "books"));
    await remove(ref(db, "traps"));
    await set(ref(db, "gameState"), {
      status: "waiting",
      currentQuestion: 0,
      questionStartedAt: 0,
      timeLimit: 20
    });
  };

  return (
    <div className="minigame-panel" style={{ maxWidth: "1200px", width: "95%", background: "#fcf3e3", color: "#333", border: "4px solid #a16b47" }}>
      
      {/* Header Điều khiển MC */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "2px solid #a16b47", paddingBottom: "15px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.5rem" }}>🖥️</span>
          <span style={{ fontWeight: 800, color: "#a16b47", letterSpacing: "1px", textTransform: "uppercase" }}>
            MÀN HÌNH TỔNG QUAN MC (MÁY CHIẾU)
          </span>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn-cyber" style={{ padding: "8px 15px", fontSize: "0.85rem", background: "#ffffff", color: "#a16b47", border: "2px solid #a16b47", boxShadow: "none" }} onClick={onResetRole}>
            Đổi vai trò
          </button>
          <button className="btn-cyber" style={{ padding: "8px 15px", fontSize: "0.85rem", background: "linear-gradient(135deg, #a16b47, #5c3d28)", color: "#fff", boxShadow: "none" }} onClick={handleResetGame}>
            Reset Game
          </button>
        </div>
      </div>

      {/* 1. TRẠNG THÁI WAITING */}
      {gameState.status === "waiting" && (
        <div className="lobby-waiting">
          <h2 className="minigame-title" style={{ color: "#a16b47" }}>PHÒNG CHỜ THAM GIA</h2>
          <p className="minigame-subtitle" style={{ color: "#795548" }}>Mời cả lớp quét mã QR để bắt đầu hành trình RPG sinh tồn</p>

          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: "60px", margin: "40px 0" }}>
            {qrUrl && (
              <div style={{ background: "#fff", padding: "15px", borderRadius: "15px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", border: "3px solid #a16b47" }}>
                <img src={qrUrl} alt="QR Code" style={{ display: "block" }} />
                <div style={{ color: "#a16b47", fontSize: "0.85rem", fontWeight: "bold", marginTop: "10px" }}>
                  QUÉT ĐỂ THAM GIA
                </div>
              </div>
            )}
            
            <div style={{ textAlign: "left", maxWidth: "400px" }}>
              <div style={{ fontSize: "1.2rem", marginBottom: "15px", color: "#a16b47", fontWeight: "bold" }}>
                HƯỚNG DẪN CHƠI GAME:
              </div>
              <ol style={{ paddingLeft: "20px", color: "#5c3d28", lineHeight: "1.8", fontSize: "1rem" }}>
                <li>Nhập tên để mở shop quà tặng.</li>
                <li>Sử dụng **WASD / Phím mũi tên** (PC) hoặc **D-pad** (Điện thoại) để di chuyển nhân vật chibi.</li>
                <li>Tìm kiếm và chạm vào **Cuốn sách vàng** để trả lời câu hỏi và kiếm thêm vốn.</li>
                <li>**Né tránh các Vòng tròn sét** để không bị trừ vốn và khóa thuật toán!</li>
              </ol>
              <div className="player-count" style={{ fontSize: "1.6rem", color: "#388e3c", marginTop: "15px" }}>
                Đã tham gia: {totalPlayers} người chơi
              </div>
              <button 
                className="btn-cyber" 
                style={{ width: "100%", marginTop: "20px", padding: "18px", background: "linear-gradient(135deg, #a16b47, #5c3d28)", color: "#fff" }}
                onClick={handleStartGame}
                disabled={totalPlayers === 0}
              >
                Khởi động Game RPG ➔
              </button>
            </div>
          </div>

          <h3 style={{ textTransform: "uppercase", fontSize: "0.95rem", color: "#a16b47", letterSpacing: "1px", marginBottom: "15px", textAlign: "left" }}>
            Danh sách người chơi:
          </h3>
          {totalPlayers === 0 ? (
            <div style={{ color: "#795548", fontStyle: "italic", padding: "20px" }}>Đang chờ cả lớp tham gia...</div>
          ) : (
            <div className="player-grid">
              {playerList.map((p) => (
                <div className="player-pill" key={p.id} style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#ffffff", border: "1px solid #a16b47", color: "#333", overflow: "visible" }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>👤 {p.name}</span>
                  <button 
                    onClick={() => handleKickPlayer(p.id)}
                    style={{
                      background: "rgba(211, 47, 47, 0.1)",
                      border: "1px solid #d32f2f",
                      borderRadius: "50%",
                      width: "18px",
                      height: "18px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#d32f2f",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "bold",
                      padding: 0,
                      lineHeight: 1
                    }}
                    title="Kick"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. TRẠNG THÁI PLAYING (Nhúng iframe Spectator Mode của Phaser) */}
      {gameState.status === "playing" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "25px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "30px", justifyContent: "center" }}>
            
            <div style={{ flex: "2", minWidth: "300px", maxWidth: "800px" }}>
              <div style={{ border: "4px solid #333333", borderRadius: "12px", overflow: "hidden", background: "#000", position: "relative" }}>
                <iframe 
                  ref={iframeRef}
                  src="/rpg/index.html?role=host"
                  style={{ width: "100%", aspectRatio: "4/3", border: "none", display: "block" }}
                  title="Phaser RPG Host View"
                />
              </div>
              <div style={{ marginTop: "15px", display: "flex", justifyContent: "space-between" }}>
                <div style={{ color: "#795548", fontSize: "0.9rem" }}>
                  💡 MC có thể kéo chuột để di chuyển camera tự do hoặc dùng phím mũi tên để quan sát lớp học.
                </div>
                <button className="btn-cyber" style={{ background: "linear-gradient(135deg, #a16b47, #5c3d28)", color: "#fff" }} onClick={handleFinishGame}>
                  Kết thúc game & Vinh danh 🎉
                </button>
              </div>
            </div>

            <div style={{ flex: "1", minWidth: "250px", maxWidth: "350px", background: "#ffffff", border: "2px solid #a16b47", borderRadius: "12px", padding: "20px" }}>
              <h3 className="leaderboard-title" style={{ fontSize: "1.5rem", marginBottom: "20px", color: "#a16b47", borderBottom: "2px solid #a16b47", paddingBottom: "5px" }}>XẾP HẠNG REALTIME</h3>
              
              <div className="leaderboard-list">
                {playerList
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 8)
                  .map((player, idx) => (
                    <div className="leaderboard-item" key={player.id} style={{ padding: "10px 15px", fontSize: "0.95rem", background: "rgba(161, 107, 71, 0.05)", borderBottom: "1px solid rgba(161, 107, 71, 0.15)", color: "#333" }}>
                      <div className="player-info">
                        <span className="player-rank" style={{ fontSize: "1.1rem", color: "#a16b47" }}>{idx + 1}</span>
                        <span className="player-name-txt" style={{ fontSize: "1rem", color: "#333" }}>{player.name} {player.isBankrupt ? "💀" : ""}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                        <span style={{ fontSize: "0.75rem", color: "#795548" }}>{(player.capital ?? 0).toLocaleString()}đ</span>
                        <span className="player-score-txt" style={{ fontSize: "1rem", color: "#388e3c", fontWeight: "bold" }}>{player.score}đ</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3. TRẠNG THÁI FINISHED */}
      {gameState.status === "finished" && (
        <div style={{ textAlign: "center" }}>
          <h2 className="minigame-title" style={{ color: "#a16b47" }}>CHIẾN THẮNG CHUNG CUỘC</h2>
          <p className="minigame-subtitle" style={{ color: "#795548" }}>Vinh danh những nhà sinh tồn xuất sắc nhất trên Sàn Số</p>

          {playerList.length > 0 && (
            <div className="podium-container" style={{ margin: "30px 0" }}>
              {playerList.sort((a,b)=>b.score - a.score)[1] && (
                <div className="podium-step silver" style={{ background: "#e0e0e0", border: "3px solid #b0bec5", color: "#333" }}>
                  <div className="podium-crown" style={{ animationDelay: "0.5s" }}>🥈</div>
                  <div className="podium-name">{playerList.sort((a,b)=>b.score - a.score)[1].name}</div>
                  <div className="podium-score" style={{ color: "#1976d2" }}>{playerList.sort((a,b)=>b.score - a.score)[1].score}đ</div>
                  <div className="podium-number" style={{ color: "#78909c" }}>2</div>
                </div>
              )}

              {playerList.sort((a,b)=>b.score - a.score)[0] && (
                <div className="podium-step gold" style={{ background: "#ffe082", border: "3px solid #ffb300", color: "#333" }}>
                  <div className="podium-crown">👑</div>
                  <div className="podium-name" style={{ fontWeight: "bold" }}>{playerList.sort((a,b)=>b.score - a.score)[0].name}</div>
                  <div className="podium-score" style={{ fontWeight: "bold", color: "#388e3c" }}>{playerList.sort((a,b)=>b.score - a.score)[0].score}đ</div>
                  <div className="podium-number" style={{ color: "#ffb300" }}>1</div>
                </div>
              )}

              {playerList.sort((a,b)=>b.score - a.score)[2] && (
                <div className="podium-step bronze" style={{ background: "#d7ccc8", border: "3px solid #8d6e63", color: "#333" }}>
                  <div className="podium-crown" style={{ animationDelay: "1s" }}>🥉</div>
                  <div className="podium-name">{playerList.sort((a,b)=>b.score - a.score)[2].name}</div>
                  <div className="podium-score" style={{ color: "#8d6e63" }}>{playerList.sort((a,b)=>b.score - a.score)[2].score}đ</div>
                  <div className="podium-number" style={{ color: "#8d6e63" }}>3</div>
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: "40px", textAlign: "left" }}>
            <h3 className="leaderboard-title" style={{ color: "#a16b47" }}>BẢNG XẾP HẠNG CHI TIẾT (TOP 10)</h3>
            <div className="leaderboard-list">
              {playerList
                .sort((a, b) => b.score - a.score)
                .slice(0, 10)
                .map((player, idx) => (
                  <div className="leaderboard-item" key={player.id} style={{ background: "#ffffff", color: "#333", borderBottom: "1px solid rgba(161, 107, 71, 0.2)" }}>
                    <div className="player-info">
                      <span className="player-rank" style={{ color: "#a16b47" }}>{idx + 1}</span>
                      <span className="player-name-txt" style={{ color: "#333" }}>
                        {player.name} {idx === 0 ? "👑" : ""} {player.isBankrupt ? "💀" : ""}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "25px" }}>
                      <span style={{ color: "#795548" }}>
                        Vốn cuối: {(player.capital ?? 0).toLocaleString()}đ
                      </span>
                      <span className="player-score-txt" style={{ color: "#388e3c", fontWeight: "bold" }}>{player.score}đ</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "20px", marginTop: "40px" }}>
            <button className="btn-cyber" style={{ flex: 1, background: "linear-gradient(135deg, #a16b47, #5c3d28)", color: "#fff" }} onClick={handleStartGame}>
              Chơi Lượt Mới
            </button>
            <button className="btn-cyber" style={{ flex: 1, background: "#ffffff", color: "#a16b47", border: "2px solid #a16b47" }} onClick={handleResetGame}>
              Quay lại Phòng Chờ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RpgHostView;
