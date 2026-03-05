import React from 'react';
import { HERO_IMAGE_URL } from '../../constants';

const Hero: React.FC = () => {
  return (
    <div className="relative w-full px-4 pt-6 pb-6 sm:px-6 lg:px-8 max-w-[1440px] mx-auto">
      <div className="relative overflow-hidden rounded-2xl bg-stone-900 min-h-[450px] md:min-h-0 md:aspect-[21/9] flex items-center shadow-xl">
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{ backgroundImage: `url('${HERO_IMAGE_URL}')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-stone-900/90 via-stone-900/60 to-transparent"></div>
        </div>
        <div className="relative px-6 py-8 sm:px-10 md:px-16 flex flex-col items-start gap-4 md:gap-6 max-w-2xl">
          <span className="inline-flex items-center rounded-md bg-green-600/90 backdrop-blur-sm px-3 py-1 text-[10px] sm:text-xs font-bold text-white ring-1 ring-inset ring-green-400 uppercase tracking-wider shadow-lg">
            Authentic Vietnamese Flavors
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-sm">
            Hương Vị Việt <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-lime-300">Trên Đất Mỹ</span>
          </h1>
          <p className="text-stone-200 text-base sm:text-lg md:text-xl font-medium max-w-lg leading-relaxed drop-shadow-md">
            Bringing the taste of home to your doorstep. Premium dried seafood, tropical fruits, and traditional teas directly from Vietnam.
          </p>
          <div className="flex gap-4 mt-2">
            <button className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 sm:px-8 sm:py-3.5 text-sm sm:text-base font-bold text-white shadow-lg shadow-green-900/20 hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 transition-all transform hover:scale-[1.02]">
              Shop Specialities
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;