import React, { useState, useEffect, useRef } from "react";
import { ref, set, onValue, remove, update, get, runTransaction } from "firebase/database";
import { db } from "./firebaseConfig";
import { situations, PHASE_CONFIGS } from "./situations";
import { applyPlayerDelta } from "./gameStateUtils";
import {
  IconPhone,
  IconDesktop,
  IconLeaf,
  IconWarning,
  IconFlame,
  IconBook,
  IconBolt,
  IconSkull,
  IconTrophy,
  IconCrown,
  IconTimer,
  IconBulb,
  IconMarxTheory,
  IconUser,
  IconCheck,
  IconPin,
  IconArrowRight,
  IconRefresh
} from "./icons";

// Helper lấy Icon Phase tương ứng
const getPhaseIcon = (status, className = "w-5 h-5") => {
  if (status === "phase_1") return <IconLeaf className={`${className} text-emerald-500`} />;
  if (status === "phase_2") return <IconWarning className={`${className} text-amber-500`} />;
  if (status === "phase_3") return <IconFlame className={`${className} text-red-500`} />;
  return null;
};


const HostView = ({ gameState, dbConnected, onResetRole }) => {
  const [players, setPlayers] = useState({});
  const [votes, setVotes] = useState({});
  const [qrUrl, setQrUrl] = useState("");

  // RPG Host logic
  const iframeRef = useRef(null);
  const platformFeeTimer = useRef(null);
  const platformFeeInFlight = useRef(false);

  // QR
  useEffect(() => {
    const url = window.location.origin + window.location.pathname + "#minigame";
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=c5272d&data=${encodeURIComponent(url)}`);
  }, []);

  // Lắng nghe players
  useEffect(() => {
    const unsubPlayers = onValue(ref(db, "players"), (s) => {
      setPlayers(s.val() || {});
    });
    return () => unsubPlayers();
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

  const playerList = Object.entries(players).map(([id, info]) => ({ id, ...info }));
  const totalPlayers = playerList.length;
  const currentConfig = PHASE_CONFIGS[gameState.status];

  // ===== ACTIONS =====

  const handleStartPhase = async (phaseKey) => {
    const config = PHASE_CONFIGS[phaseKey];
    const updates = {};

    if (phaseKey === "phase_1") {
      playerList.forEach((p) => {
        updates[`players/${p.id}/score`] = 0;
        updates[`players/${p.id}/capital`] = 20000000;
        updates[`players/${p.id}/streak`] = 0;
        updates[`players/${p.id}/isBankrupt`] = false;
      });
      await remove(ref(db, "votes"));
    }

    updates["gameState"] = {
      status: phaseKey,
      phaseStartedAt: Date.now(),
      bookReward: config.bookReward,
      trapPenalty: config.trapPenalty,
    };

    await update(ref(db), updates);
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
    await remove(ref(db, "players"));
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
      <h3 className="leaderboard-title" style={{ fontSize: "1rem", color: "var(--neon-gold)", letterSpacing: "0.5px" }}>{title}</h3>
      <div className="leaderboard-list">
        {playerList
          .sort((a, b) => b.score - a.score)
          .slice(0, max)
          .map((p, idx) => (
            <div className="leaderboard-item" key={p.id} style={{ fontVariantNumeric: "tabular-nums" }}>
              <div className="player-info">
                <span className="player-rank">{idx + 1}</span>
                <span className="player-name-txt" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {p.name} {p.isBankrupt && <IconSkull className="w-4.5 h-4.5 text-red-500 inline-block" />}
                </span>
              </div>
              <div style={{ display: "flex", gap: "12px", fontSize: "0.85rem" }}>
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
    <div className="minigame-panel" style={{ maxWidth: "1450px", width: "95%" }}>
      {/* Header MC */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <IconDesktop className="w-5 h-5 text-red-500" />
          <span style={{ fontWeight: 800, color: "var(--neon-red)", letterSpacing: "1px", textTransform: "uppercase", fontSize: "0.95rem" }}>
            Bảng điều khiển MC
          </span>
          {currentConfig && (
            <span style={{ fontSize: "0.85rem", color: "var(--neon-gold)", marginLeft: "10px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              {getPhaseIcon(gameState.status)} {currentConfig.name}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn-cyber" style={{ padding: "6px 14px", fontSize: "0.75rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "9999px" }} onClick={onResetRole}>
            <IconRefresh className="w-3.5 h-3.5 mr-1 inline-block" /> Đổi vai
          </button>
          <button className="btn-cyber" style={{ padding: "6px 14px", fontSize: "0.75rem", background: "rgba(197, 39, 45, 0.1)", border: "1px solid rgba(197, 39, 45, 0.2)", borderRadius: "9999px", color: "var(--neon-red)" }} onClick={handleResetGame}>
            Reset
          </button>
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
              <div style={{ fontSize: "1rem", marginBottom: "12px", color: "var(--neon-gold)", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px" }}>
                <IconPhone className="w-5 h-5 text-cyan-400" /> LUẬT CHƠI:
              </div>
              <ol style={{ paddingLeft: "20px", color: "#8b8680", lineHeight: "1.7" }}>
                <li>Di chuyển nhân vật bằng <b>WASD/mũi tên</b> (PC) hoặc <b>D-pad</b> (Mobile)</li>
                <li style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  Thu thập <b>cơ hội kinh doanh <IconBook className="w-4 h-4 text-amber-500 inline" /></b>: đơn hàng, review, khách quen, kỹ năng AI
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  Né tránh <b>rủi ro nền tảng <IconBolt className="w-4 h-4 text-red-500 inline" /></b>: phí sàn, bóp tương tác, voucher bắt buộc, Mall sao chép
                </li>
                <li>Phase 2 và 3 <b>khó hơn có chủ đích</b>: đó là cảm giác thị trường chuyển sang độc quyền</li>
              </ol>
              <div className="player-count" style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                Đã tham gia: <span style={{ fontFamily: "var(--font-mono)", fontWeight: "bold" }}>{totalPlayers}</span> người chơi
                <div className="loading-dots"><span></span><span></span><span></span></div>
              </div>
              <button
                className="btn-cyber btn-cyber-blue"
                style={{ width: "100%", marginTop: "20px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                onClick={() => handleStartPhase("phase_1")}
                disabled={totalPlayers === 0}
              >
                <IconLeaf className="w-5 h-5" /> Bắt đầu Phase 1: Thị Trường Tự Do
              </button>
            </div>
          </div>

          {totalPlayers > 0 && (
            <div className="player-grid">
              {playerList.map((p) => (
                <div className="player-pill" key={p.id} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <IconUser className="w-4 h-4 text-slate-400" /> {p.name}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== RPG PHASE (1/2/3) ===== */}
      {isRpgPhase && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--neon-gold)", margin: 0, display: "inline-flex", alignItems: "center", gap: "6px" }}>
              {getPhaseIcon(gameState.status)} PHASE {gameState.status.replace("phase_", "")}: {currentConfig.name}
            </h2>
            <span style={{ color: "#8b8680", fontSize: "0.85rem" }}>{totalPlayers} người chơi</span>
          </div>


          {/* MC narration */}
          <div style={{ background: "rgba(255,183,0,0.03)", border: "1px solid rgba(255,183,0,0.15)", borderRadius: "12px", padding: "12px 18px", marginBottom: "15px", fontSize: "0.95rem", color: "var(--neon-gold)", fontStyle: "italic", display: "flex", alignItems: "center", gap: "8px" }}>
            <IconBulb className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <span>MC: "{currentConfig.mcNarration}"</span>
          </div>

          {/* Thông tin phase */}
          {currentConfig.platformFeeInterval > 0 && (
            <div style={{ background: "rgba(197,39,45,0.08)", border: "1px solid rgba(197,39,45,0.2)", borderRadius: "8px", padding: "8px 15px", marginBottom: "15px", fontSize: "0.85rem", color: "var(--neon-red)", display: "flex", alignItems: "center", gap: "6px" }}>
              <IconSkull className="w-4 h-4 flex-shrink-0" />
              <span>PHÍ SÀN: Tự động trừ <b style={{ fontFamily: "var(--font-mono)" }}>{currentConfig.platformFeeAmount.toLocaleString()}đ</b> vốn mỗi <b style={{ fontFamily: "var(--font-mono)" }}>{currentConfig.platformFeeInterval / 1000}s</b></span>
            </div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center" }}>
            {/* RPG Spectator */}
            <div style={{ flex: "2", minWidth: "350px", maxWidth: "1000px", width: "100%" }}>
              <div style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", overflow: "hidden", background: "#000", boxShadow: "0 12px 30px rgba(0,0,0,0.4)" }}>
                <iframe
                  ref={iframeRef}
                  src="/rpg/index.html?role=host"
                  style={{ width: "100%", aspectRatio: "16/9", border: "none", display: "block" }}
                  title="RPG Spectator"
                />
              </div>
              <div style={{ marginTop: "8px", color: "#8b8680", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px" }}>
                <IconBulb className="w-4 h-4 text-yellow-500" /> Kéo chuột hoặc phím mũi tên để quan sát bản đồ
              </div>
            </div>

            {/* Leaderboard + Controls */}
            <div style={{ flex: "1", minWidth: "260px", maxWidth: "350px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "20px", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)" }}>
              <Leaderboard />

              <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {gameState.status === "phase_1" && (
                  <button className="btn-cyber" style={{ width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }} onClick={() => handleTriggerSituation(1)}>
                    <IconBolt className="w-4 h-4 text-yellow-500" /> Kích hoạt Tình huống 1
                  </button>
                )}
                {gameState.status === "phase_2" && (
                  <button className="btn-cyber" style={{ width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }} onClick={() => handleTriggerSituation(2)}>
                    <IconBolt className="w-4 h-4 text-yellow-500" /> Kích hoạt Tình huống 2
                  </button>
                )}
                {gameState.status === "phase_3" && (
                  <button className="btn-cyber btn-cyber-blue" style={{ width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }} onClick={handleFinishGame}>
                    <IconTrophy className="w-4 h-4 text-yellow-500" /> Kết thúc & Vinh danh
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
            <h2 style={{ color: "var(--neon-red)", fontSize: "1.4rem", fontWeight: "bold", textAlign: "center", marginBottom: "5px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <IconBolt className="w-5 h-5 text-red-500 animate-pulse" /> TÌNH HUỐNG {sitIdx + 1}: {sit.title.toUpperCase()}
            </h2>

            <div className="situation-box" style={{ fontSize: "1.15rem", lineHeight: "1.7", marginBottom: "25px" }}>
              {sit.story}
            </div>

            {/* Biểu đồ biểu quyết */}
            <div style={{ margin: "25px 0" }}>
              <h3 style={{ fontSize: "1rem", color: "var(--neon-blue)", textTransform: "uppercase", marginBottom: "15px", display: "flex", alignItems: "center", gap: "6px" }}>
                <IconUser className="w-4 h-4 text-cyan-400" /> Kết quả biểu quyết cả lớp: ({stats.total}/{totalPlayers} đã bầu)
              </h3>

              {/* Option A */}
              <div style={{ marginBottom: "15px" }}>
                <div style={{ fontWeight: "bold", marginBottom: "5px" }}>A. {sit.optionA.label}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ flex: 1, height: "28px", background: "rgba(0,0,0,0.3)", borderRadius: "14px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${stats.aPercent}%`, background: "var(--neon-blue)", transition: "width 0.8s", borderRadius: "14px" }} />
                  </div>
                  <span style={{ width: "85px", textAlign: "right", fontWeight: "bold", fontFamily: "var(--font-mono)" }}>{stats.aCount} ({stats.aPercent}%)</span>
                </div>
              </div>

              {/* Option B */}
              <div>
                <div style={{ fontWeight: "bold", marginBottom: "5px" }}>B. {sit.optionB.label}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ flex: 1, height: "28px", background: "rgba(0,0,0,0.3)", borderRadius: "14px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${stats.bPercent}%`, background: "var(--neon-green)", transition: "width 0.8s", borderRadius: "14px" }} />
                  </div>
                  <span style={{ width: "85px", textAlign: "right", fontWeight: "bold", fontFamily: "var(--font-mono)" }}>{stats.bCount} ({stats.bPercent}%)</span>
                </div>
              </div>
            </div>

            {/* Hệ quả */}
            <div className="explanation-section">
              <div className="explanation-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <IconPin className="w-4 h-4 text-yellow-500" /> Hệ quả lựa chọn A:
              </div>
              <p className="explanation-text">{sit.optionA.consequence}</p>
              <div className="explanation-title" style={{ marginTop: "15px", display: "flex", alignItems: "center", gap: "6px" }}>
                <IconPin className="w-4 h-4 text-yellow-500" /> Hệ quả lựa chọn B:
              </div>
              <p className="explanation-text">{sit.optionB.consequence}</p>

              <div className="marx-section">
                <div className="marx-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <IconMarxTheory className="w-4 h-4 text-red-500" /> Luận điểm Kinh tế chính trị Mác - Lênin:
                </div>
                <p className="marx-text">"{sit.marxLenin}"</p>
              </div>
            </div>

            <Leaderboard max={5} title="BẢNG XẾP HẠNG TẠM THỜI" />

            <button className="btn-cyber btn-cyber-blue" style={{ width: "100%", marginTop: "25px", padding: "16px", fontSize: "1.1rem", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }} onClick={() => handleStartPhase(nextPhase)}>
              {getPhaseIcon(nextPhase, "w-5 h-5")} Bắt đầu Phase {nextPhase.replace("phase_", "")}: {PHASE_CONFIGS[nextPhase].name} <IconArrowRight className="w-4 h-4" />
            </button>
          </div>
        );
      })()}

      {/* ===== FINISHED ===== */}
      {gameState.status === "finished" && (() => {
        const sorted = [...playerList].sort((a, b) => b.score - a.score);
        return (
          <div style={{ textAlign: "center" }}>
            <h2 className="minigame-title" style={{ display: "inline-flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
              <IconTrophy className="w-10 h-10 text-yellow-500 animate-bounce" /> CHIẾN THẮNG CHUNG CUỘC
            </h2>
            <p className="minigame-subtitle">Vinh danh những nhà sinh tồn xuất sắc nhất trên Sàn Số</p>

            {sorted.length > 0 && (
              <div className="podium-container">
                {sorted[1] && (
                  <div className="podium-step silver">
                    <div className="podium-crown" style={{ animationDelay: "0.5s", top: "-30px" }}>
                      <IconTrophy className="w-8 h-8 text-slate-300" />
                    </div>
                    <div className="podium-name">{sorted[1].name}</div>
                    <div className="podium-score" style={{ fontFamily: "var(--font-mono)" }}>{sorted[1].score}đ</div>
                    <div className="podium-number">2</div>
                  </div>
                )}
                {sorted[0] && (
                  <div className="podium-step gold">
                    <div className="podium-crown" style={{ top: "-35px" }}>
                      <IconCrown className="w-10 h-10 text-yellow-500" />
                    </div>
                    <div className="podium-name" style={{ fontWeight: "bold" }}>{sorted[0].name}</div>
                    <div className="podium-score" style={{ fontWeight: "bold", fontFamily: "var(--font-mono)" }}>{sorted[0].score}đ</div>
                    <div className="podium-number">1</div>
                  </div>
                )}
                {sorted[2] && (
                  <div className="podium-step bronze">
                    <div className="podium-crown" style={{ animationDelay: "1s", top: "-30px" }}>
                      <IconTrophy className="w-8 h-8 text-amber-700" />
                    </div>
                    <div className="podium-name">{sorted[2].name}</div>
                    <div className="podium-score" style={{ fontFamily: "var(--font-mono)" }}>{sorted[2].score}đ</div>
                    <div className="podium-number">3</div>
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: "30px", textAlign: "left" }}>
              <Leaderboard max={10} title="BẢNG XẾP HẠNG CHI TIẾT (TOP 10)" />
            </div>

            <div style={{ background: "rgba(255,183,0,0.04)", border: "1px solid rgba(255,183,0,0.15)", borderRadius: "16px", padding: "24px", marginTop: "30px", textAlign: "left", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)" }}>
              <div style={{ fontWeight: "bold", color: "var(--neon-gold)", marginBottom: "10px", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "6px" }}>
                <IconBulb className="w-5 h-5 text-yellow-500" /> Bài học tổng kết:
              </div>
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
