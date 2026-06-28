import React, { useState, useEffect, useRef } from "react";
import { ref, set, onValue, remove, update, get, runTransaction } from "firebase/database";
import { db } from "./firebaseConfig";
import { situations, PHASE_CONFIGS } from "./situations";
import { applyPlayerDelta } from "./gameStateUtils";
import { checkMapCollisions, WORLD_WIDTH, WORLD_HEIGHT } from "./rpgEngine";

const HostView = ({ gameState, dbConnected, onResetRole }) => {
  const [players, setPlayers] = useState({});
  const [votes, setVotes] = useState({});
  const [qrUrl, setQrUrl] = useState("");

  // RPG Host logic
  const iframeRef = useRef(null);
  const requestRef = useRef(null);
  const lastSyncTime = useRef(0);
  const platformFeeTimer = useRef(null);
  const platformFeeInFlight = useRef(false);
  const [books, setBooks] = useState({});

  // Cấu hình bẫy động theo phase
  const getInitialTraps = (count, speed) => {
    const traps = {};
    const positions = [
      { x: 480, y: 300, axis: "y" },
      { x: 1100, y: 700, axis: "y" },
      { x: 500, y: 700, axis: "x" },
      { x: 800, y: 200, axis: "x" },
      { x: 300, y: 500, axis: "y" },
      { x: 900, y: 400, axis: "x" },
    ];
    for (let i = 0; i < Math.min(count, positions.length); i++) {
      const p = positions[i];
      traps[`trap_${i + 1}`] = {
        id: `trap_${i + 1}`,
        x: p.x,
        y: p.y,
        ...(p.axis === "y" ? { dy: speed * (i % 2 === 0 ? 1 : -1) } : { dx: speed * (i % 2 === 0 ? 1 : -1) }),
        size: 35,
      };
    }
    return traps;
  };

  const localTraps = useRef(getInitialTraps(2, 3.5));

  // QR
  useEffect(() => {
    const url = window.location.origin + window.location.pathname + "#minigame";
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=c5272d&data=${encodeURIComponent(url)}`);
  }, []);

  // Lắng nghe players
  useEffect(() => {
    const unsubPlayers = onValue(ref(db, "players"), (s) => setPlayers(s.val() || {}));
    const unsubBooks = onValue(ref(db, "books"), (s) => setBooks(s.val() || {}));
    return () => { unsubPlayers(); unsubBooks(); };
  }, []);

  // Lắng nghe votes cho tình huống hiện tại
  useEffect(() => {
    if (gameState.status === "situation_1" || gameState.status === "situation_2") {
      const sitNum = gameState.status === "situation_1" ? 1 : 2;
      const unsubVotes = onValue(ref(db, `votes/situation_${sitNum}`), (s) => setVotes(s.val() || {}));
      return () => unsubVotes();
    } else {
      setVotes({});
    }
  }, [gameState.status]);

  // Platform fee timer — tự động trừ vốn mọi player
  useEffect(() => {
    if (platformFeeTimer.current) clearInterval(platformFeeTimer.current);
    platformFeeInFlight.current = false;

    const phaseKey = gameState.status; // phase_1, phase_2, phase_3
    const config = PHASE_CONFIGS[phaseKey];
    if (config && config.platformFeeInterval > 0) {
      platformFeeTimer.current = setInterval(async () => {
        if (platformFeeInFlight.current) return;
        platformFeeInFlight.current = true;
        try {
          const playersSnapshot = await get(ref(db, "players"));
          const currentPlayers = playersSnapshot.val() || {};
          await Promise.all(
            Object.keys(currentPlayers).map((id) =>
              runTransaction(
                ref(db, `players/${id}`),
                (player) => applyPlayerDelta(player, { capital: -config.platformFeeAmount }),
                { applyLocally: false }
              )
            )
          );
        } finally {
          platformFeeInFlight.current = false;
        }
      }, config.platformFeeInterval);
    }

    return () => { if (platformFeeTimer.current) clearInterval(platformFeeTimer.current); };
  }, [gameState.status]);

  // RPG Host Loop — bẫy + sách
  const hostLoop = () => {
    const isPlaying = ["phase_1", "phase_2", "phase_3"].includes(gameState.status);
    if (isPlaying) {
      moveTrapsLocal();
      const now = Date.now();
      if (now - lastSyncTime.current > 60) {
        lastSyncTime.current = now;
        update(ref(db, "traps"), localTraps.current);
        maintainBooks();
      }
    }
    requestRef.current = requestAnimationFrame(hostLoop);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(hostLoop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [books, gameState.status]);

  const moveTrapsLocal = () => {
    Object.values(localTraps.current).forEach((t) => {
      if (t.dy) {
        t.y += t.dy;
        if (t.y < 120 || t.y > 800) t.dy *= -1;
      }
      if (t.dx) {
        t.x += t.dx;
        if (t.x < 100 || t.x > 1400) t.dx *= -1;
      }
    });
  };

  const maintainBooks = () => {
    const config = PHASE_CONFIGS[gameState.status];
    if (!config) return;
    const currentBooks = Object.keys(books);
    if (currentBooks.length < config.maxBooks) {
      let bx = Math.floor(Math.random() * (WORLD_WIDTH - 150)) + 70;
      let by = Math.floor(Math.random() * (WORLD_HEIGHT - 150)) + 70;
      let attempts = 0;
      while (checkMapCollisions(bx, by, 24) && attempts < 25) {
        bx = Math.floor(Math.random() * (WORLD_WIDTH - 150)) + 70;
        by = Math.floor(Math.random() * (WORLD_HEIGHT - 150)) + 70;
        attempts++;
      }
      if (attempts < 25) {
        set(ref(db, `books/book_${Date.now()}`), { x: bx, y: by });
      }
    }
  };

  const playerList = Object.entries(players).map(([id, info]) => ({ id, ...info }));
  const totalPlayers = playerList.length;
  const currentConfig = PHASE_CONFIGS[gameState.status];

  // ===== ACTIONS =====

  const handleStartPhase = async (phaseKey) => {
    const config = PHASE_CONFIGS[phaseKey];
    const updates = {};

    if (phaseKey === "phase_1") {
      // Reset điểm
      playerList.forEach((p) => {
        updates[`players/${p.id}/score`] = 0;
        updates[`players/${p.id}/capital`] = 20000000;
        updates[`players/${p.id}/streak`] = 0;
        updates[`players/${p.id}/isBankrupt`] = false;
      });
      await remove(ref(db, "votes"));
    }

    await remove(ref(db, "books"));
    await remove(ref(db, "traps"));

    // Cập nhật bẫy theo phase
    localTraps.current = getInitialTraps(config.trapCount, config.trapSpeed);
    await update(ref(db, "traps"), localTraps.current);

    updates["gameState"] = {
      status: phaseKey,
      phaseStartedAt: Date.now(),
      bookReward: config.bookReward,
      trapPenalty: config.trapPenalty,
    };

    update(ref(db), updates);
  };

  const handleTriggerSituation = (sitNum) => {
    set(ref(db, "gameState/status"), `situation_${sitNum}`);
  };

  const handleFinishGame = () => {
    set(ref(db, "gameState/status"), "finished");
  };

  const handleResetGame = async () => {
    await remove(ref(db, "votes"));
    await remove(ref(db, "books"));
    await remove(ref(db, "traps"));
    await set(ref(db, "gameState"), { status: "waiting" });
  };

  // Vote stats
  const getVoteStats = () => {
    let aCount = 0, bCount = 0;
    Object.values(votes).forEach((v) => {
      if (v.choice === "A") aCount++;
      else if (v.choice === "B") bCount++;
    });
    const total = aCount + bCount || 1;
    return {
      aCount, bCount, total: aCount + bCount,
      aPercent: Math.round((aCount / total) * 100),
      bPercent: Math.round((bCount / total) * 100),
    };
  };

  // ===== Leaderboard =====
  const Leaderboard = ({ max = 8, title = "XẾP HẠNG REALTIME" }) => (
    <div>
      <h3 className="leaderboard-title" style={{ fontSize: "1.1rem", color: "var(--neon-gold)" }}>{title}</h3>
      <div className="leaderboard-list">
        {playerList
          .sort((a, b) => b.score - a.score)
          .slice(0, max)
          .map((p, idx) => (
            <div className="leaderboard-item" key={p.id}>
              <div className="player-info">
                <span className="player-rank">{idx + 1}</span>
                <span className="player-name-txt">{p.name} {p.isBankrupt ? "💀" : ""}</span>
              </div>
              <div style={{ display: "flex", gap: "15px", fontSize: "0.9rem" }}>
                <span style={{ color: p.capital <= 0 ? "var(--neon-red)" : "#8b8680" }}>{(p.capital || 0).toLocaleString()}đ</span>
                <span className="player-score-txt">{p.score}đ</span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  const isRpgPhase = ["phase_1", "phase_2", "phase_3"].includes(gameState.status);

  return (
    <div className="minigame-panel" style={{ maxWidth: "1200px", width: "95%" }}>
      {/* Header MC */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.3rem" }}>🖥️</span>
          <span style={{ fontWeight: 800, color: "var(--neon-red)", letterSpacing: "1px", textTransform: "uppercase", fontSize: "0.95rem" }}>
            Bảng điều khiển MC
          </span>
          {currentConfig && (
            <span style={{ fontSize: "0.85rem", color: "var(--neon-gold)", marginLeft: "10px" }}>
              {currentConfig.emoji} {currentConfig.name}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn-cyber" style={{ padding: "6px 12px", fontSize: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "none" }} onClick={onResetRole}>Đổi vai</button>
          <button className="btn-cyber" style={{ padding: "6px 12px", fontSize: "0.8rem", background: "linear-gradient(135deg, #555, #222)", boxShadow: "none" }} onClick={handleResetGame}>Reset</button>
        </div>
      </div>

      {/* ===== WAITING ===== */}
      {gameState.status === "waiting" && (
        <div className="lobby-waiting">
          <h2 className="minigame-title">SINH TỒN TRÊN NỀN TẢNG SỐ</h2>
          <p className="minigame-subtitle">Mời cả lớp quét mã QR để bắt đầu hành trình sinh tồn RPG</p>

          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: "50px", margin: "35px 0" }}>
            {qrUrl && (
              <div style={{ background: "#fff", padding: "15px", borderRadius: "15px", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
                <img src={qrUrl} alt="QR Code" style={{ display: "block" }} />
                <div style={{ color: "#333", fontSize: "0.85rem", fontWeight: "bold", marginTop: "10px" }}>QUÉT ĐỂ CHƠI</div>
              </div>
            )}

            <div style={{ textAlign: "left", maxWidth: "400px" }}>
              <div style={{ fontSize: "1.1rem", marginBottom: "10px", color: "var(--neon-gold)", fontWeight: "bold" }}>LUẬT CHƠI:</div>
              <ol style={{ paddingLeft: "20px", color: "#8b8680", lineHeight: "1.7" }}>
                <li>Di chuyển nhân vật bằng <b>WASD/mũi tên</b> (PC) hoặc <b>D-pad</b> (Mobile)</li>
                <li>Nhặt <b>sách vàng 📖</b> để kiếm vốn và điểm</li>
                <li>Né tránh <b>vòng tròn sét ⚡</b> để không bị trừ vốn</li>
                <li>Trải qua <b>3 giai đoạn kinh tế</b> với độ khó tăng dần</li>
              </ol>
              <div className="player-count" style={{ marginTop: "15px" }}>
                Đã tham gia: {totalPlayers} người chơi
                <div className="loading-dots"><span></span><span></span><span></span></div>
              </div>
              <button className="btn-cyber btn-cyber-blue" style={{ width: "100%", marginTop: "15px" }} onClick={() => handleStartPhase("phase_1")} disabled={totalPlayers === 0}>
                🌱 Bắt đầu Phase 1: Thị Trường Tự Do
              </button>
            </div>
          </div>

          {totalPlayers > 0 && (
            <div className="player-grid">
              {playerList.map((p) => <div className="player-pill" key={p.id}>👤 {p.name}</div>)}
            </div>
          )}
        </div>
      )}

      {/* ===== RPG PHASE (1/2/3) ===== */}
      {isRpgPhase && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "bold", color: "var(--neon-gold)", margin: 0 }}>
              {currentConfig.emoji} PHASE {gameState.status.replace("phase_", "")}: {currentConfig.name}
            </h2>
            <span style={{ color: "#8b8680", fontSize: "0.85rem" }}>{totalPlayers} người chơi</span>
          </div>

          {/* MC narration */}
          <div style={{ background: "rgba(255,183,0,0.1)", border: "1px solid rgba(255,183,0,0.3)", borderRadius: "10px", padding: "12px 18px", marginBottom: "15px", fontSize: "0.95rem", color: "var(--neon-gold)", fontStyle: "italic" }}>
            💬 MC: "{currentConfig.mcNarration}"
          </div>

          {/* Thông tin phase */}
          {currentConfig.platformFeeInterval > 0 && (
            <div style={{ background: "rgba(255,51,68,0.15)", border: "1px solid rgba(255,51,68,0.3)", borderRadius: "8px", padding: "8px 15px", marginBottom: "15px", fontSize: "0.85rem", color: "var(--neon-red)" }}>
              💀 PHÍ SÀN: Tự động trừ <b>{currentConfig.platformFeeAmount.toLocaleString()}đ</b> vốn mỗi <b>{currentConfig.platformFeeInterval / 1000}s</b>
            </div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center" }}>
            {/* RPG Spectator */}
            <div style={{ flex: "2", minWidth: "350px", maxWidth: "750px" }}>
              <div style={{ border: "4px solid #333", borderRadius: "12px", overflow: "hidden", background: "#000" }}>
                <iframe
                  ref={iframeRef}
                  src="/rpg/index.html?role=host"
                  style={{ width: "100%", aspectRatio: "16/9", border: "none", display: "block" }}
                  title="RPG Spectator"
                />
              </div>
              <div style={{ marginTop: "8px", color: "#8b8680", fontSize: "0.8rem" }}>
                💡 Kéo chuột hoặc phím mũi tên để quan sát bản đồ
              </div>
            </div>

            {/* Leaderboard + Controls */}
            <div style={{ flex: "1", minWidth: "260px", maxWidth: "350px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "15px" }}>
              <Leaderboard />

              <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {gameState.status === "phase_1" && (
                  <button className="btn-cyber" style={{ width: "100%", background: "linear-gradient(135deg, #ff6b35, #c5272d)" }} onClick={() => handleTriggerSituation(1)}>
                    ⚡ Kích hoạt Tình huống 1
                  </button>
                )}
                {gameState.status === "phase_2" && (
                  <button className="btn-cyber" style={{ width: "100%", background: "linear-gradient(135deg, #ff6b35, #c5272d)" }} onClick={() => handleTriggerSituation(2)}>
                    ⚡ Kích hoạt Tình huống 2
                  </button>
                )}
                {gameState.status === "phase_3" && (
                  <button className="btn-cyber btn-cyber-blue" style={{ width: "100%" }} onClick={handleFinishGame}>
                    🏆 Kết thúc & Vinh danh
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== SITUATION 1 or 2 ===== */}
      {(gameState.status === "situation_1" || gameState.status === "situation_2") && (() => {
        const sitIdx = gameState.status === "situation_1" ? 0 : 1;
        const sit = situations[sitIdx];
        const stats = getVoteStats();
        const nextPhase = gameState.status === "situation_1" ? "phase_2" : "phase_3";

        return (
          <div>
            <h2 style={{ color: "var(--neon-red)", fontSize: "1.4rem", fontWeight: "bold", textAlign: "center", marginBottom: "5px" }}>
              ⚡ TÌNH HUỐNG {sitIdx + 1}: {sit.title.toUpperCase()}
            </h2>

            <div className="situation-box" style={{ fontSize: "1.1rem", lineHeight: "1.7", marginBottom: "25px" }}>
              {sit.story}
            </div>

            {/* Biểu đồ biểu quyết */}
            <div style={{ margin: "25px 0" }}>
              <h3 style={{ fontSize: "1rem", color: "var(--neon-blue)", textTransform: "uppercase", marginBottom: "15px" }}>
                Kết quả biểu quyết cả lớp: ({stats.total}/{totalPlayers} đã bầu)
              </h3>

              {/* Option A */}
              <div style={{ marginBottom: "15px" }}>
                <div style={{ fontWeight: "bold", marginBottom: "5px" }}>A. {sit.optionA.label}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ flex: 1, height: "28px", background: "rgba(0,0,0,0.3)", borderRadius: "14px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${stats.aPercent}%`, background: "var(--neon-blue)", transition: "width 0.8s", borderRadius: "14px" }} />
                  </div>
                  <span style={{ width: "85px", textAlign: "right", fontWeight: "bold" }}>{stats.aCount} ({stats.aPercent}%)</span>
                </div>
              </div>

              {/* Option B */}
              <div>
                <div style={{ fontWeight: "bold", marginBottom: "5px" }}>B. {sit.optionB.label}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ flex: 1, height: "28px", background: "rgba(0,0,0,0.3)", borderRadius: "14px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${stats.bPercent}%`, background: "var(--neon-green)", transition: "width 0.8s", borderRadius: "14px" }} />
                  </div>
                  <span style={{ width: "85px", textAlign: "right", fontWeight: "bold" }}>{stats.bCount} ({stats.bPercent}%)</span>
                </div>
              </div>
            </div>

            {/* Hệ quả */}
            <div className="explanation-section">
              <div className="explanation-title">📌 Hệ quả lựa chọn A:</div>
              <p className="explanation-text">{sit.optionA.consequence}</p>
              <div className="explanation-title" style={{ marginTop: "15px" }}>📌 Hệ quả lựa chọn B:</div>
              <p className="explanation-text">{sit.optionB.consequence}</p>

              <div className="marx-section">
                <div className="marx-title">☭ Luận điểm Kinh tế chính trị Mác - Lênin:</div>
                <p className="marx-text">"{sit.marxLenin}"</p>
              </div>
            </div>

            <Leaderboard max={5} title="BẢNG XẾP HẠNG TẠM THỜI" />

            <button className="btn-cyber btn-cyber-blue" style={{ width: "100%", marginTop: "25px", padding: "16px", fontSize: "1.1rem" }} onClick={() => handleStartPhase(nextPhase)}>
              {PHASE_CONFIGS[nextPhase].emoji} Bắt đầu Phase {nextPhase.replace("phase_", "")}: {PHASE_CONFIGS[nextPhase].name} ➔
            </button>
          </div>
        );
      })()}

      {/* ===== FINISHED ===== */}
      {gameState.status === "finished" && (() => {
        const sorted = [...playerList].sort((a, b) => b.score - a.score);
        return (
          <div style={{ textAlign: "center" }}>
            <h2 className="minigame-title">🏆 CHIẾN THẮNG CHUNG CUỘC</h2>
            <p className="minigame-subtitle">Vinh danh những nhà sinh tồn xuất sắc nhất trên Sàn Số</p>

            {sorted.length > 0 && (
              <div className="podium-container">
                {sorted[1] && (
                  <div className="podium-step silver">
                    <div className="podium-crown" style={{ animationDelay: "0.5s" }}>🥈</div>
                    <div className="podium-name">{sorted[1].name}</div>
                    <div className="podium-score">{sorted[1].score}đ</div>
                    <div className="podium-number">2</div>
                  </div>
                )}
                {sorted[0] && (
                  <div className="podium-step gold">
                    <div className="podium-crown">👑</div>
                    <div className="podium-name" style={{ fontWeight: "bold" }}>{sorted[0].name}</div>
                    <div className="podium-score" style={{ fontWeight: "bold" }}>{sorted[0].score}đ</div>
                    <div className="podium-number">1</div>
                  </div>
                )}
                {sorted[2] && (
                  <div className="podium-step bronze">
                    <div className="podium-crown" style={{ animationDelay: "1s" }}>🥉</div>
                    <div className="podium-name">{sorted[2].name}</div>
                    <div className="podium-score">{sorted[2].score}đ</div>
                    <div className="podium-number">3</div>
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: "30px", textAlign: "left" }}>
              <Leaderboard max={10} title="BẢNG XẾP HẠNG CHI TIẾT (TOP 10)" />
            </div>

            <div style={{ background: "rgba(255,183,0,0.1)", border: "1px solid rgba(255,183,0,0.3)", borderRadius: "12px", padding: "20px", marginTop: "30px", textAlign: "left" }}>
              <div style={{ fontWeight: "bold", color: "var(--neon-gold)", marginBottom: "10px", fontSize: "1.1rem" }}>💡 Bài học tổng kết:</div>
              <p style={{ color: "#e1dbd6", lineHeight: "1.7" }}>
                Các bạn vừa trải nghiệm quy luật vận động khách quan: <b>Cạnh tranh tự do → Tích tụ tư bản → Độc quyền → Bóc lột</b>.
                Đây không chỉ là game — đây là thực tế mà hàng triệu người bán nhỏ lẻ trên Shopee, Grab đang phải đối mặt mỗi ngày.
                Nhận thức đúng quy luật để hành động khôn ngoan: tận dụng hệ sinh thái ông lớn nhưng luôn xây kênh riêng, nhắm thị trường ngách, tự chủ dữ liệu khách hàng.
              </p>
            </div>

            <div style={{ display: "flex", gap: "20px", marginTop: "30px" }}>
              <button className="btn-cyber" style={{ flex: 1 }} onClick={() => handleStartPhase("phase_1")}>Chơi lại</button>
              <button className="btn-cyber btn-cyber-blue" style={{ flex: 1 }} onClick={handleResetGame}>Về phòng chờ</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default HostView;
