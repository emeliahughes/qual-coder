const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');

const input = JSON.parse(fs.readFileSync('./combined_cleaned.json', 'utf8'));
const fields = ['id', 'username', 'video_description', 'view_count', 'comment_count', 'create_time', 'like_count', 'share_count'];
const opts = { fields };

const parser = new Parser(opts);
const csv = parser.parse(input.videos);

fs.writeFileSync('./public/data/videoInfo.csv', csv);
console.log('✅ Converted to CSV and saved as videoInfo.csv');
