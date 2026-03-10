import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-background-dark text-stone-300 py-12 border-t border-stone-800 mt-auto">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6 md:gap-10">

          {/* Logo & Description - Full width on mobile, 1 col on desktop */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4 text-white">
              <img src="/logo_likefood.png" alt="LikeFood Logo" className="h-12 w-12 rounded-full object-cover drop-shadow-sm" />
              <span className="text-xl font-bold">LIKEFOOD</span>
            </div>
            <p className="text-sm leading-relaxed mb-6 text-stone-400">
              Kết nối bạn với vùng đất Việt Nam qua những đặc sản cao cấp, chính gốc. Từ đồng bằng sông Cửu Long đến bàn ăn của bạn.
            </p>
          </div>

          {/* Products Links */}
          <div className="col-span-1">
            <h3 className="text-white font-semibold mb-4">Sản phẩm</h3>
            <ul className="space-y-3 text-sm">
              <li><a className="hover:text-primary transition-colors" href="#">Hải sản khô</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Trái cây nhiệt đới</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Trà & Cà phê</a></li>
            </ul>
          </div>

          {/* Customer Care Links */}
          <div className="col-span-1">
            <h3 className="text-white font-semibold mb-4">Hỗ trợ khách hàng</h3>
            <ul className="space-y-3 text-sm">
              <li><a className="hover:text-primary transition-colors" href="#">Giao hàng tới Mỹ</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Đặt hàng sỉ</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Cam kết chất lượng</a></li>
            </ul>
          </div>

          {/* Newsletter - Full width on mobile, 1 col on desktop */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-white font-semibold mb-4">Nhận tin khuyến mãi</h3>
            <p className="text-xs text-stone-400 mb-3">Đăng ký để nhận ưu đãi đặc biệt.</p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-white placeholder-stone-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Nhập email của bạn"
                type="email"
              />
              <button className="bg-primary hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap">
                Đăng ký
              </button>
            </form>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
