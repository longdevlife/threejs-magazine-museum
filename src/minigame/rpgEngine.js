// Kích thước thế giới game 2D RPG
export const WORLD_WIDTH = 1600;  // Mở rộng thế giới rộng lớn hơn để cuộn camera
export const WORLD_HEIGHT = 1200;
export const TILE_SIZE = 40;

// Các chướng ngại vật vật lý (Tòa nhà, Hàng rào, Cây cối)
export const OBSTACLES = [
  // Viền bản đồ bằng tường cây thông rậm rạp (Không cho đi ra ngoài)
  { x: 0, y: 0, width: WORLD_WIDTH, height: TILE_SIZE, type: "tree_wall" },
  { x: 0, y: WORLD_HEIGHT - TILE_SIZE, width: WORLD_WIDTH, height: TILE_SIZE, type: "tree_wall" },
  { x: 0, y: 0, width: TILE_SIZE, height: WORLD_HEIGHT, type: "tree_wall" },
  { x: WORLD_WIDTH - TILE_SIZE, y: 0, width: TILE_SIZE, height: WORLD_HEIGHT, type: "tree_wall" },

  // Tòa nhà Shopee Mall (Cam/Đỏ, góc trên trái)
  { x: 160, y: 160, width: 280, height: 180, label: "Shopee Mall", color: "#ff5722", type: "building" },

  // Tòa nhà Grab HQ (Xanh lá, góc trên phải)
  { x: 1160, y: 160, width: 280, height: 180, label: "Grab HQ", color: "#4caf50", type: "building" },

  // Khu Chợ truyền thống (Mái gỗ, góc dưới trái)
  { x: 160, y: 860, width: 320, height: 180, label: "Chợ Dân Sinh", color: "#ff9800", type: "market" },

  // Thị trường ngách (Mái xanh dương, góc dưới phải)
  { x: 1160, y: 860, width: 280, height: 180, label: "Thị Trường Ngách", color: "#00bcd4", type: "niche" },

  // Siêu máy tính AI kiểm soát ở trung tâm
  { x: 680, y: 500, width: 240, height: 180, label: "AI Core", color: "#e91e63", type: "ai_core" }
];

// Kiểm tra va chạm giữa hai hình chữ nhật (AABB)
export const checkCollision = (rect1, rect2) => {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
};

// Kiểm tra va chạm với bản đồ
export const checkMapCollisions = (playerX, playerY, playerSize) => {
  const playerRect = { x: playerX, y: playerY, width: playerSize, height: playerSize };
  
  // 1. Va chạm với chướng ngại vật tĩnh
  for (const obs of OBSTACLES) {
    if (obs.type === "tree_wall") {
      if (checkCollision(playerRect, obs)) return true;
    } else {
      // Cho chướng ngại vật thường nhỏ hơn thực tế 10px để đi sát tường dễ hơn
      const hitbox = { x: obs.x + 8, y: obs.y + 8, width: obs.width - 16, height: obs.height - 16 };
      if (checkCollision(playerRect, hitbox)) return true;
    }
  }

  // 2. Va chạm với hồ nước trang trí
  const ponds = [
    { x: 520, y: 200, width: 80, height: 240 },
    { x: 1000, y: 200, width: 80, height: 240 },
    { x: 520, y: 760, width: 80, height: 240 }
  ];
  for (const pond of ponds) {
    if (checkCollision(playerRect, pond)) return true;
  }

  return false;
};

// Vẽ cây thông Pixel Art (RPG Style)
const drawTree = (ctx, x, y) => {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Thân cây gỗ nâu
  ctx.fillStyle = "#8a5233";
  ctx.fillRect(x + 16, y + 22, 8, 18);

  // Bóng đổ lá cây dưới đất
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
  ctx.beginPath();
  ctx.ellipse(x + 20, y + 38, 14, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Các tầng lá cây màu xanh tươi (Xếp lớp tam giác)
  // Tầng 3 (Dưới cùng)
  ctx.fillStyle = "#3d8b35";
  ctx.beginPath();
  ctx.moveTo(x + 20, y + 10);
  ctx.lineTo(x + 2, y + 30);
  ctx.lineTo(x + 38, y + 30);
  ctx.closePath();
  ctx.fill();

  // Tầng 2 (Giữa)
  ctx.fillStyle = "#4caf50";
  ctx.beginPath();
  ctx.moveTo(x + 20, y + 2);
  ctx.lineTo(x + 6, y + 20);
  ctx.lineTo(x + 34, y + 20);
  ctx.closePath();
  ctx.fill();

  // Tầng 1 (Đỉnh)
  ctx.fillStyle = "#81c784";
  ctx.beginPath();
  ctx.moveTo(x + 20, y - 6);
  ctx.lineTo(x + 10, y + 10);
  ctx.lineTo(x + 30, y + 10);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
};

// Vẽ hàng rào gỗ Pixel (Fence Tile)
const drawFence = (ctx, x, y) => {
  ctx.save();
  ctx.fillStyle = "#a16b47";
  ctx.strokeStyle = "#5c3d28";
  ctx.lineWidth = 2;

  // Thanh ngang
  ctx.fillRect(x, y + 14, TILE_SIZE, 5);
  ctx.strokeRect(x, y + 14, TILE_SIZE, 5);

  // Thanh đứng
  ctx.fillRect(x + 8, y + 4, 6, 32);
  ctx.strokeRect(x + 8, y + 4, 6, 32);
  ctx.fillRect(x + 26, y + 4, 6, 32);
  ctx.strokeRect(x + 26, y + 4, 6, 32);

  ctx.restore();
};

// Vẽ gạch cỏ tươi sáng (Grass Tile)
const drawGrassTile = (ctx, x, y) => {
  // Nền cỏ màu xanh tươi sáng (Y chang phaser-rpg demo)
  ctx.fillStyle = "#55b848";
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

  // Vẽ các khóm cỏ nhỏ màu xanh sáng/nhạt
  ctx.fillStyle = "#77d26b";
  ctx.fillRect(x + 10, y + 12, 2, 6);
  ctx.fillRect(x + 8, y + 14, 2, 4);
  
  ctx.fillRect(x + 28, y + 24, 2, 5);
  ctx.fillRect(x + 30, y + 26, 2, 3);
};

// Vẽ đường đất cát màu vàng sáng (Dirt/Path Tile)
const drawDirtTile = (ctx, x, y) => {
  ctx.fillStyle = "#ebd5a3";
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

  // Hạt cát trang trí
  ctx.fillStyle = "#dfc894";
  ctx.fillRect(x + 12, y + 10, 3, 2);
  ctx.fillRect(x + 24, y + 28, 2, 2);
};

// Vẽ hồ nước xanh ngọc (Water Tile)
const drawWaterTile = (ctx, x, y) => {
  ctx.fillStyle = "#4a90e2";
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

  // Sóng nước chuyển động
  const offset = Math.round(Math.sin(Date.now() * 0.003 + (x + y)) * 3);
  ctx.fillStyle = "#63a0e6";
  ctx.fillRect(x + 8 + offset, y + 14, 15, 2);
  ctx.fillRect(x + 20 - offset, y + 28, 10, 2);
};

// Vẽ bản đồ gạch RPG tươi sáng (Retro Bright Tilemap)
export const drawMap = (ctx, cameraX, cameraY, canvasWidth, canvasHeight) => {
  ctx.imageSmoothingEnabled = false;

  // Tính toán vùng gạch cần vẽ trong viewport camera để tăng hiệu năng (Culling)
  const startCol = Math.floor(cameraX / TILE_SIZE);
  const endCol = Math.ceil((cameraX + canvasWidth) / TILE_SIZE);
  const startRow = Math.floor(cameraY / TILE_SIZE);
  const endRow = Math.ceil((cameraY + canvasHeight) / TILE_SIZE);

  ctx.save();
  ctx.translate(-cameraX, -cameraY); // Áp dụng vị trí camera để cuộn màn hình

  // 1. Vẽ toàn bộ gạch cỏ và lối đi
  for (let col = startCol; col <= endCol; col++) {
    for (let row = startRow; row <= endRow; row++) {
      const x = col * TILE_SIZE;
      const y = row * TILE_SIZE;

      if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) continue;

      // Xác định lối đi đất màu cát vàng giống demo
      const isPathX = x >= 600 && x <= 1000;
      const isPathY = y >= 400 && y <= 800;
      const isCornerPath = (x >= 500 && x <= 1100 && y >= 360 && y <= 840);

      if (isPathX || isPathY || isCornerPath) {
        drawDirtTile(ctx, x, y);
      } else {
        drawGrassTile(ctx, x, y);
      }
    }
  }

  // 2. Vẽ hồ nước xanh ngọc
  const ponds = [
    { x: 520, y: 200, width: 80, height: 240 },
    { x: 1000, y: 200, width: 80, height: 240 },
    { x: 520, y: 760, width: 80, height: 240 }
  ];
  ponds.forEach((pond) => {
    for (let px = pond.x; px < pond.x + pond.width; px += TILE_SIZE) {
      for (let py = pond.y; py < pond.y + pond.height; py += TILE_SIZE) {
        if (px >= cameraX - TILE_SIZE && px <= cameraX + canvasWidth + TILE_SIZE &&
            py >= cameraY - TILE_SIZE && py <= cameraY + canvasHeight + TILE_SIZE) {
          drawWaterTile(ctx, px, py);
        }
      }
    }
  });

  // 3. Vẽ hàng rào gỗ ngăn cách ranh giới hồ nước
  ponds.forEach((pond) => {
    // Vẽ hàng rào ở biên của hồ
    for (let px = pond.x - TILE_SIZE; px <= pond.x + pond.width; px += TILE_SIZE) {
      drawFence(ctx, px, pond.y - TILE_SIZE);
      drawFence(ctx, px, pond.y + pond.height);
    }
  });

  // 4. Vẽ các chướng ngại vật (Tòa nhà mái ngói gạch tươi sáng)
  OBSTACLES.forEach((obs) => {
    if (obs.type === "tree_wall") return; // Vẽ tường cây ở bước sau

    // Vẽ bóng đổ ngôi nhà
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    
    // Tường nhà màu vàng kem nhạt (Mộc mạc, giống demo)
    ctx.fillStyle = "#fcf3e3";
    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    
    // Vẽ cửa ra vào bằng gỗ
    ctx.fillStyle = "#8a5233";
    ctx.fillRect(obs.x + obs.width / 2 - 20, obs.y + obs.height - 35, 40, 35);
    
    // Cửa sổ kính nhỏ xinh xắn
    ctx.fillStyle = "#e3f2fd";
    ctx.strokeStyle = "#5c3d28";
    ctx.lineWidth = 2;
    ctx.fillRect(obs.x + 30, obs.y + 40, 30, 25);
    ctx.strokeRect(obs.x + 30, obs.y + 40, 30, 25);
    ctx.fillRect(obs.x + obs.width - 60, obs.y + 40, 30, 25);
    ctx.strokeRect(obs.x + obs.width - 60, obs.y + 40, 30, 25);

    // Mái ngói đỏ gạch / xanh lá bo tròn xếp lớp
    ctx.fillStyle = obs.color;
    ctx.beginPath();
    ctx.moveTo(obs.x - 12, obs.y + 10);
    ctx.lineTo(obs.x + obs.width / 2, obs.y - 30); // Đỉnh mái cao
    ctx.lineTo(obs.x + obs.width + 12, obs.y + 10);
    ctx.closePath();
    ctx.fill();
    
    // Viền mái nhà phát sáng nhẹ
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();

    // Tên tòa nhà
    ctx.fillStyle = "#333333";
    ctx.font = "bold 12px 'Outfit', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(obs.label, obs.x + obs.width / 2, obs.y + obs.height - 45);
  });

  // 5. Vẽ các hàng cây thông xanh bao phủ biên bản đồ (Thay thế tường đá)
  for (let col = startCol; col <= endCol; col++) {
    const x = col * TILE_SIZE;
    // Tường trên và tường dưới
    drawTree(ctx, x, 0);
    drawTree(ctx, x, WORLD_HEIGHT - TILE_SIZE);
  }
  for (let row = startRow; row <= endRow; row++) {
    const y = row * TILE_SIZE;
    // Tường trái và tường phải
    drawTree(ctx, 0, y);
    drawTree(ctx, WORLD_WIDTH - TILE_SIZE, y);
  }

  ctx.restore();
};

// Vẽ nhân vật Chibi tóc vàng pixel giống y hệt cô gái trong demo phaser-rpg!
export const drawPlayerSprite = (ctx, x, y, size, name, isMe, direction, isBankrupt, color = "#ff5722", cameraX, cameraY) => {
  const time = Date.now() * 0.008;
  const bobY = !isBankrupt ? Math.sin(time) * 2.5 : 0;
  
  // Tính tọa độ vẽ tương đối theo camera
  const rx = x - cameraX;
  const ry = y - cameraY + bobY;
  
  const centerX = rx + size / 2;
  const centerY = ry + size / 2;
  const radius = size / 2;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // 1. Bóng đổ dưới chân
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.beginPath();
  ctx.ellipse(rx + size / 2, ry + size - bobY - 1, radius * 0.7, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Thân váy áo Chibi (Màu vàng/cam giống cô gái trong demo)
  const bodyColor = isBankrupt ? "#5c544a" : (isMe ? "#ffe082" : color);
  ctx.fillStyle = bodyColor;
  ctx.strokeStyle = "#4e3629";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(rx + 3, ry + radius - 2, size - 6, radius + 2, 4) : ctx.rect(rx + 3, ry + radius - 2, size - 6, radius + 2);
  ctx.fill();
  ctx.stroke();

  // 3. Đầu (Da màu hồng kem mịn)
  ctx.fillStyle = "#ffecd9";
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(rx + 5, ry - 3, size - 10, radius + 3, 5) : ctx.rect(rx + 5, ry - 3, size - 10, radius + 3);
  ctx.fill();
  ctx.stroke();

  // 4. Mái tóc vàng óng của cô gái RPG (WOW factor - giống hệt demo!)
  ctx.fillStyle = isMe ? "#ffd54f" : "#a1887f"; // Tóc vàng hoặc nâu hạt dẻ
  ctx.beginPath();
  // Vẽ các lọn tóc bao quanh đầu
  ctx.roundRect ? ctx.roundRect(rx + 3, ry - 7, size - 6, 12, 4) : ctx.rect(rx + 3, ry - 7, size - 6, 12);
  ctx.fill();
  ctx.stroke();

  // Tóc hai bên má
  ctx.fillRect(rx + 2, ry, 4, 12);
  ctx.fillRect(rx + size - 6, ry, 4, 12);

  // 5. Cặp tai nghe màu đen dễ thương trên đầu (Headphone giống demo!)
  ctx.fillStyle = "#212121";
  ctx.beginPath();
  ctx.arc(rx + 4, ry + 2, 3, 0, Math.PI * 2); // Tai nghe trái
  ctx.arc(rx + size - 4, ry + 2, 3, 0, Math.PI * 2); // Tai nghe phải
  ctx.fill();
  // Vòng nối tai nghe qua đầu
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "#212121";
  ctx.beginPath();
  ctx.arc(centerX, ry - 4, radius - 2, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();

  // 6. Vẽ khuôn mặt Chibi thương hiệu
  ctx.fillStyle = "#3e2723"; // Màu mắt nâu đậm
  const eyeY = ry + 4;
  if (direction === "down") {
    ctx.fillRect(rx + 8, eyeY, 2.5, 3);
    ctx.fillRect(rx + size - 10.5, eyeY, 2.5, 3);
    // Miệng mỉm cười đỏ hồng dễ thương
    ctx.strokeStyle = "#ff8a80";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY + 3, 2, 0, Math.PI);
    ctx.stroke();
  } else if (direction === "left") {
    ctx.fillRect(rx + 6, eyeY, 2.5, 3);
  } else if (direction === "right") {
    ctx.fillRect(rx + size - 8.5, eyeY, 2.5, 3);
  }

  // 7. Hoạt ảnh đi bộ bước chân
  if (!isBankrupt) {
    ctx.fillStyle = "#4e3629";
    const walkSwing = Math.sin(time) * 3;
    ctx.fillRect(rx + 7, ry + size - bobY - 3, 4, 4); // Chân trái
    ctx.fillRect(rx + size - 11, ry + size - bobY - 3 - walkSwing, 4, 4); // Chân phải
  }

  // 8. Tên người chơi
  const displayName = isMe ? `${name} (Tôi)` : name;
  ctx.font = "bold 9px 'Outfit', sans-serif";
  ctx.textAlign = "center";
  
  const textWidth = ctx.measureText(displayName).width;
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(centerX - textWidth / 2 - 4, ry - 21, textWidth + 8, 12, 3) : ctx.rect(centerX - textWidth / 2 - 4, ry - 21, textWidth + 8, 12);
  ctx.fill();
  
  ctx.strokeStyle = isMe ? "#ffd54f" : "rgba(0, 0, 0, 0.15)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#333333";
  ctx.fillText(displayName, centerX, y - cameraY - 12 + bobY);

  if (isBankrupt) {
    ctx.fillStyle = "#d32f2f";
    ctx.font = "bold 8px 'Outfit', sans-serif";
    ctx.fillText("💀 PHÁ SẢN", centerX, ry + size + 12);
  }

  ctx.restore();
};
