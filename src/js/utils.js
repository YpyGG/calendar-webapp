// utils.js — вспомогательные функции
export function generateRandomColor() {
  return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
}
export function isLightColor(hex) {
  if (!hex || hex.length !== 7 || hex[0] !== '#') return false;
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 180;
}
