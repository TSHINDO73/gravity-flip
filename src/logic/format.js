// 点数はマイナスになることがあるので、符号を分けてから整える
export function formatTime(ms) {
  if (ms < 0) return `-${formatTime(-ms)}`;
  const tenths = Math.floor(ms / 100);
  const m = Math.floor(tenths / 600);
  const s = Math.floor((tenths % 600) / 10);
  return `${m}:${String(s).padStart(2, '0')}.${tenths % 10}`;
}
