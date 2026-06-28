import React, { useEffect, useRef, useState } from "react";
import { ref, update, remove } from "firebase/database";
import { db } from "./firebaseConfig";
import { gameQuestions } from "./gameQuestions";

const RpgGamePlay = ({ playerId, playerName, playerInfo, dbConnected }) => {
  const iframeRef = useRef(null);
  
  // Trạng thái Popup câu hỏi
  const [currentActiveQ, setCurrentActiveQ] = useState(null);
  const [isFrozen, setIsFrozen] = useState(false);
  const [freezeTime, setFreezeTime] = useState(0);

  // 1. Lắng nghe tin nhắn postMessage gửi từ game Phaser trong iframe lên cửa sổ React ngoài
  useEffect(() => {
    const handleMessage = async (e) => {
      if (!e.data) return;

      // A. Nhặt sách tri thức
      if (e.data.type === "NHAT_SACH") {
        const randomQ = gameQuestions[Math.floor(Math.random() * gameQuestions.length)];
        setCurrentActiveQ(randomQ);
      }

      // B. Va chạm cạm bẫy Laser
      if (e.data.type === "DINH_BAY") {
        setIsFrozen(true);
        setFreezeTime(3);

        // Phát lệnh FREEZE vào game Phaser để khóa di chuyển nhân vật
        iframeRef.current?.contentWindow?.postMessage({ type: "FREEZE" }, "*");

        // Phạt tiền và điểm
        const penaltyCapital = -3000000;
        const penaltyScore = -50;
        const newCapital = Math.max(0, playerInfo.capital + penaltyCapital);
        const newScore = Math.max(0, playerInfo.score + penaltyScore);

        update(ref(db, `players/${playerId}`), {
          capital: newCapital,
          score: newScore,
          isBankrupt: newCapital <= 0
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [playerInfo, playerId]);

  // 2. Bộ đếm ngược thời gian đóng băng
  useEffect(() => {
    let timer;
    if (isFrozen && freezeTime > 0) {
      timer = setInterval(() => {
        setFreezeTime((prev) => {
          if (prev <= 1) {
            setIsFrozen(false);
            // Phát lệnh UNFREEZE vào game Phaser để giải phóng nhân vật
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

  // 3. Gửi sự kiện di chuyển D-pad ảo từ React vào Phaser
  const handleDpadPress = (dir) => {
    if (currentActiveQ || isFrozen) return;
    iframeRef.current?.contentWindow?.postMessage({ type: "DPAD_MOVE", dir }, "*");
  };

  const handleDpadRelease = () => {
    iframeRef.current?.contentWindow?.postMessage({ type: "DPAD_MOVE", dir: "stop" }, "*");
  };

  // 4. Giải đố câu hỏi từ popup
  const handleAnswerQuestion = async (choiceKey) => {
    const isCorrect = choiceKey === currentActiveQ.correctAnswer;
    const isTrap = currentActiveQ.trapAnswers.includes(choiceKey);

    let ptsGained = 0;
    let capGained = 0;
    let newStreak = playerInfo.streak;

    if (isCorrect) {
      ptsGained = 100;
      capGained = 2000000;
      newStreak += 1;
      if (newStreak >= 3) ptsGained += 75; 
    } else {
      newStreak = 0;
      if (isTrap) {
        ptsGained = -50;
        capGained = -3000000; 
      } else {
        ptsGained = -25;
        capGained = -1000000;
      }
    }

    const newScore = Math.max(0, playerInfo.score + ptsGained);
    const newCapital = Math.max(0, playerInfo.capital + capGained);

    await update(ref(db, `players/${playerId}`), {
      score: newScore,
      capital: newCapital,
      streak: newStreak,
      isBankrupt: newCapital <= 0
    });

    setCurrentActiveQ(null); 
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: "1000px", margin: "0 auto" }}>
      
      {/* HUD Chỉ số Doanh nghiệp mộc mạc phía trên game */}
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", background: "#fcf3e3", border: "3px solid #a16b47", borderRadius: "12px", padding: "10px 15px", marginBottom: "15px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", color: "#333" }}>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: "9px", color: "#795548", fontWeight: "bold", textTransform: "uppercase" }}>Vốn Doanh Nghiệp</div>
          <div style={{ fontSize: "15px", fontWeight: "bold", color: playerInfo.isBankrupt ? "#d32f2f" : "#388e3c" }}>
            {playerInfo.isBankrupt ? "💀 PHÁ SẢN" : `${playerInfo.capital.toLocaleString()}đ`}
          </div>
        </div>
        <div style={{ width: "2px", background: "#a16b47", margin: "0 10px" }} />
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: "9px", color: "#795548", fontWeight: "bold", textTransform: "uppercase" }}>Điểm Tích Lũy</div>
          <div style={{ fontSize: "15px", fontWeight: "bold", color: "#1976d2" }}>{playerInfo.score}đ</div>
        </div>
        <div style={{ width: "2px", background: "#a16b47", margin: "0 10px" }} />
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: "9px", color: "#795548", fontWeight: "bold", textTransform: "uppercase" }}>Chuỗi Streak</div>
          <div style={{ fontSize: "15px", fontWeight: "bold", color: "#f57c00" }}>{playerInfo.streak} 🔥</div>
        </div>
      </div>

      {/* Màn hình game nhúng Iframe Phaser RPG chính gốc */}
      <div className="game-console-wrapper" style={{ width: "100%", background: "#a16b47", border: "5px solid #5c3d28", borderRadius: "24px", padding: "12px", boxShadow: "0 20px 40px rgba(0,0,0,0.5), inset 0 0 10px rgba(0,0,0,0.6)" }}>
        
        {/* Đèn chỉ báo LED */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0 10px 8px" }}>
          <div style={{ display: "flex", gap: "6px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: dbConnected ? "#4caf50" : "#f44336", boxShadow: dbConnected ? "0 0 8px #4caf50" : "0 0 8px #f44336" }} />
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: isFrozen ? "#00bcd4" : "rgba(255,255,255,0.2)" }} />
          </div>
          <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", letterSpacing: "1.5px", fontWeight: "bold" }}>PHASER 3 ENGINE SANDBOX</span>
        </div>

        {/* Thẻ iframe load game Phaser RPG */}
        <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", border: "4px solid #333333", borderRadius: "8px", overflow: "hidden", background: "#000" }}>
          <iframe 
            ref={iframeRef}
            src={`/rpg/index.html?role=player&id=${playerId}&name=${encodeURIComponent(playerName)}`}
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            title="Phaser RPG"
          />

          {/* Overlay đóng băng */}
          {isFrozen && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0, 188, 212, 0.2)", backdropFilter: "blur(4px)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", pointerEvents: "all" }}>
              <span style={{ fontSize: "3.5rem" }}>🧊</span>
              <h3 style={{ color: "#ffffff", fontWeight: "bold", fontSize: "1.4rem", textShadow: "0 2px 4px rgba(0,0,0,0.5)", marginTop: "10px" }}>KHÓA THUẬT TOÁN</h3>
              <p style={{ color: "#ffffff", fontSize: "0.9rem" }}>Đóng băng: {freezeTime}s</p>
            </div>
          )}
        </div>
      </div>

      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", marginTop: "12px", textAlign: "center" }}>
        ⌨️ Dùng các phím **WASD** / **Mũi tên** trên PC hoặc **D-pad** dưới đây trên Mobile.
      </div>

      {/* D-pad tương tác di chuyển gửi message cho Phaser */}
      <div className="dpad-container" style={{ userSelect: "none" }}>
        <button 
          className="dpad-btn" 
          onMouseDown={() => handleDpadPress("up")}
          onMouseUp={handleDpadRelease}
          onTouchStart={() => handleDpadPress("up")}
          onTouchEnd={handleDpadRelease}
        >▲</button>
        <div style={{ display: "flex", gap: "25px" }}>
          <button 
            className="dpad-btn" 
            onMouseDown={() => handleDpadPress("left")}
            onMouseUp={handleDpadRelease}
            onTouchStart={() => handleDpadPress("left")}
            onTouchEnd={handleDpadRelease}
          >◀</button>
          <button 
            className="dpad-btn" 
            onMouseDown={() => handleDpadPress("right")}
            onMouseUp={handleDpadRelease}
            onTouchStart={() => handleDpadPress("right")}
            onTouchEnd={handleDpadRelease}
          >▶</button>
        </div>
        <button 
          className="dpad-btn" 
          onMouseDown={() => handleDpadPress("down")}
          onMouseUp={handleDpadRelease}
          onTouchStart={() => handleDpadPress("down")}
          onTouchEnd={handleDpadRelease}
        >▼</button>
      </div>

      {/* POPUP Câu hỏi Tri thức */}
      {currentActiveQ && (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
          <div className="minigame-panel" style={{ maxWidth: "500px", border: "4px solid #a16b47", background: "#fcf3e3", color: "#333", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", padding: "30px 25px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <span style={{ fontSize: "1.8rem" }}>📖</span>
              <h3 style={{ fontFamily: "var(--font-heading)", color: "#a16b47", fontSize: "1.4rem", fontWeight: "bold" }}>
                SÁCH VÀNG TRI THỨC
              </h3>
            </div>
            
            <p style={{ color: "#333", fontSize: "1.05rem", lineHeight: "1.6", marginBottom: "30px", fontWeight: "600" }}>
              {currentActiveQ.situation}
            </p>

            <div className="options-grid" style={{ gridTemplateColumns: "1fr", gap: "12px" }}>
              {Object.entries(currentActiveQ.options).map(([key, value]) => (
                <button 
                  key={key} 
                  className="option-button"
                  onClick={() => handleAnswerQuestion(key)}
                  style={{ 
                    padding: "14px 18px", 
                    fontSize: "0.95rem", 
                    background: "#ffffff", 
                    color: "#333", 
                    border: "2px solid #a16b47",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    textAlign: "left"
                  }}
                >
                  <span style={{ color: "#a16b47", marginRight: "8px" }}>{key}.</span> {value}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RpgGamePlay;
