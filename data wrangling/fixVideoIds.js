const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'src/data/videoInfo.json');  // adjust path as needed
const outputPath = path.join(__dirname, 'src/data/videoInfo_fixed.json');

const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

// Convert all video IDs to strings
data.videos = data.videos.map(video => {
  return {
    ...video,
    id: typeof video.id === 'string' ? video.id : String(video.id)
  };
});

// Write to a new JSON file
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
console.log(`✅ Converted video IDs to strings. Output saved to: ${outputPath}`);
