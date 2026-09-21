// Both views use the same complete artwork, with identical registration and scale.
// Equipment changes swap a single image; no fabric patches or separate fur layers.
export const HERO_ART = {
 base: {key: 'hero-base-v3', url: '/art/hero-base-v3.png'},
 wolf: {key: 'hero-wolf-v3', url: '/art/hero-wolf-v3.png'},
} as const;

export function heroArt(mantle: string | null) {
 return mantle === 'wolfMantle' ? HERO_ART.wolf : HERO_ART.base;
}
