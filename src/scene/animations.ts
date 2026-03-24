type EasingFn = (t: number) => number;

export const easeOutBack: EasingFn = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export const easeOutCubic: EasingFn = (t) => 1 - Math.pow(1 - t, 3);

export const easeInOutSine: EasingFn = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

interface ActiveAnimation {
  update: (dt: number) => boolean; // returns false when done
}

const activeAnimations: ActiveAnimation[] = [];

export function animate(
  duration: number,
  onUpdate: (progress: number) => void,
  easing: EasingFn = easeOutCubic,
): Promise<void> {
  return new Promise((resolve) => {
    let elapsed = 0;
    activeAnimations.push({
      update(dt: number) {
        elapsed += dt;
        const t = Math.min(elapsed / duration, 1);
        onUpdate(easing(t));
        if (t >= 1) {
          resolve();
          return false;
        }
        return true;
      },
    });
  });
}

export function updateAnimations(dt: number) {
  for (let i = activeAnimations.length - 1; i >= 0; i--) {
    if (!activeAnimations[i].update(dt)) {
      activeAnimations.splice(i, 1);
    }
  }
}
