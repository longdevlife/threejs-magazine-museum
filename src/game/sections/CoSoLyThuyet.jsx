export default function CoSoLyThuyet() {
  const f1 = "'Playfair Display', serif";
  const f2 = "'Inter', sans-serif";

  const characteristics = [
    { t: "39.85%", i: "Xanh SM dẫn đầu" },
    { t: "35.57%", i: "Grab bám đuổi" },
    { t: "-32.1%", i: "Giao dịch Tiki" },
    { t: "-65.3%", i: "Giao dịch Sendo" },
  ];

  return (
    <section
      id="co-so-ly-thuyet"
      className="relative w-full bg-[#E5E0D8] px-4 py-32 md:py-40 overflow-hidden"
    >
      {/* Header */}
      <div className="w-full max-w-7xl mx-auto mb-24 md:mb-32">
        <div className="gsap-reveal flex items-center gap-3 mb-6">
          <div className="h-[1px] w-12 bg-[#3D3529]/15 gsap-line-draw" />
          <span
            className="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#7A6040]"
            style={{ fontFamily: f2 }}
          >
            Phần 2
          </span>
        </div>
        <h2
          className="text-5xl md:text-7xl font-bold tracking-tight text-[#3D3529] mb-8 leading-snug"
          style={{ fontFamily: f1 }}
        >
          <span className="gsap-text-reveal block pb-2 md:pb-3">Tiêu Điểm</span>
          <span className="gsap-text-reveal block italic font-light text-[#7A6040] pt-1">
            Thực Tiễn
          </span>
        </h2>
        <p
          className="gsap-reveal text-lg text-[#7A6040] max-w-2xl leading-relaxed font-light"
          style={{ fontFamily: f2 }}
        >
          Trong nền kinh tế số hiện nay, cạnh tranh không còn là sân chơi tự do của những chủ thể nhỏ lẻ. Thị trường đã dịch chuyển thành cục diện Độc quyền tập đoàn (Oligopoly) – nơi các siêu nền tảng nắm quyền chi phối tuyệt đối.
        </p>
      </div>

      {/* 2 Levels — Scale-in cards */}
      <div className="w-full max-w-7xl mx-auto mb-32">
        <div className="gsap-reveal flex items-center gap-4 mb-16">
          <span
            className="text-sm tracking-[0.25em] text-[#7A6040]/60 uppercase font-semibold"
            style={{ fontFamily: f2 }}
          >
            Thực Trạng Thị Trường
          </span>
          <div className="h-[1px] flex-1 bg-[#3D3529]/10 gsap-line-draw" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Card 1: Gọi xe công nghệ */}
          <div className="gsap-slide-left card-tilt group">
            <div className="h-full p-8 md:p-10 bg-white/50 rounded-[20px] border border-[#3D3529]/5 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(61,53,41,0.08)]">
              <span
                className="text-[10px] uppercase tracking-[0.2em] text-[#7A6040]/50 mb-6 block font-semibold"
                style={{ fontFamily: f2 }}
              >
                Cán cân dịch chuyển
              </span>
              <h3
                className="text-3xl font-bold text-[#3D3529] mb-3"
                style={{ fontFamily: f1 }}
              >
                Gọi Xe Công Nghệ
              </h3>
              <span
                className="text-[#C5A028] text-sm font-medium mb-6 block italic"
                style={{ fontFamily: f1 }}
              >
                Thị phần Q1/2025 & Sự thanh lọc khốc liệt
              </span>
              <p
                className="text-[#7A6040] text-base leading-relaxed font-light mb-8"
                style={{ fontFamily: f2 }}
              >
                Thị trường ghi nhận sự bứt phá thần tốc của tân binh xe điện Xanh SM khi vươn lên dẫn đầu với 39,85% thị phần. Grab bị đẩy xuống vị trí thứ hai với 35,57%. Cạnh tranh xuống đáy bằng đại hạ giá đã kết thúc, Gojek ngậm ngùi rút lui hoàn toàn khỏi Việt Nam vào cuối năm 2024.
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Xanh SM 39.85%",
                  "Grab 35.57%",
                  "Gojek rút lui",
                  "Cạnh tranh khốc liệt",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-xs text-[#7A6040] bg-[#EDE8E1] rounded-full border border-[#3D3529]/5"
                    style={{ fontFamily: f2 }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Thương Mại Điện Tử */}
          <div className="gsap-slide-right card-tilt group">
            <div className="h-full p-8 md:p-10 bg-[#3D3529] rounded-[20px] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(61,53,41,0.2)]">
              <span
                className="text-[10px] uppercase tracking-[0.2em] text-[#C5A028]/80 mb-6 block font-semibold"
                style={{ fontFamily: f2 }}
              >
                Sự nuốt chửng quy mô
              </span>
              <h3
                className="text-3xl font-bold text-[#EDE8E1] mb-3"
                style={{ fontFamily: f1 }}
              >
                Thương Mại Điện Tử
              </h3>
              <span
                className="text-[#C5A028] text-sm font-medium mb-6 block italic"
                style={{ fontFamily: f1 }}
              >
                Shopee & TikTok Shop áp đảo tuyệt đối
              </span>
              <p
                className="text-[#EDE8E1]/70 text-base leading-relaxed font-light mb-8"
                style={{ fontFamily: f2 }}
              >
                Sân chơi thương mại điện tử Việt Nam nằm trọn trong tay các thế lực độc quyền nhóm khổng lồ. Sự bành trướng này bóp nghẹt các sàn thuần Việt, khiến dòng vốn và cơ hội của doanh nghiệp trong nước bị tổn hại nghiêm trọng (lượng giao dịch của Tiki sụt giảm 32,1% và Sendo rơi tự do tới 65,3%).
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Shopee & TikTok Shop",
                  "Tiki sụt 32.1%",
                  "Sendo rơi 65.3%",
                  "Độc quyền nhóm",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-xs text-[#C5A028] bg-[#C5A028]/10 rounded-full border border-[#C5A028]/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {/* Card 3: Học thuật gọi xe */}
          <div className="gsap-slide-left card-tilt group">
            <div className="h-full p-8 md:p-10 bg-white/50 rounded-[20px] border border-[#3D3529]/5 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(61,53,41,0.08)]">
              <h3
                className="text-3xl font-bold text-[#3D3529] mb-6"
                style={{ fontFamily: f1 }}
              >
                Nhận Thức Học Thuật (Gọi Xe)
              </h3>
              <p
                className="text-[#7A6040] text-base leading-relaxed font-light mb-8"
                style={{ fontFamily: f2 }}
              >
                Độc quyền sinh ra từ cạnh tranh tự do, nhưng nó không thủ tiêu cạnh tranh mà làm cho cạnh tranh trở nên đa dạng, gay gắt và có sức tàn phá to lớn hơn trong việc phân phối lợi ích kinh tế.
              </p>
              <div className="pl-6 border-l-2 border-[#C5A028]">
                <p
                  className="gsap-quote-highlight text-[#3D3529]/90 italic font-medium"
                  style={{
                    fontFamily: f1,
                    backgroundImage:
                      "linear-gradient(to right, rgba(197,160,40,0.12), rgba(197,160,40,0.12))",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "100% 100%",
                    backgroundPosition: "0 0",
                    padding: "0.2em 0",
                  }}
                >
                  "Độc quyền không loại bỏ cạnh tranh, mà tồn tại bên trên và bên cạnh nó, sinh ra những mâu thuẫn hết sức gay gắt."
                </p>
              </div>
            </div>
          </div>

          {/* Card 4: Học thuật TMĐT */}
          <div className="gsap-slide-right card-tilt group">
            <div className="h-full p-8 md:p-10 bg-[#C5A028] rounded-[20px] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(197,160,40,0.3)]">
              <h3
                className="text-3xl font-bold text-white mb-6"
                style={{ fontFamily: f1 }}
              >
                Tích Lũy & Tập Trung Tư Bản
              </h3>
              <p
                className="text-white/90 text-base leading-relaxed font-light"
                style={{ fontFamily: f2 }}
              >
                Cạnh tranh khốc liệt buộc các nhà tư bản phải liên tục tích lũy để tăng quy mô. Quá trình tích tụ và tập trung này làm cho các nhà tư bản vừa và nhỏ bị phá sản hoặc bị thâu tóm, còn các tập đoàn lớn phát tài nhanh chóng với số tư bản tập trung ngày càng to lớn.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Characteristics — Domino stagger effect */}
      <div className="w-full max-w-7xl mx-auto">
        <div className="gsap-reveal flex items-center justify-center gap-4 mb-16">
          <div className="h-[1px] w-12 bg-[#3D3529]/15 gsap-line-draw" />
          <span
            className="text-sm tracking-[0.25em] text-[#7A6040]/60 uppercase font-semibold"
            style={{ fontFamily: f2 }}
          >
            Những Con Số Biết Nói
          </span>
          <div className="h-[1px] w-12 bg-[#3D3529]/15 gsap-line-draw" />
        </div>
        <div className="gsap-stagger-parent grid grid-cols-2 md:grid-cols-4 gap-4">
          {characteristics.map((item) => (
            <div
              key={item.t}
              className="gsap-stagger-child card-tilt flex flex-col items-center justify-center p-6 bg-white/50 rounded-[16px] border border-[#3D3529]/5 hover:bg-white hover:shadow-sm transition-all duration-300 group"
            >
              <span
                className="text-lg font-light text-[#C5A028] mb-2"
                style={{ fontFamily: f1 }}
              >
                {item.t}
              </span>
              <span
                className="text-[#3D3529] text-sm font-medium text-center"
                style={{ fontFamily: f2 }}
              >
                {item.i}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
