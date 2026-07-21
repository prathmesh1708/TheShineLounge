import React, { useState, useEffect } from 'react';
import tslDarkLogo from '../../assets/images/tsl_dark_logo.jpg';
import tslEmblem from '../../assets/images/tsl_logo.png';
import { useTheme } from '../context/ThemeContext';

export default function TSLLogo({ className = "w-full h-full object-contain", variant = "emblem" }) {
  const { isDark } = useTheme();
  const [transparentDarkLogo, setTransparentDarkLogo] = useState(null);

  // Pure React & JavaScript canvas background removal and tight crop
  useEffect(() => {
    if (!isDark) return;

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = tslDarkLogo;
    img.onload = () => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const ctx = tempCanvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const data = imageData.data;

      let minX = tempCanvas.width, minY = tempCanvas.height, maxX = 0, maxY = 0;
      let hasNonBlack = false;

      // Center and radius of the circular emblem
      const centerX = tempCanvas.width * 0.5;
      const centerY = tempCanvas.height * 0.38;
      const maxRadius = tempCanvas.width * 0.36;
      const emblemMaxY = Math.floor(tempCanvas.height * 0.65);

      // 1. Circular distance masking (erases 100% of text and background outside emblem circle)
      for (let y = 0; y < tempCanvas.height; y++) {
        for (let x = 0; x < tempCanvas.width; x++) {
          const idx = (y * tempCanvas.width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          const distSq = (x - centerX) ** 2 + (y - centerY) ** 2;

          // Mask out anything outside emblem circle OR below emblemMaxY OR black background
          if (distSq > maxRadius ** 2 || y >= emblemMaxY || (r < 45 && g < 45 && b < 45)) {
            data[idx + 3] = 0; // Make transparent
          } else {
            hasNonBlack = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);

      if (!hasNonBlack || maxX <= minX || maxY <= minY) {
        setTransparentDarkLogo(tempCanvas.toDataURL());
        return;
      }

      // 2. Crop canvas tightly around the emblem
      const cropWidth = maxX - minX + 1;
      const cropHeight = maxY - minY + 1;
      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = cropWidth;
      croppedCanvas.height = cropHeight;
      const croppedCtx = croppedCanvas.getContext('2d');

      croppedCtx.drawImage(
        tempCanvas,
        minX, minY, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
      );

      setTransparentDarkLogo(croppedCanvas.toDataURL());
    };
  }, [isDark]);

  if (isDark) {
    return (
      <img
        src={transparentDarkLogo || tslDarkLogo}
        alt="The Shine Lounge Logo"
        className={className}
        style={{ mixBlendMode: 'screen' }}
      />
    );
  }

  return (
    <img
      src={tslEmblem}
      alt="The Shine Lounge Logo"
      className={className}
    />
  );
}
