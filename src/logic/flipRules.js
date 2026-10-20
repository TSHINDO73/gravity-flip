export function createFlipState() {
  return { gravity: 1, airFlipAvailable: true };
}

export function canFlip(state, onGround) {
  return onGround || state.airFlipAvailable;
}

export function applyFlip(state, onGround) {
  if (!canFlip(state, onGround)) return { ...state };
  return {
    gravity: -state.gravity,
    airFlipAvailable: onGround ? state.airFlipAvailable : false,
  };
}

export function onLand(state) {
  return { ...state, airFlipAvailable: true };
}
