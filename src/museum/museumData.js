/**
 * Museum Data — Sảnh trung tâm + 3 phòng nhánh (Trái / Giữa / Phải)
 *
 * Layout (top-down, z- is "forward/north"):
 *
 *                    ┌──────────────┐
 *                    │  PHÒNG GIỮA  │  z = -14 to -24
 *                    │  (center)    │
 *                    └──────┬───────┘
 *                           │
 *   ┌────────────┐   ┌──────┴───────┐   ┌────────────┐
 *   │ PHÒNG TRÁI │───│    SẢNH      │───│ PHÒNG PHẢI │
 *   │ x = -16    │   │  (lobby)     │   │  x = +16   │
 *   └────────────┘   └──────────────┘   └────────────┘
 *                     Camera starts here
 */

// Room dimensions
export const LOBBY_SIZE = { w: 20, d: 14, h: 6 };
export const ROOM_SIZE = { w: 12, d: 10, h: 6 };
export const HALLWAY_W = 4; // corridor width connecting rooms

// Room center positions
export const LOBBY_POS = [0, 0, 0];
export const ROOM_LEFT_POS = [-16, 0, 0];
export const ROOM_CENTER_POS = [0, 0, -19];
export const ROOM_RIGHT_POS = [16, 0, 0];

const rawRooms = [
  {
    id: "constitutional-legal",
    title: "SỰ TRỖI DẬY CỦA NHỮNG NGƯỜI KHỔNG LỒ",
    shortTitle: "SỰ TRỖI DẬY CỦA NHỮNG NGƯỜI KHỔNG LỒ",
    accent: "#C5272D",
    position: ROOM_LEFT_POS,
    direction: "left",
    walls: [
      {
        id: "room1-left",
        type: "theory",
        wall: "left",
        title: "Cơ sở lý thuyết",
        heading: "Quy luật độc quyền",
        description: "Cạnh tranh tự do dẫn đến tập trung sản xuất — khi vốn tích lũy đủ lớn, doanh nghiệp thống lĩnh thị trường và hình thành độc quyền. Thị trường gọi xe công nghệ tại Việt Nam là minh chứng sống động cho quy luật này.",
        // visitor-left wall when entering from the lobby (south wall, facing -z)
        position: [-16, 3, 4.9],
        rotation: [0, Math.PI, 0],
        images: [
          "/museum/trienlam/p1_left.png"
        ],
        w: 1.92,
        h: 2.4
      },
      {
        id: "room1-center",
        type: "practice",
        wall: "center",
        title: "Liên hệ thực tiễn",
        heading: "Grab vs Xanh SM",
        description: "Grab nắm giữ ~60% thị phần gọi xe Việt Nam. Xanh SM gia nhập cuối 2023 với chiến lược đốt vốn, nhưng cạnh tranh với kẻ đã độc quyền dữ liệu và hệ sinh thái là cuộc chiến không cân sức.",
        // back wall of left room (west wall, facing +x)
        position: [-21.9, 3, 0],
        rotation: [0, Math.PI / 2, 0],
        images: [
          "/museum/trienlam/p1_center.png"
        ],
        w: 2.6,
        h: 1.356
      },
      {
        id: "room1-right",
        type: "application",
        wall: "right",
        title: "Giá trị vận dụng",
        heading: "Sự rút lui của Gojek",
        description: "Gojek — 'kỳ lân' Indonesia — rút khỏi Việt Nam năm 2023 sau khi không thể phá vỡ thế độc quyền của Grab. Khi rào cản gia nhập quá cao, ngay cả đối thủ tỷ đô cũng phải bỏ cuộc.",
        // visitor-right wall when entering from the lobby (north wall, facing +z)
        position: [-16, 3, -4.9],
        rotation: [0, 0, 0],
        images: [
          "/museum/trienlam/p1_right.png"
        ],
        w: 1.92,
        h: 2.4
      }
    ]
  },
  {
    id: "law-supremacy",
    title: "XIỀNG XÍCH VÔ HÌNH",
    shortTitle: "XIỀNG XÍCH VÔ HÌNH",
    accent: "#C5A028",
    position: ROOM_CENTER_POS,
    direction: "center",
    walls: [
      {
        id: "room2-left",
        type: "theory",
        wall: "left",
        title: "Cơ sở lý thuyết",
        heading: "Tích lũy & Tập trung",
        description: "Tích lũy tư bản và tập trung sản xuất là hai mặt của quá trình hình thành độc quyền. Trong thương mại điện tử, dữ liệu người dùng chính là 'tư bản' được tích lũy vô hình.",
        // left wall of center room (facing +x)
        position: [-5.9, 3, -19],
        rotation: [0, Math.PI / 2, 0],
        images: [
          "/museum/trienlam/p2_left.png"
        ],
        w: 1.8,
        h: 2.4
      },
      {
        id: "room2-center",
        type: "practice",
        wall: "center",
        title: "Liên hệ thực tiễn",
        heading: "Shopee & TikTok Shop",
        description: "Shopee thống lĩnh TMĐT Đông Nam Á bằng chiến lược trợ giá khổng lồ. TikTok Shop tấn công bằng livestream commerce — nhưng cả hai đều dùng chung một vũ khí: đốt tiền để loại bỏ đối thủ nhỏ.",
        // back wall of center room (facing +z)
        position: [0, 3, -23.9],
        rotation: [0, 0, 0],
        images: [
          "/museum/trienlam/p2_center.png"
        ],
        w: 2.6,
        h: 1.15
      },
      {
        id: "room2-right",
        type: "application",
        wall: "right",
        title: "Giá trị vận dụng",
        heading: "Bóp nghẹt doanh nghiệp nội",
        description: "Khi sàn TMĐT ngoại chiếm ưu thế, hàng ngàn doanh nghiệp nội địa trở thành 'người thuê sạp' trên chính thị trường của mình — phải trả phí hoa hồng, phí quảng cáo ngày càng tăng.",
        // right wall of center room (facing -x)
        position: [5.9, 3, -19],
        rotation: [0, -Math.PI / 2, 0],
        images: [
          "/museum/trienlam/p2_right.png"
        ],
        w: 1.8,
        h: 2.4
      }
    ]
  },
  {
    id: "humanistic-rule",
    title: "PHÍA SAU BỨC MÀN NHUNG",
    shortTitle: "PHÍA SAU BỨC MÀN NHUNG",
    accent: "#6F8F4E",
    position: ROOM_RIGHT_POS,
    direction: "right",
    walls: [
      {
        id: "room3-left",
        type: "theory",
        wall: "left",
        title: "Góc nhìn biện chứng",
        heading: "Tài xế công nghệ",
        description: "Bề nổi: Tài xế công nghệ là 'đối tác tự do'. Bản chất: Họ bị ràng buộc bởi thuật toán, chịu phạt nếu từ chối cuốc xe — một hình thức lao động phụ thuộc được ngụy trang dưới lớp vỏ công nghệ.",
        // visitor-left wall when entering from the lobby (north wall, facing +z)
        position: [16, 3, -4.9],
        rotation: [0, 0, 0],
        images: [
          "/museum/trienlam/p3_left.png"
        ],
        w: 1.92,
        h: 2.4
      },
      {
        id: "room3-center",
        type: "practice",
        wall: "center",
        title: "Góc nhìn biện chứng",
        heading: "Nhà bán hàng nhỏ lẻ",
        description: "Bề nổi: Sàn TMĐT 'hỗ trợ' người bán nhỏ tiếp cận hàng triệu khách. Bản chất: Phí sàn, flash sale ép giá, thuật toán ưu tiên hàng giá rẻ — khiến lợi nhuận thực tế gần bằng không.",
        // back wall of right room (east wall, facing -x)
        position: [21.9, 3, 0],
        rotation: [0, -Math.PI / 2, 0],
        images: [
          "/museum/trienlam/p3_center.png"
        ],
        w: 2.6,
        h: 1.29
      },
      {
        id: "room3-right",
        type: "application",
        wall: "right",
        title: "Góc nhìn biện chứng",
        heading: "Người tiêu dùng",
        description: "Bề nổi: Người tiêu dùng hưởng lợi từ giá rẻ, miễn phí vận chuyển. Bản chất: Dữ liệu cá nhân bị thu thập, hành vi mua sắm bị điều khiển bởi thuật toán — bạn không chọn sản phẩm, sản phẩm chọn bạn.",
        // visitor-right wall when entering from the lobby (south wall, facing -z)
        position: [16, 3, 4.9],
        rotation: [0, Math.PI, 0],
        images: [
          "/museum/trienlam/p3_right.png"
        ],
        w: 1.92,
        h: 2.4
      }
    ]
  }
];

const panelCopyLabels = ["Tư liệu I", "Tư liệu II", "Tư liệu III", "Tư liệu IV"];

// Map images to walls
export const museumRooms = rawRooms.map(room => {
  const expandedWalls = [];
  room.walls.forEach(wall => {
    const images = wall.images || [];
    const count = images.length;
    
    // Calculate offsets based on count to center them on the wall
    const spacing = 3.4; // Distance between frames
    const startOffset = -((count - 1) * spacing) / 2;

    for (let i = 0; i < count; i++) {
      let newPos = [...wall.position];
      const isFacingX = Math.abs(Math.cos(wall.rotation[1])) < 0.01;
      
      const offset = startOffset + i * spacing;

      if (isFacingX) {
        newPos[2] -= offset * Math.sin(wall.rotation[1]); 
      } else {
        newPos[0] += offset * Math.cos(wall.rotation[1]); 
      }

      expandedWalls.push({
        ...wall,
        id: `${wall.id}-${i + 1}`,
        title: count > 1 ? `${wall.title} - ${panelCopyLabels[i]}` : wall.title,
        sequenceLabel: panelCopyLabels[i],
        position: newPos,
        imageSrc: images[i]
      });
    }
  });
  return { ...room, walls: expandedWalls };
});

export const museumPanels = museumRooms.flatMap((room) =>
  room.walls.map((wall) => ({ ...wall, roomAccent: room.accent, roomTitle: room.title, roomId: room.id }))
);

export const defaultPanel = null;

/**
 * Collision zones — array of AABB boxes {minX, maxX, minZ, maxZ}
 * Player can move freely inside these zones.
 */
export const WALKABLE_ZONES = [
  // Lobby, inset from wall edges so side rooms only connect through door zones.
  { minX: -9.2, maxX: 9.2, minZ: -6.6, maxZ: 6.6 },
  // Left doorway.
  { minX: -10.8, maxX: -9.2, minZ: -1.8, maxZ: 1.8 },
  // Left room.
  { minX: -21.2, maxX: -10.8, minZ: -4.6, maxZ: 4.6 },
  // Center hallway.
  { minX: -1.8, maxX: 1.8, minZ: -14.4, maxZ: -6.4 },
  // Center room (12 wide × 10 deep, centered at 0, -19)
  { minX: -5.6, maxX: 5.6, minZ: -23.6, maxZ: -14.4 },
  // Right doorway.
  { minX: 9.2, maxX: 10.8, minZ: -1.8, maxZ: 1.8 },
  // Right room.
  { minX: 10.8, maxX: 21.2, minZ: -4.6, maxZ: 4.6 },
];
