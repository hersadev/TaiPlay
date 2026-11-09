// Azar reproducible para los ejercicios: en la web se usa Math.random y en
// las pruebas un generador con semilla.

export const int = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));
export const pick = (rng, list) => list[Math.floor(rng() * list.length)];

// mulberry32: pequeño, rápido y suficiente para barajar ejercicios.
export function seeded(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
