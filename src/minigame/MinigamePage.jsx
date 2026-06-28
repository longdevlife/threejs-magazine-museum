import React, { useState, useEffect } from "react";
import { ref, onValue, set, get } from "firebase/database";
import { db } from "./firebaseConfig";
import HostView from "./RpgHostView";
import PlayerView from "./PlayerView";
import "./minigame.css";

export const MinigamePage = () => {
  // Vai trò: 'host' | 'player' | null
  const [role, setRole] = useState(() => {
    return localStorage.getItem("minigame_role") || null;
  });

  const [playerId, setPlayerId] = useState(() => {
    let id = localStorage.getItem("minigame_player_id");
    if (!id) {
      id = "player_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("minigame_player_id", id);
    }
    return id;
  });

  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem("minigame_player_name") || "";
  });

  const [dbConnected, setDbConnected] = useState(false);
  const [gameState, setGameState] = useState({
    status: "waiting", // waiting | playing | show_result | finished
    currentQuestion: 0,
    questionStartedAt: 0,
    timeLimit: 20
  });

  // Kiểm tra kết nối Firebase Realtime Database
  useEffect(() => {
    const connectedRef = ref(db, ".info/connected");
    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        setDbConnected(true);
      } else {
        setDbConnected(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Lắng nghe trạng thái game toàn cục từ Firebase
  useEffect(() => {
    const gameStateRef = ref(db, "gameState");
    const unsubscribe = onValue(gameStateRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGameState(data);
      } else {
        // Khởi tạo trạng thái mặc định nếu database trống
        set(gameStateRef, {
          status: "waiting",
          currentQuestion: 0,
          questionStartedAt: 0,
          timeLimit: 20
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSelectRole = (selectedRole) => {
    setRole(selectedRole);
    localStorage.setItem("minigame_role", selectedRole);
  };

  const handleResetRole = () => {
    setRole(null);
    localStorage.removeItem("minigame_role");
  };

  // Màn hình chọn vai trò ban đầu
  if (!role) {
    return (
      <div className="minigame-container">
        <div className="minigame-panel role-selection">
          <h1 className="minigame-title">SINH TỒN TRÊN SÀN SỐ</h1>
          <p className="minigame-subtitle">Sự vận động của Cạnh tranh & Độc quyền trong Nền kinh tế số</p>
          
          <div className="role-buttons">
            <div className="role-card role-player" onClick={() => handleSelectRole("player")}>
              <div className="role-icon">📱</div>
              <div className="role-name">Người Chơi</div>
              <div className="role-desc">Dành cho sinh viên cả lớp. Quét mã QR trên máy chiếu, tham gia và tương tác trả lời câu hỏi trực tiếp trên điện thoại của bạn.</div>
            </div>

            <div className="role-card role-host" onClick={() => handleSelectRole("host")}>
              <div className="role-icon">🖥️</div>
              <div className="role-name">Ban Tổ Chức (Host/MC)</div>
              <div className="role-desc">Dành cho nhóm thuyết trình. Quản lý trạng thái game, trình chiếu câu hỏi và bảng xếp hạng realtime lên máy chiếu.</div>
            </div>
          </div>

          <div style={{ marginTop: "30px", fontSize: "0.85rem", color: dbConnected ? "#39ff14" : "#ff3344" }}>
            Trạng thái máy chủ: {dbConnected ? "● ĐÃ KẾT NỐI (Realtime)" : "○ MẤT KẾT NỐI (Vui lòng cấu hình Firebase)"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="minigame-container">
      {role === "host" ? (
        <HostView 
          gameState={gameState} 
          dbConnected={dbConnected} 
          onResetRole={handleResetRole} 
        />
      ) : (
        <PlayerView 
          playerId={playerId}
          playerName={playerName}
          setPlayerName={setPlayerName}
          gameState={gameState} 
          dbConnected={dbConnected} 
          onResetRole={handleResetRole} 
        />
      )}
    </div>
  );
};
