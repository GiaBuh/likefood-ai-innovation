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
              Connecting you to the heart of Vietnam through premium, authentic specialty foods. From the Mekong Delta to your dining table.
            </p>
          </div>

          {/* Products Links */}
          <div className="col-span-1">
            <h3 className="text-white font-semibold mb-4">Our Products</h3>
            <ul className="space-y-3 text-sm">
              <li><a className="hover:text-primary transition-colors" href="#">Dried Seafood</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Tropical Fruits</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Tea & Coffee</a></li>
            </ul>
          </div>

          {/* Customer Care Links */}
          <div className="col-span-1">
            <h3 className="text-white font-semibold mb-4">Customer Care</h3>
            <ul className="space-y-3 text-sm">
              <li><a className="hover:text-primary transition-colors" href="#">Shipping to US</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Wholesale Inquiries</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Quality Guarantee</a></li>
            </ul>
          </div>

          {/* Newsletter - Full width on mobile, 1 col on desktop */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-white font-semibold mb-4">Newsletter</h3>
            <p className="text-xs text-stone-400 mb-3">Subscribe to get special offers and once-in-a-lifetime deals.</p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-white placeholder-stone-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Enter your email"
                type="email"
              />
              <button className="bg-primary hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap">
                Join
              </button>
            </form>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
