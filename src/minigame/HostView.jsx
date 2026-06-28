import React, { useState, useEffect } from "react";
import { ref, set, onValue, remove, update } from "firebase/database";
import { db } from "./firebaseConfig";
import { gameQuestions } from "./gameQuestions";

const HostView = ({ gameState, dbConnected, onResetRole }) => {
  const [players, setPlayers] = useState({});
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(20);
  const [qrUrl, setQrUrl] = useState("");

  // Lấy URL hiện tại để hiển thị mã QR cho người chơi quét
  useEffect(() => {
    const url = window.location.origin + window.location.pathname + "#minigame";
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=c5272d&data=${encodeURIComponent(url)}`);
  }, []);

  // Lắng nghe danh sách người chơi từ Firebase
  useEffect(() => {
    const playersRef = ref(db, "players");
    const unsubscribe = onValue(playersRef, (snapshot) => {
      const data = snapshot.val() || {};
      setPlayers(data);
    });
    return () => unsubscribe();
  }, []);

  // Lắng nghe câu trả lời cho câu hỏi hiện tại
  useEffect(() => {
    if (gameState.status === "playing" || gameState.status === "show_result") {
      const answersRef = ref(db, `answers/question_${gameState.currentQuestion}`);
      const unsubscribe = onValue(answersRef, (snapshot) => {
        const data = snapshot.val() || {};
        setAnswers(data);
      });
      return () => unsubscribe();
    } else {
      setAnswers({});
    }
  }, [gameState.status, gameState.currentQuestion]);

  // Bộ đếm ngược thời gian câu hỏi (chạy trên Host và đồng bộ hóa)
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
              handleEndQuestion(); // Hết giờ thì tự động kết thúc câu hỏi
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        handleEndQuestion();
      }
    }
    return () => clearInterval(timer);
  }, [gameState.status, gameState.questionStartedAt]);

  const playerList = Object.entries(players).map(([id, info]) => ({ id, ...info }));
  const totalPlayers = playerList.length;
  const answeredCount = Object.keys(answers).length;

  const handleKickPlayer = async (playerId) => {
    if (window.confirm("Bạn có chắc chắn muốn kick người chơi này ra khỏi phòng?")) {
      await remove(ref(db, `players/${playerId}`));
    }
  };

  // Bắt đầu game
  const handleStartGame = async () => {
    // Reset điểm số của tất cả người chơi về mặc định (Vốn 20 triệu, điểm 0)
    const updates = {};
    playerList.forEach((player) => {
      updates[`players/${player.id}/score`] = 0;
      updates[`players/${player.id}/capital`] = 20000000;
      updates[`players/${player.id}/streak`] = 0;
      updates[`players/${player.id}/isBankrupt`] = false;
    });

    // Reset toàn bộ câu trả lời cũ
    await remove(ref(db, "answers"));

    // Cập nhật trạng thái game
    updates["gameState"] = {
      status: "playing",
      currentQuestion: 0,
      questionStartedAt: Date.now(),
      timeLimit: 20
    };

    update(ref(db), updates);
  };

  // Kết thúc câu hỏi (chuyển sang hiển thị kết quả)
  const handleEndQuestion = () => {
    if (gameState.status !== "playing") return;

    set(ref(db, "gameState/status"), "show_result");
  };

  // Chuyển sang câu hỏi tiếp theo
  const handleNextQuestion = async () => {
    const nextIndex = gameState.currentQuestion + 1;

    if (nextIndex < gameQuestions.length) {
      // Còn câu hỏi tiếp theo
      set(ref(db, "gameState"), {
        status: "playing",
        currentQuestion: nextIndex,
        questionStartedAt: Date.now(),
        timeLimit: 20
      });
    } else {
      // Hết câu hỏi -> Kết thúc game
      set(ref(db, "gameState/status"), "finished");
    }
  };

  // Khởi động lại toàn bộ game
  const handleResetGame = async () => {
    await remove(ref(db, "answers"));
    await set(ref(db, "gameState"), {
      status: "waiting",
      currentQuestion: 0,
      questionStartedAt: 0,
      timeLimit: 20
    });
  };

  // Tính toán thống kê câu trả lời (bao nhiêu % chọn A, B, C, D)
  const getAnswerStats = () => {
    const stats = { A: 0, B: 0, C: 0, D: 0 };
    Object.values(answers).forEach((ans) => {
      if (stats[ans.choice] !== undefined) {
        stats[ans.choice]++;
      }
    });

    const total = Object.keys(answers).length || 1;
    return Object.entries(stats).map(([option, count]) => ({
      option,
      count,
      percentage: Math.round((count / total) * 100)
    }));
  };

  const currentQ = gameQuestions[gameState.currentQuestion];

  return (
    <div className="minigame-panel" style={{ maxWidth: "1000px" }}>
      {/* Thanh Header của Host */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "15px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.5rem" }}>🖥️</span>
          <span style={{ fontWeight: 800, color: "var(--neon-red)", letterSpacing: "1px", textTransform: "uppercase" }}>
            Bảng điều khiển MC
          </span>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn-cyber" style={{ padding: "8px 15px", fontSize: "0.85rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "none" }} onClick={onResetRole}>
            Đổi vai trò
          </button>
          <button className="btn-cyber" style={{ padding: "8px 15px", fontSize: "0.85rem", background: "linear-gradient(135deg, #555, #222)", boxShadow: "none" }} onClick={handleResetGame}>
            Reset Game
          </button>
        </div>
      </div>

      {/* TRẠNG THÁI: PHÒNG CHỜ (WAITING) */}
      {gameState.status === "waiting" && (
        <div className="lobby-waiting">
          <h2 className="minigame-title">PHÒNG CHỜ THAM GIA</h2>
          <p className="minigame-subtitle">Mời cả lớp quét mã QR hoặc truy cập đường link để tham gia</p>

          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: "50px", margin: "40px 0" }}>
            {qrUrl && (
              <div style={{ background: "#fff", padding: "15px", borderRadius: "15px", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
                <img src={qrUrl} alt="QR Code" style={{ display: "block" }} />
                <div style={{ color: "#333", fontSize: "0.85rem", fontWeight: "bold", marginTop: "10px" }}>
                  QUÉT ĐỂ CHƠI GAME
                </div>
              </div>
            )}
            
            <div style={{ textAlign: "left", maxWidth: "350px" }}>
              <div style={{ fontSize: "1.1rem", marginBottom: "10px", color: "var(--neon-gold)", fontWeight: "bold" }}>
                HƯỚNG DẪN THAM GIA:
              </div>
              <ol style={{ paddingLeft: "20px", color: "#8b8680", lineHeight: "1.6" }}>
                <li>Quét mã QR bằng điện thoại.</li>
                <li>Nhập Tên / Biệt danh để đăng ký.</li>
                <li>Chờ MC bấm nút bắt đầu để bắt đầu hành trình sinh tồn.</li>
              </ol>
              <div className="player-count">
                Đã tham gia: {totalPlayers} người chơi
                <div className="loading-dots"><span></span><span></span><span></span></div>
              </div>
              <button 
                className="btn-cyber btn-cyber-blue" 
                style={{ width: "100%", marginTop: "20px" }}
                onClick={handleStartGame}
                disabled={totalPlayers === 0}
              >
                Bắt đầu Trò chơi
              </button>
            </div>
          </div>

          <h3 style={{ textTransform: "uppercase", fontSize: "0.9rem", color: "var(--neon-gold)", letterSpacing: "1px", marginBottom: "15px", textAlign: "left" }}>
            Danh sách người chơi:
          </h3>
          {totalPlayers === 0 ? (
            <div style={{ color: "#8b8680", fontStyle: "italic", padding: "20px" }}>Đang chờ mọi người kết nối...</div>
          ) : (
            <div className="player-grid">
              {playerList.map((p) => (
                <div className="player-pill" key={p.id} style={{ display: "inline-flex", alignItems: "center", gap: "8px", overflow: "visible" }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>👤 {p.name}</span>
                  <button 
                    onClick={() => handleKickPlayer(p.id)}
                    style={{
                      background: "rgba(211, 47, 47, 0.2)",
                      border: "1px solid #d32f2f",
                      borderRadius: "50%",
                      width: "18px",
                      height: "18px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ff5252",
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

      {/* TRẠNG THÁI: ĐANG TRẢ LỜI CÂU HỎI (PLAYING) */}
      {gameState.status === "playing" && currentQ && (
        <div>
          <div className="game-play-header">
            <span className="question-number">CÂU HỎI {gameState.currentQuestion + 1} / {gameQuestions.length}</span>
            <span style={{ fontSize: "1.3rem", fontWeight: "bold", color: timeLeft <= 5 ? "var(--neon-red)" : "var(--neon-blue)" }}>
              ⏱️ {timeLeft}s
            </span>
          </div>

          <div className="timer-bar-container">
            <div 
              className="timer-bar" 
              style={{ 
                width: `${(timeLeft / gameState.timeLimit) * 100}%`,
                background: timeLeft <= 5 ? "var(--neon-red)" : "linear-gradient(90deg, var(--neon-green), var(--neon-gold))"
              }}
            />
          </div>

          <div className="situation-box">
            {currentQ.situation}
          </div>

          <div className="options-grid">
            {Object.entries(currentQ.options).map(([key, value]) => (
              <div className="option-button" key={key}>
                <span className="option-prefix">{key}.</span> {value}
              </div>
            ))}
          </div>

          <div style={{ marginTop: "40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: "600", color: "var(--neon-blue)" }}>
              Đã trả lời: {answeredCount} / {totalPlayers} người chơi
            </div>
            <button className="btn-cyber" onClick={handleEndQuestion}>
              Công bố kết quả sớm
            </button>
          </div>
        </div>
      )}

      {/* TRẠNG THÁI: CÔNG BỐ KẾT QUẢ CÂU HỎI (SHOW_RESULT) */}
      {gameState.status === "show_result" && currentQ && (
        <div>
          <h2 className="result-status correct" style={{ color: "var(--neon-gold)", textShadow: "none" }}>
            KẾT QUẢ CÂU HỎI {gameState.currentQuestion + 1}
          </h2>

          <div className="situation-box" style={{ fontSize: "1.1rem", marginBottom: "25px" }}>
            {currentQ.situation}
          </div>

          {/* Biểu đồ thống kê kết quả của cả lớp */}
          <div style={{ margin: "30px 0" }}>
            <h3 style={{ fontSize: "1rem", color: "var(--neon-blue)", textTransform: "uppercase", marginBottom: "15px" }}>
              Thống kê câu trả lời của cả lớp:
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {getAnswerStats().map(({ option, count, percentage }) => {
                const isCorrect = option === currentQ.correctAnswer;
                const isTrap = currentQ.trapAnswers.includes(option);
                let barColor = "rgba(255,255,255,0.2)";
                if (isCorrect) barColor = "var(--neon-green)";
                else if (isTrap) barColor = "var(--neon-red)";

                return (
                  <div key={option} style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    <span style={{ fontWeight: "bold", width: "25px", fontSize: "1.1rem" }}>{option}:</span>
                    <div style={{ flex: 1, height: "24px", background: "rgba(0,0,0,0.3)", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div 
                        style={{ 
                          height: "100%", 
                          width: `${percentage}%`, 
                          background: barColor, 
                          boxShadow: isCorrect ? "0 0 10px rgba(57,255,20,0.3)" : "none",
                          transition: "width 0.8s ease-out" 
                        }} 
                      />
                    </div>
                    <span style={{ width: "80px", textAlign: "right", fontSize: "0.95rem" }}>
                      {count} người ({percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nội dung giải thích lý thuyết */}
          <div className="explanation-section">
            <div className="explanation-title">💡 Giải thích hiện tượng:</div>
            <p className="explanation-text">{currentQ.explanation}</p>
            
            <div className="marx-section">
              <div className="marx-title">☭ Luận điểm Kinh tế chính trị Mác - Lênin:</div>
              <p className="marx-text">"{currentQ.marxLenin}"</p>
            </div>
          </div>

          {/* Bảng xếp hạng Top 5 tạm thời */}
          <div style={{ marginTop: "40px" }}>
            <h3 className="leaderboard-title">BẢNG XẾP HẠNG TẠM THỜI</h3>
            <div className="leaderboard-list">
              {playerList
                .sort((a, b) => b.score - a.score)
                .slice(0, 5)
                .map((player, idx) => (
                  <div className="leaderboard-item" key={player.id}>
                    <div className="player-info">
                      <span className="player-rank">{idx + 1}</span>
                      <span className="player-name-txt">{player.name} {player.isBankrupt ? "💀" : ""}</span>
                    </div>
                    <div style={{ display: "flex", gap: "20px" }}>
                      <span style={{ color: "#8b8680" }}>
                        Vốn: {(player.capital ?? 0).toLocaleString()}đ
                      </span>
                      <span className="player-score-txt">{player.score}đ</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <button 
            className="btn-cyber btn-cyber-blue" 
            style={{ width: "100%", marginTop: "30px" }}
            onClick={handleNextQuestion}
          >
            {gameState.currentQuestion + 1 < gameQuestions.length ? "Câu hỏi tiếp theo ➔" : "Kết thúc & Trình chiếu vinh danh 🎉"}
          </button>
        </div>
      )}

      {/* TRẠNG THÁI: KẾT THÚC VÀ VINH DANH (FINISHED) */}
      {gameState.status === "finished" && (
        <div style={{ textAlign: "center" }}>
          <h2 className="minigame-title">CHIẾN THẮNG CHUNG CUỘC</h2>
          <p className="minigame-subtitle">Vinh danh những nhà sinh tồn xuất sắc nhất trên Sàn Số</p>

          {/* Bục Podium vinh danh Top 3 */}
          {playerList.length > 0 && (
            <div className="podium-container">
              {/* Hạng 2 */}
              {playerList.sort((a,b)=>b.score - a.score)[1] && (
                <div className="podium-step silver">
                  <div className="podium-crown" style={{ animationDelay: "0.5s" }}>🥈</div>
                  <div className="podium-name">{playerList.sort((a,b)=>b.score - a.score)[1].name}</div>
                  <div className="podium-score">{playerList.sort((a,b)=>b.score - a.score)[1].score}đ</div>
                  <div className="podium-number">2</div>
                </div>
              )}

              {/* Hạng 1 */}
              {playerList.sort((a,b)=>b.score - a.score)[0] && (
                <div className="podium-step gold">
                  <div className="podium-crown">👑</div>
                  <div className="podium-name" style={{ fontWeight: "bold" }}>{playerList.sort((a,b)=>b.score - a.score)[0].name}</div>
                  <div className="podium-score" style={{ fontWeight: "bold" }}>{playerList.sort((a,b)=>b.score - a.score)[0].score}đ</div>
                  <div className="podium-number">1</div>
                </div>
              )}

              {/* Hạng 3 */}
              {playerList.sort((a,b)=>b.score - a.score)[2] && (
                <div className="podium-step bronze">
                  <div className="podium-crown" style={{ animationDelay: "1s" }}>🥉</div>
                  <div className="podium-name">{playerList.sort((a,b)=>b.score - a.score)[2].name}</div>
                  <div className="podium-score">{playerList.sort((a,b)=>b.score - a.score)[2].score}đ</div>
                  <div className="podium-number">3</div>
                </div>
              )}
            </div>
          )}

          {/* Bảng xếp hạng Top 10 đầy đủ */}
          <div style={{ marginTop: "40px", textAlign: "left" }}>
            <h3 className="leaderboard-title">BẢNG XẾP HẠNG CHI TIẾT (TOP 10)</h3>
            <div className="leaderboard-list">
              {playerList
                .sort((a, b) => b.score - a.score)
                .slice(0, 10)
                .map((player, idx) => (
                  <div className="leaderboard-item" key={player.id}>
                    <div className="player-info">
                      <span className="player-rank">{idx + 1}</span>
                      <span className="player-name-txt">
                        {player.name} {idx === 0 ? "👑" : ""} {player.isBankrupt ? "💀" : ""}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "25px" }}>
                      <span style={{ color: "#8b8680" }}>
                        Vốn cuối: {(player.capital ?? 0).toLocaleString()}đ
                      </span>
                      <span className="player-score-txt">{player.score}đ</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "20px", marginTop: "40px" }}>
            <button className="btn-cyber" style={{ flex: 1 }} onClick={handleStartGame}>
              Chơi Lượt Mới
            </button>
            <button className="btn-cyber btn-cyber-blue" style={{ flex: 1 }} onClick={handleResetGame}>
              Quay lại Phòng Chờ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostView;
