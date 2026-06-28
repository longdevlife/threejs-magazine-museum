// 2 Tình huống biểu quyết A/B (kịch bản gốc của nhóm)
export const situations = [
  {
    id: 1,
    title: "Ứng phó với làn sóng tăng phí sàn",
    story:
      "Gian hàng handmade của bạn bắt đầu khởi sắc, đạt cột mốc 500 đơn hàng/tháng. " +
      "Bất ngờ, sàn S thông báo điều chỉnh chính sách: tăng phí xử lý giao dịch lên 6%, " +
      "phí cố định lên 15% và ép buộc bạn phải đăng ký tham gia gói voucher giảm giá 5%. " +
      "Nếu từ chối, thuật toán sẽ bóp giảm hiển thị shop của bạn.",
    optionA: {
      label: "Chấp nhận đóng phí để giữ tương tác",
      consequence:
        "Bạn tiếp tục duy trì được lượng đơn hàng ổn định. Tuy nhiên, sau khi khấu trừ " +
        "tất cả các loại phí sàn tăng thêm, lợi nhuận thực tế thu về chạm đáy, " +
        "thậm chí không đủ chi trả tiền thuê nhà.",
    },
    optionB: {
      label: "Kiên quyết từ chối đóng phí",
      consequence:
        "Hệ thống sàn lập tức bóp nghẹt tương tác, lượng truy cập của shop bị đóng băng, " +
        "đơn hàng rơi thẳng đứng về con số 0.",
    },
    marxLenin:
      "Đây là biểu hiện của quy luật tích tụ và tập trung tư bản: " +
      "Khi sàn TMĐT đã giành được vị thế độc quyền trên thị trường, " +
      "họ sẽ tăng cường bóc lột người sản xuất nhỏ bằng cách áp đặt " +
      "mức phí độc quyền ngày càng cao. Dù chấp nhận hay từ chối, " +
      "người bán nhỏ đều rơi vào thế thua.",
  },
  {
    id: 2,
    title: "Đối đầu trực diện với 'ông lớn' vừa đá bóng vừa thổi còi",
    story:
      "Giữa lúc khó khăn, bạn phát hiện ra gian hàng \"Mall chính hãng\" do chính sàn S " +
      "vận hành đã sao chép nguyên mẫu sản phẩm handmade bán chạy nhất của bạn. " +
      "Họ sản xuất hàng loạt với giá rẻ hơn 20% và luôn được thuật toán ưu tiên " +
      "hiển thị ở vị trí trang đầu.",
    optionA: {
      label: "Hạ giá khô máu để quyết chiến",
      consequence:
        "Bạn nhanh chóng kiệt quệ tài chính và phá sản chỉ sau 3 ngày " +
        "vì không thể đọ lại quy mô vốn và nguồn lực khổng lồ của sàn.",
    },
    optionB: {
      label: "Chuyển hướng sang thị trường ngách (quà cá nhân hóa)",
      consequence:
        "Bạn sống sót thành công và bắt đầu có nguồn lãi ổn định. " +
        "Lý do: Sàn lớn theo đuổi sản xuất đại trà nên không thể vươn tay " +
        "làm thủ công từng sản phẩm cá nhân hóa theo yêu cầu riêng biệt.",
    },
    marxLenin:
      "Đây là mâu thuẫn 'vừa đá bóng vừa thổi còi' của tư bản độc quyền số. " +
      "Sàn vừa là trung gian vừa là đối thủ cạnh tranh trực tiếp, " +
      "kiểm soát cả thuật toán hiển thị lẫn dữ liệu lớn để chèn ép " +
      "và triệt tiêu các đối thủ nhỏ hơn trên chính sân chơi của họ. " +
      "Chiến lược 'thị trường ngách' là cách duy nhất sinh tồn trước độc quyền.",
  },
];

// Cấu hình 3 phase — độ khó tăng dần mô phỏng quá trình kinh tế
export const PHASE_CONFIGS = {
  phase_1: {
    name: "Thị Trường Tự Do",
    emoji: "🌱",
    description: "Phí thấp, cơ hội nhiều — thời kỳ vàng son!",
    mcNarration: "Thị trường còn mở: đơn hàng, review và khách quen xuất hiện nhiều. Hãy tận dụng giai đoạn cạnh tranh tự do để tích lũy vốn!",
    mission: "Kiếm 5 đơn hàng và 2 review tốt trước khi sàn đổi luật.",
    learningMeaning: "Cơ hội còn mở. Shop nhỏ vẫn có đất sống trong giai đoạn cạnh tranh tự do.",
    recap: "Bạn vừa thấy cạnh tranh tự do: cơ hội nhiều, shop nhỏ dễ tích lũy vốn và uy tín.",
    progressGoals: [
      { type: "order", target: 5, label: "Don hang" },
      { type: "review", target: 2, label: "Review" },
    ],
    maxBooks: 10,
    trapCount: 2,
    trapSpeed: 3.5,
    bookReward: { score: 50, capital: 1000000 },
    trapPenalty: { score: -50, capital: -3000000 },
    platformFeeInterval: 0, // Không thu phí
    platformFeeAmount: 0,
  },
  phase_2: {
    name: "Độc Quyền Siết Chặt",
    emoji: "⚠️",
    description: "Sàn nắm thế độc quyền — phí tăng, sách ít đi!",
    mcNarration: "Sàn đã nắm quyền điều phối. Cơ hội ít hơn, phí sàn bắt đầu tự trừ, thuật toán và voucher ép shop nhỏ chia lại lợi nhuận.",
    mission: "Sống sót 60 giây khi phí sàn tự trừ. Tìm khách quen để bớt lệ thuộc vào thuật toán.",
    learningMeaning: "Khi nền tảng nắm quyền, shop nhỏ không làm sai vẫn mất tiền vì luật chơi bị áp đặt.",
    recap: "Bạn vừa thấy quyền lực nền tảng: phí sàn, voucher và thuật toán làm shop nhỏ mất lợi nhuận dù vẫn có đơn hàng.",
    progressGoals: [
      { type: "survive_seconds", target: 60, label: "Song sot" },
      { type: "loyal_customer", target: 3, label: "Khach quen" },
    ],
    maxBooks: 5,
    trapCount: 4,
    trapSpeed: 5.5,
    bookReward: { score: 30, capital: 500000 },
    trapPenalty: { score: -75, capital: -4000000 },
    platformFeeInterval: 10000, // Trừ phí mỗi 10 giây
    platformFeeAmount: 500000,
  },
  phase_3: {
    name: "Sinh Tồn Khốc Liệt",
    emoji: "🔥",
    description: "Bẫy dày đặc, phí sàn x2 — ai sống sót?",
    mcNarration: "Độc quyền bước vào giai đoạn khốc liệt: Mall sao chép, giá độc quyền và thuật toán chèn ép. Muốn sống sót, hãy tìm khách quen và thị trường ngách.",
    mission: "Đừng đối đầu trực diện. Chạy tới Thị trường ngách và giữ khách riêng để sống sót.",
    learningMeaning: "Đối đầu đốt tiền với độc quyền rất dễ cạn vốn. Shop nhỏ phải khác biệt hóa, giữ khách riêng, và nâng kỹ năng.",
    recap: "Bạn vừa thấy cạnh tranh trong độc quyền: đối đầu trực diện với Mall rất khó, con đường sống sót là thị trường ngách, khách riêng và nâng kỹ năng.",
    progressGoals: [
      { type: "niche_market", target: 2, label: "Ngach" },
      { type: "loyal_customer", target: 3, label: "Khach rieng" },
    ],
    maxBooks: 3,
    trapCount: 6,
    trapSpeed: 7.5,
    bookReward: { score: 20, capital: 300000 },
    trapPenalty: { score: -100, capital: -5000000 },
    platformFeeInterval: 8000, // Trừ phí mỗi 8 giây
    platformFeeAmount: 1000000,
  },
};
