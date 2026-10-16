export const toolKinds = ['document', 'mail', 'calendar', 'chat', 'chart', 'folder', 'mail', 'document'] as const;
const scattered = [[-2.8, 2, -.4], [-.25, 2.2, .4], [2.4, 2, -.3], [-2.15, -.05, .75], [.25, -.15, .3], [2.7, -.35, .15], [-2.6, -2.25, -.25], [2.3, -2.3, .4]];
export const grid = [[-2.2, 1.25, 0], [0, 1.25, 0], [2.2, 1.25, 0], [-2.2, -1.25, 0], [0, -1.25, 0], [2.2, -1.25, 0], [0, 1.25, 0], [-2.2, 1.25, 0]];
const orbit = [[-2.9, 1.6, -.2], [-.4, 2.4, -.4], [2.9, 1.5, -.4], [-3, -1.25, .3], [.4, -2.4, .3], [3, -1.2, .2], [0, 0, 0], [0, 0, 0]];
export const connections = [[0, 1], [1, 2], [0, 3], [1, 4], [2, 5], [3, 4], [4, 5]];
export function easeBetween(from: number, to: number, p: number) { const t = Math.min(1, Math.max(0, (p - from) / (to - from))); return t * t * (3 - 2 * t); }
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Every pose is a pure function of scroll position, including the reverse journey. */
export function toolPose(p: number, index: number) {
  const tidy = easeBetween(0, .48, p), integrated = easeBetween(.72, 1, p);
  const source = scattered[index], target = grid[index], finish = orbit[index];
  const direction = index % 2 ? 1 : -1;
  const arc = Math.sin(Math.PI * Math.min(1, p / .48));
  const x = mix(mix(source[0], target[0], tidy), finish[0], integrated) + arc * direction * .38;
  const y = mix(mix(source[1], target[1], tidy), finish[1], integrated) + arc * Math.sin(index * .85) * .18;
  const z = mix(mix(source[2], target[2], tidy), finish[2], integrated);
  return {
    x, y, z,
    rx: mix(direction * .38, .06, tidy) + integrated * .12,
    ry: mix(direction * .48, -.08, tidy) + integrated * direction * .32,
    rz: mix(direction * (.16 + index * .025), 0, tidy) + integrated * direction * .12 + arc * direction * .1,
    scale: mix(1.12, 1, tidy) * (index > 5 ? 1 - easeBetween(.2, .47, p) : mix(1, .68, integrated)),
  };
}
