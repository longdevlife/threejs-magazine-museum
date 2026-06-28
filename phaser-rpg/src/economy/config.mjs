export const ECONOMY_OPPORTUNITIES = {
  order: {
    type: 'order',
    label: 'Đơn hàng mới',
    shortLabel: 'Đơn hàng',
    color: '#2e7d32',
    score: 25,
    capital: 1_000_000,
    message: '+1tr Đơn hàng: cơ hội thị trường còn mở',
    theory: 'Cơ hội thị trường còn phân tán trong giai đoạn cạnh tranh tự do.',
  },
  review: {
    type: 'review',
    label: 'Review 5 sao',
    shortLabel: 'Review',
    color: '#1565c0',
    score: 60,
    capital: 0,
    message: 'Review 5 sao: uy tín giúp shop nhỏ cạnh tranh',
    theory: 'Uy tín giúp shop nhỏ cạnh tranh bằng chất lượng thay vì vốn lớn.',
  },
  loyal_customer: {
    type: 'loyal_customer',
    label: 'Khách quen',
    shortLabel: 'Khách quen',
    color: '#00897b',
    score: 45,
    capital: 700_000,
    message: 'Khách quen: bớt lệ thuộc thuật toán',
    theory:
      'Tự chủ quan hệ khách hàng giúp giảm phụ thuộc vào thuật toán nền tảng.',
  },
  ai_skill: {
    type: 'ai_skill',
    label: 'Kỹ năng AI',
    shortLabel: 'AI',
    color: '#6a1b9a',
    score: 70,
    capital: 300_000,
    message: 'Kỹ năng AI: tăng sức lao động',
    theory: 'Nâng cao chất lượng sức lao động để tăng vị thế thương lượng.',
  },
  niche_market: {
    type: 'niche_market',
    label: 'Thị trường ngách',
    shortLabel: 'Ngách',
    color: '#c9922a',
    score: 100,
    capital: 1_500_000,
    message: 'Thị trường ngách: tránh đối đầu độc quyền',
    theory:
      'Khác biệt hóa là chiến lược tránh đối đầu trực diện với độc quyền.',
  },
};

export const ECONOMY_HAZARDS = {
  platform_fee: {
    type: 'platform_fee',
    label: 'Phí sàn',
    shortLabel: 'Phí sàn',
    color: '#c5272d',
    score: -20,
    capital: -700_000,
    effect: 'capital',
    durationMs: 0,
    size: 24,
    message: 'Phí sàn: nền tảng lấy một phần lợi nhuận',
    theory: 'Nền tảng độc quyền áp đặt chi phí lên người bán nhỏ.',
  },
  visibility_squeeze: {
    type: 'visibility_squeeze',
    label: 'Bóp tương tác',
    shortLabel: 'Bóp reach',
    color: '#1565c0',
    score: -35,
    capital: -700_000,
    effect: 'freeze',
    durationMs: 2500,
    size: 28,
    message: 'Bóp tương tác: thuật toán giảm hiển thị',
    theory: 'Thuật toán kiểm soát khả năng tiếp cận khách hàng.',
  },
  voucher_pressure: {
    type: 'voucher_pressure',
    label: 'Voucher bắt buộc',
    shortLabel: 'Voucher',
    color: '#ef6c00',
    score: -30,
    capital: -1_000_000,
    effect: 'capital',
    durationMs: 0,
    size: 30,
    message: 'Voucher bắt buộc: shop gánh chi phí khuyến mãi',
    theory: 'Khuyến mãi của sàn có thể trở thành chi phí bắt buộc của shop.',
  },
  mall_copy: {
    type: 'mall_copy',
    label: 'Mall sao chép',
    shortLabel: 'Mall copy',
    color: '#8e24aa',
    score: -75,
    capital: -3_000_000,
    effect: 'freeze',
    durationMs: 3000,
    size: 42,
    message: 'Mall sao chép: sàn vừa là trọng tài vừa là đối thủ',
    theory: 'Nền tảng dùng dữ liệu lớn để chèn ép shop nhỏ.',
  },
  monopoly_price: {
    type: 'monopoly_price',
    label: 'Giá độc quyền',
    shortLabel: 'Giá ĐQ',
    color: '#3d3529',
    score: -55,
    capital: -2_000_000,
    effect: 'capital',
    durationMs: 0,
    size: 36,
    message: 'Giá độc quyền: luật chơi bị áp đặt',
    theory: 'Giá cả độc quyền chuyển lợi ích về phía tập đoàn lớn.',
  },
};

export const MARKET_EVENTS = {
  flash_sale: {
    type: 'flash_sale',
    hostLabel: 'Tung Flash Sale',
    mapLabel: 'Flash Sale',
    opportunityType: 'order',
    count: 8,
    ttlMs: 12_000,
  },
  review_wave: {
    type: 'review_wave',
    hostLabel: 'Mở Review Wave',
    mapLabel: 'Review Wave',
    opportunityType: 'review',
    count: 6,
    ttlMs: 12_000,
  },
  loyal_customer_drop: {
    type: 'loyal_customer_drop',
    hostLabel: 'Thả Khách Quen',
    mapLabel: 'Khách Quen',
    opportunityType: 'loyal_customer',
    count: 5,
    ttlMs: 12_000,
  },
};

export const PHASE_ECONOMY_MIX = {
  phase_1: {
    mission: 'Kiếm đủ 5 đơn hàng và 2 review. Thiếu một trong hai sẽ bị loại.',
    learningMeaning:
      'Cơ hội còn mở. Shop nhỏ vẫn có đất sống trong giai đoạn cạnh tranh tự do.',
    recap:
      'Bạn vừa thấy cạnh tranh tự do: cơ hội nhiều, shop nhỏ dễ tích lũy vốn và uy tín.',
    progressGoals: [
      { type: 'order', target: 5, label: 'Don hang' },
      { type: 'review', target: 2, label: 'Review' },
    ],
    maxOpportunities: 10,
    hazardCount: 2,
    hazardSpeed: 2,
    opportunityScale: 1,
    hazardScale: 1,
    preferredZones: ['central_market_path', 'shop_row_left'],
    opportunities: [
      { type: 'order', weight: 5 },
      { type: 'review', weight: 3 },
      { type: 'loyal_customer', weight: 2 },
      { type: 'ai_skill', weight: 1 },
    ],
    hazards: [
      { type: 'platform_fee', weight: 1 },
      { type: 'visibility_squeeze', weight: 1 },
    ],
  },
  phase_2: {
    mission:
      'Tìm Khách Ruột đang ẩn trên bản đồ trong 60 giây.',
    learningMeaning:
      'Khi nền tảng nắm quyền, shop nhỏ không làm sai vẫn mất tiền vì luật chơi bị áp đặt. Khách ruột là tài sản sống còn.',
    recap:
      'Bạn vừa thấy quyền lực nền tảng: phí sàn, voucher và thuật toán làm shop nhỏ mất lợi nhuận. Khách ruột và quan hệ trực tiếp là cách sống sót.',
    progressGoals: [
      { type: 'loyal_customer_found', target: 1, label: 'Khach ruot' },
    ],
    maxOpportunities: 6,
    hazardCount: 4,
    hazardSpeed: 2.2,
    opportunityScale: 0.7,
    hazardScale: 1.1,
    preferredZones: ['central_market_path', 'platform_gate'],
    opportunities: [
      { type: 'order', weight: 2 },
      { type: 'review', weight: 2 },
      { type: 'loyal_customer', weight: 3 },
      { type: 'ai_skill', weight: 2 },
    ],
    hazards: [
      { type: 'platform_fee', weight: 3 },
      { type: 'visibility_squeeze', weight: 3 },
      { type: 'voucher_pressure', weight: 2 },
    ],
  },
  phase_3: {
    mission:
      'Chạy tới Cổng Thoát để rời khỏi sự phụ thuộc nền tảng.',
    learningMeaning:
      'Đối đầu đốt tiền với độc quyền rất dễ cạn vốn. Cổng thoát đại diện cho việc xây kênh riêng, khách hàng riêng, và năng lực độc lập ngoài nền tảng.',
    recap:
      'Bạn vừa thấy cạnh tranh trong độc quyền: tiếp tục phụ thuộc nền tảng không phải chiến lược bền vững. Cổng thoát là xây kênh riêng, khách riêng và năng lực độc lập.',
    progressGoals: [
      { type: 'escaped_gate', target: 1, label: 'Cong thoat' },
    ],
    maxOpportunities: 4,
    hazardCount: 6,
    hazardSpeed: 2.6,
    opportunityScale: 0.55,
    hazardScale: 1.25,
    preferredZones: ['niche_corner', 'mall_shadow'],
    opportunities: [
      { type: 'loyal_customer', weight: 3 },
      { type: 'ai_skill', weight: 2 },
      { type: 'niche_market', weight: 4 },
      { type: 'order', weight: 1 },
    ],
    hazards: [
      { type: 'platform_fee', weight: 2 },
      { type: 'visibility_squeeze', weight: 2 },
      { type: 'mall_copy', weight: 3 },
      { type: 'monopoly_price', weight: 2 },
    ],
  },
};

export const getOpportunityDefinition = (type) =>
  ECONOMY_OPPORTUNITIES[type] || ECONOMY_OPPORTUNITIES.order;

export const getHazardDefinition = (type) =>
  ECONOMY_HAZARDS[type] || ECONOMY_HAZARDS.platform_fee;

export const scaleDelta = (value, scale) => Math.round(value * scale);
