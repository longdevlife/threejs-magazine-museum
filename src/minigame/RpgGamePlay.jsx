import React, { useEffect, useRef, useState } from "react";
import { ref, remove, runTransaction } from "firebase/database";
import { db } from "./firebaseConfig";
import { PHASE_CONFIGS } from "./situations";
import { applyPlayerDelta } from "./gameStateUtils";
import { getCharacterOption } from "./characterOptions";

const RpgGamePlay = ({ playerId, playerName, playerInfo, dbConnected, gameState }) => {
  const iframeRef = useRef(null);
  const selectedCharacter = getCharacterOption(playerInfo.character);

  // Trạng thái đóng băng
  const [isFrozen, setIsFrozen] = useState(false);
  const [freezeTime, setFreezeTime] = useState(0);

  // Floating text
  const [floatingTexts, setFloatingTexts] = useState([]);

  // Lấy config phase hiện tại
  const phaseConfig = PHASE_CONFIGS[gameState.status] || PHASE_CONFIGS.phase_1;

  const addFloatingText = (text, color) => {
    const id = Date.now() + Math.random();
    setFloatingTexts((prev) => [...prev, { id, text, color }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((t) => t.id !== id));
    }, 1500);
  };

  // 1. Lắng nghe postMessage từ Phaser
  useEffect(() => {
    const applyScoreCapitalDelta = (delta) =>
      runTransaction(
        ref(db, `players/${playerId}`),
        (player) => applyPlayerDelta(player, delta),
        { applyLocally: false }
      );

    const claimBook = async (bookId) => {
      if (!bookId) return false;

      const result = await runTransaction(
        ref(db, `books/${bookId}`),
        (book) => {
          if (!book || book.claimedBy) return book;
          return { ...book, claimedBy: playerId, claimedAt: Date.now() };
        },
        { applyLocally: false }
      );

      const claimedBook = result.snapshot.val();
      const didClaim = claimedBook?.claimedBy === playerId;
      if (didClaim) {
        await remove(ref(db, `books/${bookId}`));
      }
      return didClaim;
    };

    const handleMessage = async (e) => {
      if (!e.data) return;

      // A. Nhặt sách tri thức → Bonus theo phase config
      if (e.data.type === "NHAT_SACH") {
        const didClaim = await claimBook(e.data.bookId);
        if (!didClaim) return;

        const { score: bonusScore, capital: bonusCapital } = phaseConfig.bookReward;
        await applyScoreCapitalDelta({ score: bonusScore, capital: bonusCapital });

        addFloatingText(`+${bonusScore}đ 📖`, "#4caf50");
      }

      // B. Va chạm bẫy → Phạt theo phase config
      if (e.data.type === "DINH_BAY") {
        setIsFrozen(true);
        setFreezeTime(3);
        iframeRef.current?.contentWindow?.postMessage({ type: "FREEZE" }, "*");

        const { score: penScore, capital: penCapital } = phaseConfig.trapPenalty;
        await applyScoreCapitalDelta({ score: penScore, capital: penCapital });

        addFloatingText(`${penScore}đ ⚡`, "#ff3344");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [playerId, phaseConfig]);

  // 2. Bộ đếm ngược đóng băng
  useEffect(() => {
    let timer;
    if (isFrozen && freezeTime > 0) {
      timer = setInterval(() => {
        setFreezeTime((prev) => {
          if (prev <= 1) {
            setIsFrozen(false);
            iframeRef.current?.contentWindow?.postMessage({ type: "UNFREEZE" }, "*");
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isFrozen, freezeTime]);

  // 3. Hiện thông báo phí sàn khi bị trừ tự động (qua Firebase onValue)
  const lastCapitalRef = useRef(playerInfo.capital);
  useEffect(() => {
    // Detect phí sàn bị trừ (capital giảm mà không phải do bẫy/sách)
    if (phaseConfig.platformFeeInterval > 0 && playerInfo.capital < lastCapitalRef.current && !isFrozen) {
      const diff = lastCapitalRef.current - playerInfo.capital;
      // Chỉ hiện nếu đúng mức phí sàn (±20% tolerance)
      if (Math.abs(diff - phaseConfig.platformFeeAmount) < phaseConfig.platformFeeAmount * 0.3) {
        addFloatingText(`-${(phaseConfig.platformFeeAmount / 1000000).toFixed(0)}tr 💀 Phí sàn`, "#ff6b35");
      }
    }
    lastCapitalRef.current = playerInfo.capital;
  }, [playerInfo.capital]);

  // 4. D-pad
  const handleDpadPress = (dir) => {
    if (isFrozen) return;
    iframeRef.current?.contentWindow?.postMessage({ type: "DPAD_MOVE", dir }, "*");
  };
  const handleDpadRelease = () => {
    iframeRef.current?.contentWindow?.postMessage({ type: "DPAD_MOVE", dir: "stop" }, "*");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: "1000px", margin: "0 auto" }}>

      {/* Phase indicator + HUD */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "#fcf3e3", border: "3px solid #a16b47", borderRadius: "12px", padding: "8px 15px", marginBottom: "10px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", color: "#333" }}>
        {/* Phase badge */}
        <div style={{ textAlign: "center", minWidth: "80px" }}>
          <div style={{ fontSize: "8px", color: "#795548", fontWeight: "bold", textTransform: "uppercase" }}>Phase</div>
          <div style={{ fontSize: "13px", fontWeight: "bold", color: "#a16b47" }}>
            {phaseConfig.emoji} {phaseConfig.name.split(" ").slice(0, 2).join(" ")}
          </div>
        </div>
        <div style={{ width: "2px", background: "#a16b47", margin: "0 8px", height: "30px" }} />

        {/* Vốn */}
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: "8px", color: "#795548", fontWeight: "bold" }}>VỐN</div>
          <div style={{ fontSize: "14px", fontWeight: "bold", color: playerInfo.isBankrupt ? "#d32f2f" : "#388e3c" }}>
            {playerInfo.isBankrupt ? "💀 PHÁ SẢN" : `${(playerInfo.capital || 0).toLocaleString()}đ`}
          </div>
        </div>
        <div style={{ width: "2px", background: "#a16b47", margin: "0 8px", height: "30px" }} />

        {/* Điểm */}
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: "8px", color: "#795548", fontWeight: "bold" }}>ĐIỂM</div>
          <div style={{ fontSize: "14px", fontWeight: "bold", color: "#1976d2" }}>{playerInfo.score || 0}đ</div>
        </div>
        <div style={{ width: "2px", background: "#a16b47", margin: "0 8px", height: "30px" }} />

        {/* Nhân vật */}
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: "8px", color: "#795548", fontWeight: "bold" }}>NHÂN VẬT</div>
          <div style={{ fontSize: "14px", fontWeight: "bold", color: selectedCharacter.color }}>
            {selectedCharacter.icon} {selectedCharacter.label}
          </div>
        </div>
      </div>

      {/* Thông báo phí sàn */}
      {phaseConfig.platformFeeInterval > 0 && (
        <div style={{ width: "100%", background: "rgba(255,51,68,0.15)", border: "1px solid rgba(255,51,68,0.3)", borderRadius: "8px", padding: "6px 12px", marginBottom: "8px", fontSize: "0.75rem", color: "#ff6b35", textAlign: "center" }}>
          💀 Phí sàn: -{(phaseConfig.platformFeeAmount / 1000000).toFixed(0)} triệu mỗi {phaseConfig.platformFeeInterval / 1000}s
        </div>
      )}

      {/* Game console */}
      <div className="game-console-wrapper" style={{ width: "100%", background: "#a16b47", border: "5px solid #5c3d28", borderRadius: "24px", padding: "12px", boxShadow: "0 20px 40px rgba(0,0,0,0.5), inset 0 0 10px rgba(0,0,0,0.6)" }}>

        {/* LED */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0 10px 8px" }}>
          <div style={{ display: "flex", gap: "6px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: dbConnected ? "#4caf50" : "#f44336", boxShadow: dbConnected ? "0 0 8px #4caf50" : "0 0 8px #f44336" }} />
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: isFrozen ? "#00bcd4" : "rgba(255,255,255,0.2)" }} />
          </div>
          <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", letterSpacing: "1.5px", fontWeight: "bold" }}>
            {phaseConfig.emoji} {phaseConfig.name.toUpperCase()}
          </span>
        </div>

        {/* Iframe Phaser RPG */}
        <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", border: "4px solid #333", borderRadius: "8px", overflow: "hidden", background: "#000" }}>
          <iframe
            ref={iframeRef}
            src={`/rpg/index.html?role=player&id=${playerId}&name=${encodeURIComponent(playerName)}&character=${encodeURIComponent(selectedCharacter.id)}&color=${encodeURIComponent(selectedCharacter.color)}`}
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            title="Phaser RPG"
          />

          {/* Overlay đóng băng */}
          {isFrozen && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0, 188, 212, 0.2)", backdropFilter: "blur(4px)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", pointerEvents: "all" }}>
              <span style={{ fontSize: "3.5rem" }}>🧊</span>
              <h3 style={{ color: "#fff", fontWeight: "bold", fontSize: "1.4rem", textShadow: "0 2px 4px rgba(0,0,0,0.5)", marginTop: "10px" }}>BẪY SÉT!</h3>
              <p style={{ color: "#fff", fontSize: "0.9rem" }}>Đóng băng: {freezeTime}s</p>
            </div>
          )}

          {/* Floating text */}
          {floatingTexts.map((ft) => (
            <div
              key={ft.id}
              style={{
                position: "absolute", top: "40%", left: "50%", transform: "translateX(-50%)",
                fontSize: "1.6rem", fontWeight: "bold", color: ft.color,
                textShadow: "0 2px 8px rgba(0,0,0,0.7)", animation: "floatUp 1.5s ease-out forwards",
                pointerEvents: "none", zIndex: 10,
              }}
            >
              {ft.text}
            </div>
          ))}
        </div>
      </div>

      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", marginTop: "8px", textAlign: "center" }}>
        WASD / Mũi tên (PC) • D-pad (Mobile) • 📖 Nhặt sách = +{phaseConfig.bookReward.score}đ • ⚡ Né bẫy!
      </div>

      {/* D-pad */}
      <div className="dpad-container" style={{ userSelect: "none" }}>
        <button className="dpad-btn" onMouseDown={() => handleDpadPress("up")} onMouseUp={handleDpadRelease} onTouchStart={() => handleDpadPress("up")} onTouchEnd={handleDpadRelease}>▲</button>
        <div style={{ display: "flex", gap: "25px" }}>
          <button className="dpad-btn" onMouseDown={() => handleDpadPress("left")} onMouseUp={handleDpadRelease} onTouchStart={() => handleDpadPress("left")} onTouchEnd={handleDpadRelease}>◀</button>
          <button className="dpad-btn" onMouseDown={() => handleDpadPress("right")} onMouseUp={handleDpadRelease} onTouchStart={() => handleDpadPress("right")} onTouchEnd={handleDpadRelease}>▶</button>
        </div>
        <button className="dpad-btn" onMouseDown={() => handleDpadPress("down")} onMouseUp={handleDpadRelease} onTouchStart={() => handleDpadPress("down")} onTouchEnd={handleDpadRelease}>▼</button>
      </div>
    </div>
  );
};

export default RpgGamePlay;
