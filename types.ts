export type SimulationPhase = 'stable' | 'approach' | 'interaction' | 'consumption' | 'void' | 'rebirth';

export interface SimulationState {
  energyDensity: number; // J/m^3
  volume: number; // m^3 (log scale for slider)
  lambdaM: number; // Multiversal coupling constant (scaled)
  isPlaying: boolean;
  phase: SimulationPhase;
  timeScale: number; // 1.0 = normal, <1 = slow mo, >1 = fast
  year: number; // Simulated year
}

export interface CosmicObject {
  name: string;
  radius: number;
  color: string;
  distance: number; // Initial distance
  angle: number; // Current orbital angle
  speed: number;
  type: 'star' | 'planet' | 'gas_giant' | 'black_hole';
  mass: string;
  description: string;
  texture?: string;
  ring?: { inner: number, outer: number, color: string };
}