import React, { useState, useEffect } from 'react';
import dogWashVideo from '../../assets/images/dog-wash-banner.mp4';

export default function DogWashHero({ videoUrl }) {
  const [activeVideo, setActiveVideo] = useState(videoUrl || dogWashVideo);

  useEffect(() => {
    if (videoUrl) {
      setActiveVideo(videoUrl);
      return;
    }
    const cached = localStorage.getItem('tsl_dog_wash_service');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.heroVideo || parsed.bannerVideo) {
          setActiveVideo(parsed.heroVideo || parsed.bannerVideo);
        }
      } catch (e) {}
    }
  }, [videoUrl]);

  return (
    <div className="relative w-full h-[320px] sm:h-[450px] md:h-[600px] bg-zinc-900 rounded-24 overflow-hidden shadow-premium group border border-zinc-200/50">
      {/* Video */}
      <video
        key={activeVideo}
        src={activeVideo}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
    </div>
  );
}

