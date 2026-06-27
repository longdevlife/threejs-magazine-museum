export default function GiaiPhap() {
  const f1 = "'Playfair Display', serif";
  const f2 = "'Inter', sans-serif";

  const features = [
    { n: '01', t: 'Tài xế công nghệ', s: 'Bề nổi là đối tác tự chủ, nhưng bản chất bị kiểm soát bởi "còng tay thuật toán", chịu mức chiết khấu cực cao từ 27% đến 33%, tự gánh toàn bộ chi phí xăng xe và rủi ro tai nạn.' },
    { n: '02', t: 'Nhà bán hàng nhỏ lẻ', s: 'Bề nổi là khởi nghiệp dễ dàng 0đ, nhưng bản chất gánh chịu chiết khấu thực tế từ 22% đến 23% do các mức phí tăng liên tục, bị sàn cạnh tranh không lành mạnh bằng dữ liệu lớn.' },
    { n: '03', t: 'Người tiêu dùng', s: 'Bề nổi là bạt ngàn mã giảm giá "Sale sập sàn", nhưng bản chất phải chịu mức giá độc quyền cao do shop tăng giá bù chi phí sàn, bị thao túng qua định giá động bất hợp lý.' },
  ];

  const stats = [
    { num: '33', label: 'Chiết khấu tài xế %' },
    { num: '17', label: 'Phí Shopee tối đa %' },
    { num: '23', label: 'Tổng chiết khấu shop %' },
    { num: '6', label: 'Phí xử lý giao dịch %' },
  ];

  return (
    <section id="giai-phap" className="relative w-full bg-[#EDE8E1] px-4 py-32 md:py-40 overflow-hidden">
      {/* Header */}
      <div className="w-full max-w-7xl mx-auto mb-24 md:mb-32">
        <div className="gsap-reveal flex items-center gap-3 mb-6">
          <div className="h-[1px] w-12 bg-[#3D3529]/15 gsap-line-draw" />
          <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#7A6040]" style={{ fontFamily: f2 }}>Phần 3</span>
        </div>
        <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-[#3D3529] mb-8 leading-snug" style={{ fontFamily: f1 }}>
          <span className="gsap-text-reveal block pb-2 md:pb-3">Thành Phần Biện Chứng</span>
          <span className="gsap-text-reveal block italic font-light text-[#7A6040] pt-1">"Bề Nổi" vs "Bản Chất"</span>
        </h2>
        <p className="gsap-reveal text-lg text-[#7A6040] max-w-2xl leading-relaxed font-light" style={{ fontFamily: f2 }}>
          Kinh tế chính trị Mác - Lênin vạch trần ma trận thuật toán số bằng cách bóc tách hai mặt đối lập giữa những gì các tập đoàn độc quyền quảng bá và thực tế kinh tế đang diễn ra.
        </p>
      </div>

      {/* Bento Grid — Entrance from opposite sides */}
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-32 auto-rows-fr">
        {/* Card 1 — Large, slide from left */}
        <div className="gsap-slide-left md:col-span-2 card-tilt group">
          <div className="h-full p-8 md:p-12 bg-white/50 rounded-[20px] border border-[#3D3529]/5 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(61,53,41,0.08)]">
            <h3 className="text-3xl font-bold text-[#3D3529] mb-6" style={{ fontFamily: f1 }}>Nghịch lý "Vừa đá bóng vừa thổi còi"</h3>
            <p className="text-[#7A6040] text-base md:text-lg leading-relaxed font-light mb-8" style={{ fontFamily: f2 }}>
              Sàn độc quyền sở hữu Big Data hành vi người dùng từ các shop nhỏ lẻ. Khi phát hiện ra món hàng bán chạy, sàn tự sản xuất sản phẩm y hệt dán nhãn "Mall chính hãng" của riêng mình, rồi can thiệp thuật toán để tự ưu tiên hiển thị lên đầu trang nhằm triệt hạ và cướp khách của các shop độc lập.
            </p>
            <div className="gsap-stagger-parent grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="gsap-stagger-child p-5 bg-[#EDE8E1] rounded-[16px]">
                <h4 className="font-bold text-[#3D3529] mb-2" style={{ fontFamily: f1 }}>Độc quyền Big Data</h4>
                <p className="text-[#7A6040] text-sm font-light" style={{ fontFamily: f2 }}>Sở hữu thông tin chi tiết về khách hàng, sản phẩm và xu hướng của đối thủ cạnh tranh.</p>
              </div>
              <div className="gsap-stagger-child p-5 bg-[#EDE8E1] rounded-[16px]">
                <h4 className="font-bold text-[#3D3529] mb-2" style={{ fontFamily: f1 }}>Ưu tiên hiển thị</h4>
                <p className="text-[#7A6040] text-sm font-light" style={{ fontFamily: f2 }}>Điều chỉnh thuật toán hiển thị sản phẩm của mình lên đầu trang để bóp nghẹt đối thủ.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2 — Small Dark, slide from right */}
        <div className="gsap-slide-right md:col-span-1 card-tilt group">
          <div className="h-full p-8 md:p-10 bg-[#3D3529] rounded-[20px] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(61,53,41,0.2)]">
            <h3 className="text-2xl md:text-3xl font-bold text-[#EDE8E1] mb-6" style={{ fontFamily: f1 }}>Bóc lột thặng dư số</h3>
            <p className="text-[#EDE8E1]/70 text-base leading-relaxed font-light" style={{ fontFamily: f2 }}>
              Khai thác triệt để sức lao động của tài xế và biên lợi nhuận của nhà bán hàng để làm giàu cho các cổ đông nước ngoài và giới chủ siêu giàu nắm giữ nền tảng.
            </p>
          </div>
        </div>
      </div>

      {/* 3 Biểu hiện — Progressive stagger */}
      <div className="w-full max-w-7xl mx-auto mb-32">
        <div className="gsap-reveal flex items-center justify-center gap-4 mb-16">
          <div className="h-[1px] w-12 bg-[#3D3529]/15 gsap-line-draw" />
          <span className="text-sm tracking-[0.25em] text-[#7A6040]/60 uppercase font-semibold" style={{ fontFamily: f2 }}>03 Góc Nhìn Biện Chứng</span>
          <div className="h-[1px] w-12 bg-[#3D3529]/15 gsap-line-draw" />
        </div>
        <div className="gsap-stagger-parent grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {features.map((item) => (
            <div key={item.n} className="gsap-stagger-child card-tilt group">
              <div className="h-full p-8 border-t border-[#3D3529]/10 transition-colors duration-500 group-hover:border-[#C5A028]">
                <span className="gsap-counter text-4xl font-light text-[#C5A028] mb-6 block" style={{ fontFamily: f1, fontVariantNumeric: 'lining-nums', fontFeatureSettings: '"lnum" 1' }} data-target={parseInt(item.n)}>{item.n}.</span>
                <h4 className="text-xl font-bold text-[#3D3529] mb-4" style={{ fontFamily: f1 }}>{item.t}</h4>
                <p className="text-[#7A6040] text-base leading-relaxed font-light" style={{ fontFamily: f2 }}>{item.s}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Summary — Scale-in */}
      <div className="w-full max-w-7xl mx-auto">
        <div className="gsap-scale-in bg-white/50 rounded-[20px] border border-[#3D3529]/5 p-10 md:p-16">
          <h3 className="gsap-reveal text-center text-sm font-semibold tracking-[0.2em] uppercase text-[#7A6040]/50 mb-16" style={{ fontFamily: f2 }}>Bản Chất Độc Quyền</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
            <div className="gsap-slide-left flex flex-col justify-center">
              <h4 className="text-3xl font-bold text-[#3D3529] mb-6" style={{ fontFamily: f1 }}>Biện Chứng Mác - Lênin</h4>
              <p className="text-[#7A6040] text-base leading-relaxed font-light mb-8" style={{ fontFamily: f2 }}>
                Lý luận về CNTB độc quyền của V.I. Lênin đã chỉ rõ sự chuyển dịch tất yếu từ tự do cạnh tranh sang độc quyền, vạch trần ma trận bóc lột tinh vi của các thế lực kinh tế số.
              </p>
              <div className="space-y-4">
                {['Bóc lột lao động tự do qua Gig Economy.', 'Lạm dụng vị thế thống trị để ép phí.', 'Thao túng hành vi người tiêu dùng.'].map(text => (
                  <div key={text} className="gsap-reveal flex items-start gap-3 text-[#7A6040] font-light" style={{ fontFamily: f2 }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C5A028] mt-2 shrink-0" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="gsap-stagger-parent grid grid-cols-2 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="gsap-stagger-child bg-[#EDE8E1] p-6 rounded-[16px] flex flex-col items-center justify-center text-center transition-all duration-500 hover:bg-[#3D3529] group">
                  <span className="gsap-counter text-4xl font-bold text-[#C5A028] mb-2 group-hover:text-[#C5A028]" style={{ fontFamily: f1, fontVariantNumeric: 'lining-nums', fontFeatureSettings: '"lnum" 1' }} data-target={parseInt(stat.num)}>{stat.num}</span>
                  <span className="text-sm font-medium text-[#7A6040] group-hover:text-[#EDE8E1]/70 transition-colors duration-500" style={{ fontFamily: f2 }}>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
