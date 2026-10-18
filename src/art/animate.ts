export type PetKey = 'ricey' | 'ramen';
export type PetState = 'idle' | 'walk' | 'rise' | 'fall' | 'climb';

const WALK_FRAME_MS = 90;

/**
 * Which texture a pet shows right now. `seed` staggers blinks and tail sways so
 * the two pets don't animate in lockstep.
 */
export function petTexture(key: PetKey, state: PetState, time: number, seed = 0): string {
  const t = time + seed;
  if (state === 'walk' || state === 'climb') {
    const step = Math.floor(t / WALK_FRAME_MS);
    return `${key}-walk${(step % 4) + 1}-${Math.floor(step / 2) % 2}`;
  }
  if (state === 'rise' || state === 'fall') return `${key}-${state}-${state === 'rise' ? 1 : 0}`;

  // Idle: Ramen wags constantly, Ricey gives the occasional slow sway.
  const tail = key === 'ramen' ? Math.floor(t / 180) % 2 : t % 2600 < 700 ? 1 : 0;
  const blinking = t % 3400 < 140;
  return `${key}-${blinking ? 'blink' : 'idle'}-${tail}`;
}
