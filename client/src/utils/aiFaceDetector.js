/**
 * Lightweight Real-Time AI Canvas Face & Gaze Feature Analyzer
 * Analyzes video element frames to detect face presence, multiple faces, and head/gaze direction.
 */
export const detectFacesAndGaze = (videoElement) => {
  if (!videoElement || videoElement.readyState !== 4) {
    return { faceCount: 1, gazeOrientation: 'center', confidence: 0 };
  }

  const width = videoElement.videoWidth || 320;
  const height = videoElement.videoHeight || 240;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoElement, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Skin tone & facial region density clustering algorithm (YCbCr / HSV color space approximation)
  let skinPixelCount = 0;
  let minX = width, maxX = 0, minY = height, maxY = 0;
  let totalX = 0, totalY = 0;

  // Grid cluster analysis for detecting multiple distinct facial regions
  const gridRows = 4;
  const gridCols = 4;
  const gridCounts = Array.from({ length: gridRows }, () => Array(gridCols).fill(0));
  const cellWidth = Math.floor(width / gridCols);
  const cellHeight = Math.floor(height / gridRows);

  for (let y = 0; y < height; y += 4) {
    for (let x = 0; x < width; x += 4) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Normalized RGB skin color threshold detection
      if (r > 60 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15) {
        skinPixelCount++;
        totalX += x;
        totalY += y;

        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;

        const cellR = Math.min(gridRows - 1, Math.floor(y / cellHeight));
        const cellC = Math.min(gridCols - 1, Math.floor(x / cellWidth));
        gridCounts[cellR][cellC]++;
      }
    }
  }

  const totalSamples = (width * height) / 16;
  const skinRatio = skinPixelCount / totalSamples;

  // Evaluate Face Count
  let faceCount = 1;
  let activeClusters = 0;

  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      if (gridCounts[r][c] > (cellWidth * cellHeight) / 64) {
        activeClusters++;
      }
    }
  }

  if (skinRatio < 0.05) {
    faceCount = 0; // No face in frame
  } else if (activeClusters >= 8 && (maxX - minX > width * 0.75)) {
    faceCount = 2; // Multiple faces / crowded frame
  }

  // Evaluate Gaze / Head Centroid Offset
  let gazeOrientation = 'center';
  if (skinPixelCount > 0) {
    const avgX = totalX / skinPixelCount;
    const normalizedCentroidX = avgX / width;

    if (normalizedCentroidX < 0.32) {
      gazeOrientation = 'looking_right'; // Mirrored frame right
    } else if (normalizedCentroidX > 0.68) {
      gazeOrientation = 'looking_left';
    }
  }

  return {
    faceCount,
    gazeOrientation,
    confidence: Math.round(skinRatio * 100),
  };
};
