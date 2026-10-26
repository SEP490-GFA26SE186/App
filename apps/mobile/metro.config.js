// apps/mobile/metro.config.js
// Mobile tự đủ: không dùng file ngoài apps/mobile (đã bỏ workspace root).
const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);
