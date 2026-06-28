import React, { useState, useEffect, useRef } from "react";
import { ref, set, update, onValue, get } from "firebase/database";
import { db } from "./firebaseConfig";
import { situations, PHASE_CONFIGS } from "./situations";
import RpgGamePlay from "./RpgGamePlay";
import { CHARACTER_OPTIONS, getCharacterOption } from "./characterOptions";
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
  IconUser,
  IconCheck,
  IconPin,
  IconArrowRight,
  IconRefresh
} from "./icons";


const PlayerView = ({ playerId, playerName, setPlayerName, gameState, dbConnected, onResetRole }) => {
  const [tempName, setTempName] = useState(playerName);
  const [selectedCharacterId, setSelectedCharacterId] = useState(() => {
    return localStorage.getItem("minigame_character_id") || "default";
  });
  const [isJoined, setIsJoined] = useState(false);
  const [playerInfo, setPlayerInfo] = useState({
    score: 0, capital: 20000000, streak: 0, isBankrupt: false,
  });
  const [players, setPlayers] = useState({});

  // Situation vote state
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedVote, setSelectedVote] = useState(null);

  // Lắng nghe players
  useEffect(() => {
    const unsubscribe = onValue(ref(db, "players"), (snapshot) => {
      const data = snapshot.val() || {};
      setPlayers(data);
      if (data[playerId]) {
        setPlayerInfo(data[playerId]);
        setIsJoined(true);
      } else {
        setIsJoined(false);
      }
    });
    return () => unsubscribe();
  }, [playerId]);

  // Reset vote khi chuyển situation
  useEffect(() => {
    if (gameState.status === "situation_1" || gameState.status === "situation_2") {
      setHasVoted(false);
      setSelectedVote(null);
      // Check nếu đã vote trước đó (reload page)
      const sitNum = gameState.status === "situation_1" ? 1 : 2;
      get(ref(db, `votes/situation_${sitNum}/${playerId}`)).then((snap) => {
        if (snap.val()) {
          setHasVoted(true);
          setSelectedVote(snap.val().choice);
        }
      });
    }
  }, [gameState.status]);

  // Đăng ký tham gia
  const handleJoinGame = async (e) => {
    e.preventDefault();
    if (!tempName.trim()) return;
    const cleanName = tempName.trim().substring(0, 15);
    const selectedCharacter = getCharacterOption(selectedCharacterId);
    setPlayerName(cleanName);
    localStorage.setItem("minigame_player_name", cleanName);
    localStorage.setItem("minigame_character_id", selectedCharacter.id);
    await set(ref(db, `players/${playerId}`), {
      name: cleanName,
      character: selectedCharacter.id,
      color: selectedCharacter.color,
      score: 0,
      capital: 20000000,
      streak: 0,
      isBankrupt: false,
      joinedAt: Date.now(),
    });
    setIsJoined(true);
  };

  // Vote cho tình huống
  const handleVote = async (choice) => {
    if (hasVoted) return;
    setSelectedVote(choice);
    setHasVoted(true);
    const sitNum = gameState.status === "situation_1" ? 1 : 2;
    await set(ref(db, `votes/situation_${sitNum}/${playerId}`), {
      choice, votedAt: Date.now(),
    });
  };

  // Xếp hạng
  const getPlayerRank = () => {
    const sorted = Object.entries(players)
      .map(([id, info]) => ({ id, ...info }))
      .sort((a, b) => b.score - a.score);
    const rank = sorted.findIndex((p) => p.id === playerId);
    return rank !== -1 ? rank + 1 : "-";
  };

  const totalPlayersCount = Object.keys(players).length;
  const isRpgPhase = ["phase_1", "phase_2", "phase_3"].includes(gameState.status);
  const isSituation = gameState.status === "situation_1" || gameState.status === "situation_2";
  const currentConfig = PHASE_CONFIGS[gameState.status];
  const currentCharacter = getCharacterOption(playerInfo.character);

  // ===== 1. CHƯA ĐĂNG KÝ =====
  if (!isJoined) {
    return (
      <div className="minigame-panel" style={{ maxWidth: "450px" }}>
        <h2 className="minigame-title" style={{ fontSize: "1.8rem" }}>THAM GIA CHƠI</h2>
        <p className="minigame-subtitle" style={{ fontSize: "1rem", marginBottom: "25px" }}>Mở shop nhỏ, săn cơ hội kinh doanh và sống sót trước sức ép nền tảng</p>
        <form onSubmit={handleJoinGame} className="join-form">
          <div className="input-group">
            <label className="input-label">Nhập tên / Biệt danh:</label>
            <input type="text" className="game-input" value={tempName} onChange={(e) => setTempName(e.target.value)} placeholder="Ví dụ: Anh Tuấn FPT" maxLength={15} required />
          </div>
          <div className="input-group" style={{ marginTop: "20px" }}>
            <label className="input-label">Chọn nhân vật đại diện:</label>
            <div className="character-grid">
              {CHARACTER_OPTIONS.map((char) => {
                const isSelected = selectedCharacterId === char.id;
                return (
                  <div
                    key={char.id}
                    className={`character-option ${isSelected ? "selected" : ""}`}
                    style={{ "--character-color": char.color }}
                    onClick={() => setSelectedCharacterId(char.id)}
                  >
                    <div className={`pixel-character ${char.spriteClass}`}>
                      <span className="pixel-hat"></span>
                      <span className="pixel-hair"></span>
                      <span className="pixel-head"></span>
                      <span className="pixel-body"></span>
                      <span className="pixel-arm pixel-arm-left"></span>
                      <span className="pixel-arm pixel-arm-right"></span>
                      <span className="pixel-leg pixel-leg-left"></span>
                      <span className="pixel-leg pixel-leg-right"></span>
                      <span className="pixel-pack"></span>
                      <span className="pixel-accessory"></span>
                    </div>
                    <div className="character-name">{char.label}</div>
                    <div className="character-desc">{char.description}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <button type="submit" className="btn-cyber btn-cyber-blue" style={{ marginTop: "20px", width: "100%" }}>Tham gia ngay</button>
        </form>
        <button onClick={onResetRole} style={{ background: "none", border: "none", color: "#8b8680", marginTop: "20px", textDecoration: "underline", cursor: "pointer", fontSize: "0.85rem" }}>Quay lại chọn vai trò</button>
      </div>
    );
  }

  // ===== 2. WAITING =====
  if (gameState.status === "waiting") {
    return (
      <div className="minigame-panel" style={{ maxWidth: "450px", textAlign: "center" }}>
        <div style={{ marginBottom: "20px", display: "flex", justifyContent: "center" }}>
          <IconPhone className="w-16 h-16 text-cyan-400 animate-bounce" />
        </div>
        <h2 className="minigame-title" style={{ fontSize: "1.8rem" }}>ĐÃ THAM GIA PHÒNG</h2>
        <p style={{ color: "var(--neon-gold)", fontWeight: "600", fontSize: "1.1rem", margin: "10px 0" }}>
          Xin chào, {playerName}!
        </p>
        <div className="selected-character-badge" style={{ "--character-color": currentCharacter.color }}>
          <span>Nhân vật: {currentCharacter.label}</span>
        </div>
        <p style={{ color: "#8b8680", fontSize: "0.95rem", lineHeight: "1.6" }}>
          Bạn đã đăng ký shop thành công. Nhìn lên màn hình máy chiếu — MC sẽ sớm bắt đầu!
        </p>
        <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "20px", margin: "30px 0", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)" }}>
          <div style={{ fontSize: "0.85rem", color: "var(--neon-blue)", textTransform: "uppercase", fontWeight: "bold", letterSpacing: "0.5px" }}>Tổng số người chơi:</div>
          <div style={{ fontSize: "2.2rem", fontWeight: "bold", margin: "5px 0", fontFamily: "var(--font-mono)", color: "#fff" }}>{totalPlayersCount}</div>
        </div>
        <div className="loading-dots"><span></span><span></span><span></span></div>
      </div>
    );
  }

  // ===== 3. RPG PHASE (1/2/3) — Chơi game RPG =====
  if (isRpgPhase) {
    return (
      <RpgGamePlay
        playerId={playerId}
        playerName={playerName}
        playerInfo={playerInfo}
        dbConnected={dbConnected}
        gameState={gameState}
      />
    );
  }

  // ===== 4. SITUATION (1/2) — RPG pause + popup biểu quyết A/B =====
  if (isSituation) {
    const sitIdx = gameState.status === "situation_1" ? 0 : 1;
    const sit = situations[sitIdx];

    return (
      <div className="minigame-panel" style={{ maxWidth: "550px" }}>
        <div style={{ textAlign: "center", marginBottom: "15px" }}>
          <IconBolt className="w-12 h-12 mx-auto text-red-500 animate-pulse" />
          <h2 style={{ color: "var(--neon-red)", fontSize: "1.3rem", fontWeight: "bold", margin: "8px 0" }}>
            TÌNH HUỐNG {sitIdx + 1}
          </h2>
          <p style={{ color: "var(--neon-gold)", fontSize: "0.9rem" }}>{sit.title}</p>
        </div>

        <div className="situation-box" style={{ fontSize: "1.05rem", lineHeight: "1.7" }}>
          {sit.story}
        </div>

        {!hasVoted ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "25px" }}>
            <button
              className="option-button"
              onClick={() => handleVote("A")}
              style={{ padding: "16px 20px", fontSize: "1rem", textAlign: "left", cursor: "pointer", border: "1px solid rgba(21, 101, 192, 0.3)" }}
            >
              <span className="option-prefix" style={{ color: "var(--neon-blue)" }}>A.</span> {sit.optionA.label}
            </button>
            <button
              className="option-button"
              onClick={() => handleVote("B")}
              style={{ padding: "16px 20px", fontSize: "1rem", textAlign: "left", cursor: "pointer", border: "1px solid rgba(46, 125, 50, 0.3)" }}
            >
              <span className="option-prefix" style={{ color: "var(--neon-green)" }}>B.</span> {sit.optionB.label}
            </button>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "30px 20px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", marginTop: "25px", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)" }}>
            <IconCheck className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
            <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: selectedVote === "A" ? "var(--neon-blue)" : "var(--neon-green)" }}>
              Bạn đã chọn: {selectedVote}
            </div>
            <p style={{ color: "#8b8680", fontSize: "0.85rem", marginTop: "10px" }}>
              Nhìn lên máy chiếu để xem kết quả biểu quyết của cả lớp...
            </p>
          </div>
        )}

        {/* Mini HUD */}
        <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", color: "#8b8680", fontSize: "0.85rem", padding: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", fontVariantNumeric: "tabular-nums" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><IconUser className="w-4 h-4 text-slate-400" /> {playerName}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><IconLeaf className="w-4 h-4 text-emerald-500" /> {playerInfo.capital?.toLocaleString()}đ</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><IconTrophy className="w-4 h-4 text-yellow-500" /> {playerInfo.score}đ</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><IconCrown className="w-4 h-4 text-amber-500" /> #{getPlayerRank()}</span>
        </div>
      </div>
    );
  }

  // ===== 5. FINISHED =====
  // ===== 5. FINISHED =====
  if (gameState.status === "finished") {
    const finalRank = getPlayerRank();
    let badgeText = "Doanh nghiệp phá sản";
    let badgeColor = "var(--neon-red)";
    let badgeIcon = <IconSkull className="w-4 h-4 mr-1 inline-block" />;

    if (finalRank === 1) { 
      badgeText = "Vua Sinh Tồn Sàn Số"; 
      badgeColor = "var(--neon-gold)"; 
      badgeIcon = <IconCrown className="w-4 h-4 mr-1 inline-block" />;
    }
    else if (finalRank <= 3) { 
      badgeText = "Top Nhà Sinh Tồn Xuất Sắc"; 
      badgeColor = "var(--neon-blue)"; 
      badgeIcon = <IconTrophy className="w-4 h-4 mr-1 inline-block" />;
    }
    else if (playerInfo.capital > 20000000) { 
      badgeText = "Kinh doanh có lãi"; 
      badgeColor = "var(--neon-green)"; 
      badgeIcon = <IconLeaf className="w-4 h-4 mr-1 inline-block" />;
    }
    else if (!playerInfo.isBankrupt) { 
      badgeText = "Sống sót thành công"; 
      badgeColor = "#e1dbd6"; 
      badgeIcon = <IconUser className="w-4 h-4 mr-1 inline-block" />;
    }

    return (
      <div className="minigame-panel" style={{ maxWidth: "450px", textAlign: "center" }}>
        <div style={{ marginBottom: "15px", display: "flex", justifyContent: "center" }}>
          <IconTrophy className="w-16 h-16 text-yellow-500 animate-pulse" />
        </div>
        <h2 className="minigame-title" style={{ fontSize: "1.8rem" }}>HOÀN THÀNH TRÒ CHƠI</h2>
        <p className="minigame-subtitle" style={{ fontSize: "1rem", marginBottom: "30px" }}>Kết quả kinh doanh của shop {playerName}</p>

        <div style={{ border: `1px solid ${badgeColor}`, display: "inline-flex", alignItems: "center", padding: "8px 15px", borderRadius: "9999px", color: badgeColor, fontWeight: "bold", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "30px", background: "rgba(255,255,255,0.01)" }}>
          {badgeIcon} {badgeText}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "15px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", padding: "20px", borderRadius: "16px", marginBottom: "30px", fontVariantNumeric: "tabular-nums", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#8b8680" }}>Vị trí xếp hạng:</span>
            <strong style={{ color: "var(--neon-gold)", fontSize: "1.1rem" }}>#{finalRank} / {totalPlayersCount}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#8b8680" }}>Tổng điểm:</span>
            <strong style={{ color: "var(--neon-blue)", fontSize: "1.1rem" }}>{playerInfo.score} điểm</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#8b8680" }}>Vốn còn lại:</span>
            <strong style={{ color: playerInfo.isBankrupt ? "var(--neon-red)" : "var(--neon-green)", fontSize: "1.1rem" }}>
              {playerInfo.capital?.toLocaleString()}đ
            </strong>
          </div>
        </div>

        <p style={{ color: "#8b8680", fontSize: "0.85rem", lineHeight: "1.5" }}>
          Cảm ơn bạn đã tham gia! Hãy lắng nghe MC tổng kết bài học.
        </p>
      </div>
    );
  }

  return null;
};

export default PlayerView;

