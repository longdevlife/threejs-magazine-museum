export default function DatVanDe() {
  const elements = [
    { n: '01', t: 'Tập trung sản xuất', s: 'Quy luật tất yếu khi cạnh tranh tự do buộc các chủ thể không ngừng tích tụ tư bản để mở rộng quy mô.' },
    { n: '02', t: 'Độc quyền nảy sinh', s: 'Độc quyền sinh ra trực tiếp từ cạnh tranh tự do, nhưng không thủ tiêu cạnh tranh mà làm nó khốc liệt hơn.' },
    { n: '03', t: 'Độc quyền tập đoàn', s: 'Cục diện các siêu nền tảng sở hữu nguồn vốn khổng lồ và thuật toán tối tân nắm quyền chi phối tuyệt đối.' },
  ];
  const practices = [
    { n: '01', t: 'Siêu nền tảng số', s: 'Sự bành trướng của các tập đoàn Big Tech/Platforms chi phối các hoạt động kinh tế, xã hội toàn cầu.' },
    { n: '02', t: 'Oligopoly (Độc quyền nhóm)', s: 'Thị trường phân chia giữa một vài thế lực khổng lồ, trực tiếp bóp nghẹt các chủ thể vừa và nhỏ.' },
    { n: '03', t: 'Kiểm soát thuật toán', s: 'Sử dụng Big Data và hệ thống AI định giá động, phân phối đơn hàng để tối đa hóa giá trị thặng dư số.' }
  ];
  const solutions = [
    { n: 'I', t: 'Tích lũy tư bản', s: 'Động lực sinh tồn buộc doanh nghiệp liên tục gia tăng quy mô vốn.' },
    { n: 'II', t: 'Độc quyền nhóm', s: 'Cục diện phân chia thị trường của các thế lực khổng lồ.' },
    { n: 'III', t: 'Bóc lột thặng dư', s: 'Khai thác tối đa người lao động tự do qua các ứng dụng số.' },
    { n: 'IV', t: 'Thao túng thuật toán', s: 'Kiểm soát giá cả và dòng thông tin hiển thị của thị trường.' },
  ];

  const f1 = "'Playfair Display', serif";
  const f2 = "'Inter', sans-serif";

  return (
    <section id="dat-van-de" className="relative w-full bg-[#EDE8E1] px-4 py-32 md:py-40 overflow-hidden">
      {/* Header with text reveal */}
      <div className="w-full max-w-7xl mx-auto mb-24 md:mb-32">
        <div className="gsap-reveal flex items-center gap-3 mb-6">
          <div className="h-[1px] w-12 bg-[#3D3529]/15 gsap-line-draw" />
          <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#7A6040]" style={{ fontFamily: f2 }}>Phần 1</span>
        </div>
        <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-[#3D3529] mb-8 leading-snug" style={{ fontFamily: f1 }}>
          <span className="gsap-text-reveal block pb-2 md:pb-3">Cạnh Tranh & Độc Quyền</span>
          <span className="gsap-text-reveal block italic font-light text-[#7A6040] pt-1">Quy Luật Tất Yếu</span>
        </h2>
        <p className="gsap-reveal text-lg text-[#7A6040] max-w-2xl leading-relaxed font-light" style={{ fontFamily: f2 }}>
          Kinh tế chính trị Mác - Lênin chỉ ra rằng cạnh tranh tự do thúc đẩy tích tụ tư bản, từ đó tất yếu dẫn đến độc quyền. Trong kỷ nguyên số, quy luật này vận động tinh vi hơn qua ma trận thuật toán của các siêu nền tảng.
        </p>
      </div>

      {/* 3 Core Elements — Progressive Stagger */}
      <div className="w-full max-w-7xl mx-auto gsap-stagger-parent grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-32">
        {elements.map((item) => (
          <div key={item.n} className="gsap-stagger-child card-tilt group">
            <div className="h-full p-8 md:p-10 bg-white/50 rounded-[20px] border border-[#3D3529]/5 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(61,53,41,0.08)]">
              <span className="gsap-counter text-4xl font-light text-[#C5A028] mb-6 block" style={{ fontFamily: f1 }} data-target={parseInt(item.n)}>{item.n}</span>
              <h4 className="text-xl font-bold text-[#3D3529] mb-4" style={{ fontFamily: f1 }}>{item.t}</h4>
              <p className="text-[#7A6040] text-base leading-relaxed font-light" style={{ fontFamily: f2 }}>{item.s}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Practical Application — Stagger from different directions */}
      <div className="w-full max-w-7xl mx-auto mb-32">
        <div className="gsap-reveal flex items-center justify-center gap-4 mb-16">
          <div className="h-[1px] w-12 bg-[#3D3529]/15 gsap-line-draw" />
          <span className="text-sm tracking-[0.25em] text-[#7A6040]/60 uppercase font-semibold" style={{ fontFamily: f2 }}>Cấu Trúc Vận Động</span>
          <div className="h-[1px] w-12 bg-[#3D3529]/15 gsap-line-draw" />
        </div>
        <div className="gsap-stagger-parent grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {practices.map((item) => (
            <div key={item.n} className="gsap-stagger-child card-tilt group">
              <div className="h-full p-8 border-t border-[#3D3529]/10 transition-colors duration-500 group-hover:border-[#C5A028]">
                <span className="gsap-counter text-4xl font-light text-[#C5A028] mb-6 block" style={{ fontFamily: f1 }} data-target={parseInt(item.n)}>{item.n}.</span>
                <h4 className="text-xl font-bold text-[#3D3529] mb-4" style={{ fontFamily: f1 }}>{item.t}</h4>
                <p className="text-[#7A6040] text-base leading-relaxed font-light" style={{ fontFamily: f2 }}>{item.s}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Summary */}
      <div className="w-full max-w-7xl mx-auto">
        <div className="gsap-scale-in bg-white/50 rounded-[20px] border border-[#3D3529]/5 p-10 md:p-16">
          <h3 className="gsap-reveal text-center text-sm font-semibold tracking-[0.2em] uppercase text-[#7A6040]/50 mb-16" style={{ fontFamily: f2 }}>Cơ Chế Biện Chứng</h3>
          <div className="gsap-stagger-parent grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {solutions.map((item) => (
              <div key={item.t} className="gsap-stagger-child flex flex-col items-center text-center group">
                <div className="w-16 h-16 rounded-full bg-[#EDE8E1] flex items-center justify-center mb-6 border border-[#3D3529]/10 transition-all duration-500 group-hover:bg-[#C5A028] group-hover:border-[#C5A028]">
                  <span className="text-[#C5A028] text-lg font-bold group-hover:text-white transition-colors duration-500" style={{ fontFamily: f1 }}>{item.n}</span>
                </div>
                <h4 className="text-lg font-bold text-[#3D3529] mb-3" style={{ fontFamily: f1 }}>{item.t}</h4>
                <p className="text-[#7A6040] text-sm font-light leading-relaxed" style={{ fontFamily: f2 }}>{item.s}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
