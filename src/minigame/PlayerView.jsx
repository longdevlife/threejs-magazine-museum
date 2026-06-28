import React, { useState, useEffect, useRef } from "react";
import { ref, set, update, onValue, get } from "firebase/database";
import { db } from "./firebaseConfig";
import { gameQuestions } from "./gameQuestions";
import RpgGamePlay from "./RpgGamePlay";

const PlayerView = ({ playerId, playerName, setPlayerName, gameState, dbConnected, onResetRole }) => {
  const [tempName, setTempName] = useState(playerName);
  const [isJoined, setIsJoined] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [playerInfo, setPlayerInfo] = useState({
    score: 0,
    capital: 20000000,
    streak: 0,
    isBankrupt: false
  });
  const [players, setPlayers] = useState({});
  const [timeLeft, setTimeLeft] = useState(20);

  // Dùng ref để tránh tính điểm lặp lại cho một câu hỏi
  const calculatedQuestionRef = useRef(-1);

  // Lắng nghe danh sách tất cả người chơi (để đếm tổng số)
  useEffect(() => {
    const playersRef = ref(db, "players");
    const unsubscribe = onValue(playersRef, (snapshot) => {
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

  // Đồng bộ đếm ngược thời gian từ câu hỏi
  useEffect(() => {
    let timer;
    if (gameState.status === "playing") {
      const elapsed = Math.floor((Date.now() - gameState.questionStartedAt) / 1000);
      const remaining = Math.max(0, gameState.timeLimit - elapsed);
      setTimeLeft(remaining);

      if (remaining > 0) {
        timer = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
    return () => clearInterval(timer);
  }, [gameState.status, gameState.questionStartedAt]);

  // Reset lựa chọn khi chuyển sang câu hỏi mới
  useEffect(() => {
    if (gameState.status === "playing") {
      setSelectedChoice(null);
      setHasAnswered(false);
    }
  }, [gameState.status, gameState.currentQuestion]);

  // Xử lý tự động tính điểm ở phía client khi Host công bố kết quả (show_result)
  useEffect(() => {
    if (gameState.status === "show_result" && isJoined) {
      const qIndex = gameState.currentQuestion;
      // Chỉ tính điểm một lần duy nhất cho mỗi câu hỏi
      if (calculatedQuestionRef.current !== qIndex) {
        calculatedQuestionRef.current = qIndex;
        calculateScoreForQuestion(qIndex);
      }
    }
  }, [gameState.status, gameState.currentQuestion, isJoined]);

  // Đăng ký tham gia game
  const handleJoinGame = async (e) => {
    e.preventDefault();
    if (!tempName.trim()) return;

    const cleanName = tempName.trim().substring(0, 15);
    setPlayerName(cleanName);
    localStorage.setItem("minigame_player_name", cleanName);

    // Lưu người chơi mới lên Firebase
    await set(ref(db, `players/${playerId}`), {
      name: cleanName,
      score: 0,
      capital: 20000000,
      streak: 0,
      isBankrupt: false,
      joinedAt: Date.now()
    });

    setIsJoined(true);
  };

  // Người chơi chọn một đáp án
  const handleSelectOption = async (choiceKey) => {
    if (hasAnswered || gameState.status !== "playing") return;

    setSelectedChoice(choiceKey);
    setHasAnswered(true);

    // Gửi câu trả lời lên Firebase kèm timestamp để tính bonus tốc độ
    await set(ref(db, `answers/question_${gameState.currentQuestion}/${playerId}`), {
      choice: choiceKey,
      answeredAt: Date.now()
    });
  };

  // Tính điểm cho câu hỏi
  const calculateScoreForQuestion = async (qIndex) => {
    const currentQ = gameQuestions[qIndex];
    if (!currentQ) return;

    // Lấy câu trả lời của người chơi từ Firebase
    const answerSnap = await get(ref(db, `answers/question_${qIndex}/${playerId}`));
    const answerData = answerSnap.val();

    let pointsGained = 0;
    let capitalChange = 0;
    let newStreak = playerInfo.streak;

    if (answerData) {
      const playerChoice = answerData.choice;
      const isCorrect = playerChoice === currentQ.correctAnswer;
      const isTrap = currentQ.trapAnswers.includes(playerChoice);

      if (isCorrect) {
        pointsGained = 100;
        capitalChange = 2000000;
        newStreak += 1;

        // Tính bonus tốc độ
        const responseTime = (answerData.answeredAt - gameState.questionStartedAt) / 1000;
        if (responseTime <= 5) {
          pointsGained += 50; // Trả lời siêu nhanh trong 5s đầu
        } else if (responseTime <= 10) {
          pointsGained += 25; // Trả lời nhanh trong 5-10s
        }

        // Streak bonus
        if (newStreak >= 3) {
          pointsGained += 75;
        }
      } else {
        newStreak = 0;
        if (isTrap) {
          pointsGained = -50;
          capitalChange = -3000000; // Phạt nặng nếu dính bẫy
        } else {
          pointsGained = -25;
          capitalChange = -1000000; // Phạt nhẹ hơn nếu sai bình thường
        }
      }
    } else {
      // Không trả lời (hết giờ)
      newStreak = 0;
      pointsGained = 0;
      capitalChange = 0;
    }

    // Tính toán các giá trị mới
    const newScore = Math.max(0, playerInfo.score + pointsGained);
    const newCapital = Math.max(0, playerInfo.capital + capitalChange);
    const newIsBankrupt = newCapital <= 0;

    // Cập nhật thông tin lên Firebase
    await update(ref(db, `players/${playerId}`), {
      score: newScore,
      capital: newCapital,
      streak: newStreak,
      isBankrupt: newIsBankrupt
    });
  };

  const totalPlayersCount = Object.keys(players).length;
  const currentQ = gameQuestions[gameState.currentQuestion];

  // Xếp hạng hiện tại của người chơi
  const getPlayerRank = () => {
    const sorted = Object.entries(players)
      .map(([id, info]) => ({ id, ...info }))
      .sort((a, b) => b.score - a.score);
    const rank = sorted.findIndex((p) => p.id === playerId);
    return rank !== -1 ? rank + 1 : "-";
  };

  // 1. CHƯA ĐĂNG KÝ TÊN -> HIỂN THỊ FORM ĐĂNG KÝ
  if (!isJoined) {
    return (
      <div className="minigame-panel" style={{ maxWidth: "450px" }}>
        <h2 className="minigame-title" style={{ fontSize: "2rem" }}>THAM GIA CHƠI</h2>
        <p className="minigame-subtitle" style={{ fontSize: "1.1rem" }}>Đăng ký mở shop quà tặng và bắt đầu cuộc sinh tồn</p>
        
        <form onSubmit={handleJoinGame} className="join-form">
          <div className="input-group">
            <label className="input-label">Nhập tên / Biệt danh:</label>
            <input 
              type="text" 
              className="game-input"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Ví dụ: Anh Tuấn FPT"
              maxLength={15}
              required
            />
          </div>
          
          <button type="submit" className="btn-cyber btn-cyber-blue" style={{ marginTop: "10px" }}>
            Tham gia ngay
          </button>
        </form>

        <button 
          onClick={onResetRole}
          style={{ background: "none", border: "none", color: "#8b8680", marginTop: "20px", textDecoration: "underline", cursor: "pointer", fontSize: "0.85rem" }}
        >
          Quay lại chọn vai trò
        </button>
      </div>
    );
  }

  // 2. TRẠNG THÁI: PHÒNG CHỜ (WAITING)
  if (gameState.status === "waiting") {
    return (
      <div className="minigame-panel" style={{ maxWidth: "450px", textAlign: "center" }}>
        <div style={{ fontSize: "4rem", marginBottom: "20px", animation: "float 2s infinite ease-in-out" }}>🎮</div>
        <h2 className="minigame-title" style={{ fontSize: "1.8rem" }}>ĐÃ THAM GIA PHÒNG</h2>
        <p style={{ color: "var(--neon-gold)", fontWeight: "600", fontSize: "1.1rem", margin: "10px 0" }}>
          Xin chào, {playerName}!
        </p>
        <p style={{ color: "#8b8680", fontSize: "0.95rem", lineHeight: "1.6" }}>
          Bạn đã đăng ký shop thành công. Vui lòng nhìn lên màn hình máy chiếu của cả lớp. MC sẽ sớm bắt đầu trò chơi!
        </p>

        <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "10px", padding: "15px", margin: "30px 0", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontSize: "0.9rem", color: "var(--neon-blue)", textTransform: "uppercase", fontWeight: "bold" }}>
            Tổng số người chơi:
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "bold", margin: "5px 0" }}>
            {totalPlayersCount}
          </div>
        </div>

        <div className="loading-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    );
  }

  // 3. TRẠNG THÁI: ĐANG CHƠI GAME RPG (PLAYING)
  if (gameState.status === "playing") {
    return (
      <RpgGamePlay 
        playerId={playerId}
        playerName={playerName}
        playerInfo={playerInfo}
        dbConnected={dbConnected}
      />
    );
  }

  // 4. TRẠNG THÁI: HIỂN THỊ KẾT QUẢ CỦA CÂU HỎI (SHOW_RESULT)
  if (gameState.status === "show_result" && currentQ) {
    const isCorrect = selectedChoice === currentQ.correctAnswer;
    const isTrap = currentQ.trapAnswers.includes(selectedChoice);
    
    let resultTitle = "BẠN KHÔNG TRẢ LỜI ⏱️";
    let resultClass = "wrong";
    let pointsFeedback = "0 điểm";
    let capitalFeedback = "";

    if (selectedChoice) {
      if (isCorrect) {
        resultTitle = "ĐÁP ÁN ĐÚNG! 🎉";
        resultClass = "correct";
        
        // Tính nhẩm điểm hiển thị phản hồi nhanh
        let pts = 100;
        if (playerInfo.streak >= 2) pts += 75; // Bao gồm cả câu này
        pointsFeedback = `+${pts} điểm`;
        capitalFeedback = "+2,000,000đ";
      } else {
        resultTitle = isTrap ? "DÍNH BẪY ĐỘC QUYỀN! 💀" : "ĐÁP ÁN SAI! ❌";
        resultClass = "wrong";
        pointsFeedback = isTrap ? "-50 điểm" : "-25 điểm";
        capitalFeedback = isTrap ? "-3,000,000đ" : "-1,000,000đ";
      }
    }

    return (
      <div className="minigame-panel" style={{ maxWidth: "550px" }}>
        <h2 className={`result-status ${resultClass}`}>{resultTitle}</h2>

        <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(0,0,0,0.3)", padding: "15px 20px", borderRadius: "10px", marginBottom: "25px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.8rem", color: "#8b8680", textTransform: "uppercase" }}>Tổng Điểm</div>
            <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "var(--neon-blue)" }}>{playerInfo.score}đ</div>
            <div style={{ fontSize: "0.8rem", color: isCorrect ? "var(--neon-green)" : "var(--neon-red)", marginTop: "2px" }}>{pointsFeedback}</div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.8rem", color: "#8b8680", textTransform: "uppercase" }}>Vốn Hiện Tại</div>
            <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: playerInfo.isBankrupt ? "var(--neon-red)" : "var(--neon-green)" }}>
              {playerInfo.isBankrupt ? "💀 PHÁ SẢN" : `${playerInfo.capital.toLocaleString()}đ`}
            </div>
            {capitalFeedback && (
              <div style={{ fontSize: "0.8rem", color: isCorrect ? "var(--neon-green)" : "var(--neon-red)", marginTop: "2px" }}>{capitalFeedback}</div>
            )}
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.8rem", color: "#8b8680", textTransform: "uppercase" }}>Hạng của bạn</div>
            <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "var(--neon-gold)" }}>#{getPlayerRank()}</div>
            <div style={{ fontSize: "0.8rem", color: "#8b8680", marginTop: "2px" }}>/{totalPlayersCount} người</div>
          </div>
        </div>

        {/* Nội dung đáp án đúng */}
        <div style={{ marginBottom: "20px" }}>
          <span style={{ fontWeight: "bold", color: "var(--neon-gold)" }}>Đáp án đúng: </span>
          <strong style={{ color: "var(--neon-green)" }}>{currentQ.correctAnswer}</strong>
          <p style={{ fontSize: "0.95rem", color: "#fff", marginTop: "5px", background: "rgba(255,255,255,0.02)", padding: "10px", borderRadius: "5px" }}>
            {currentQ.options[currentQ.correctAnswer]}
          </p>
        </div>

        <div className="explanation-section" style={{ padding: "15px", marginTop: "20px" }}>
          <div className="explanation-title" style={{ fontSize: "1.1rem" }}>💡 Bài học rút ra:</div>
          <p className="explanation-text" style={{ fontSize: "0.9rem", marginBottom: "15px" }}>{currentQ.explanation}</p>
          
          <div className="marx-section" style={{ paddingTop: "15px" }}>
            <div className="marx-title" style={{ fontSize: "1rem" }}>☭ Lý luận Mác - Lênin:</div>
            <p className="marx-text" style={{ fontSize: "0.95rem" }}>{currentQ.marxLenin}</p>
          </div>
        </div>

        <div style={{ textAlign: "center", color: "#8b8680", fontSize: "0.85rem", marginTop: "25px" }}>
          MC đang giảng bài và chuẩn bị chuyển câu tiếp theo...
        </div>
      </div>
    );
  }

  // 5. TRẠNG THÁI: KẾT THÚC GAME (FINISHED)
  if (gameState.status === "finished") {
    const finalRank = getPlayerRank();
    let badgeText = "💀 Doanh nghiệp phá sản";
    let badgeColor = "var(--neon-red)";
    
    if (finalRank === 1) {
      badgeText = "👑 Vua Sinh Tồn Sàn Số";
      badgeColor = "var(--neon-gold)";
    } else if (finalRank <= 3) {
      badgeText = "🏆 Top Nhà Sinh Tồn Xuất Sắc";
      badgeColor = "var(--neon-blue)";
    } else if (playerInfo.capital > 20000000) {
      badgeText = "📈 Kinh doanh có lãi";
      badgeColor = "var(--neon-green)";
    } else if (!playerInfo.isBankrupt) {
      badgeText = "💼 Sống sót thành công";
      badgeColor = "#e1dbd6";
    }

    return (
      <div className="minigame-panel" style={{ maxWidth: "450px", textAlign: "center" }}>
        <div style={{ fontSize: "4rem", marginBottom: "15px" }}>🏁</div>
        <h2 className="minigame-title" style={{ fontSize: "1.8rem" }}>HOÀN THÀNH TRÒ CHƠI</h2>
        <p className="minigame-subtitle" style={{ fontSize: "1.1rem", marginBottom: "30px" }}>Kết quả kinh doanh của shop {playerName}</p>

        <div style={{ border: `1px solid ${badgeColor}`, display: "inline-block", padding: "8px 15px", borderRadius: "20px", color: badgeColor, fontWeight: "bold", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "30px" }}>
          {badgeText}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "15px", background: "rgba(0,0,0,0.3)", padding: "20px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", marginBottom: "30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#8b8680" }}>Vị trí xếp hạng:</span>
            <strong style={{ color: "var(--neon-gold)", fontSize: "1.2rem" }}>#{finalRank} / {totalPlayersCount}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#8b8680" }}>Tổng điểm tích lũy:</span>
            <strong style={{ color: "var(--neon-blue)", fontSize: "1.2rem" }}>{playerInfo.score} điểm</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#8b8680" }}>Vốn còn lại:</span>
            <strong style={{ color: playerInfo.isBankrupt ? "var(--neon-red)" : "var(--neon-green)", fontSize: "1.2rem" }}>
              {playerInfo.capital.toLocaleString()}đ
            </strong>
          </div>
        </div>

        <p style={{ color: "#8b8680", fontSize: "0.85rem", lineHeight: "1.5", margin: "20px 0" }}>
          Cảm ơn bạn đã tham gia Mini Game thuyết trình! Hãy cùng MC lắng nghe các bài học lý luận Kinh tế chính trị kết luận.
        </p>

        <button 
          onClick={onResetRole}
          style={{ background: "none", border: "none", color: "#8b8680", textDecoration: "underline", cursor: "pointer", fontSize: "0.85rem" }}
        >
          Quay lại màn hình chính
        </button>
      </div>
    );
  }

  return null;
};

export default PlayerView;
