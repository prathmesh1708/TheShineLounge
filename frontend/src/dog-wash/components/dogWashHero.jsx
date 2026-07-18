import React from 'react';
import dogWashVideo from '../../assets/images/dog-wash-banner.mp4';

export default function DogWashHero() {
  return (
    <div className="relative w-full h-[320px] sm:h-[450px] md:h-[600px] bg-zinc-900 rounded-24 overflow-hidden shadow-premium group border border-zinc-200/50">
      {/* Video */}
      <video
        src={dogWashVideo}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
    </div>
  );
}

