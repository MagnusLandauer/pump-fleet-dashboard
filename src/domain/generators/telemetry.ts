import type {
  TelemetryPoint,
  TelemetrySignal,
  TimeWindow,
} from '../models';
import { TIME_WINDOWS } from '../models';
import { gaussian, hashSeed, mulberry32 } from './prng';
import type { Rng } from './prng';
import { DEGRADED_PUMP_ID } from './seed';
import { applyDegradation } from './degradation';
import type { DegradationProfile } from './degradation';

export interface BaselineProfile {
  rotationSpeed: number;
  inletPressure: number;
  outletPressure: number;
  flowRate: number;
  vibration: number;
  temperature: number;
}

export const NORMAL_BASELINE: BaselineProfile = {
  rotationSpeed: 3000,
  inletPressure: 2.2,
  outletPressure: 11.0,
  flowRate: 55,
  vibration: 2.0,
  temperature: 65,
};

const NOISE_STDDEV: Record<TelemetrySignal, number> = {
  rotationSpeed: 18,
  inletPressure: 0.08,
  outletPressure: 0.18,
  flowRate: 0.9,
  vibration: 0.18,
  temperature: 0.7,
};

export function getDegradationProfile(
  pumpId: string,
  now: Date,
): DegradationProfile | null {
  if (pumpId !== DEGRADED_PUMP_ID) return null;
  const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return {
    start,
    rampHours: 36,
    deltas: {
      outletPressure: -3.2,
      flowRate: -22,
      vibration: 4.2,
      temperature: 22,
    },
  };
}

function generatePoint(
  timestamp: Date,
  rng: Rng,
  profile: DegradationProfile | null,
): TelemetryPoint {
  const noisy: Record<TelemetrySignal, number> = {
    rotationSpeed: NORMAL_BASELINE.rotationSpeed + gaussian(rng, 0, NOISE_STDDEV.rotationSpeed),
    inletPressure: NORMAL_BASELINE.inletPressure + gaussian(rng, 0, NOISE_STDDEV.inletPressure),
    outletPressure: NORMAL_BASELINE.outletPressure + gaussian(rng, 0, NOISE_STDDEV.outletPressure),
    flowRate: NORMAL_BASELINE.flowRate + gaussian(rng, 0, NOISE_STDDEV.flowRate),
    vibration: NORMAL_BASELINE.vibration + gaussian(rng, 0, NOISE_STDDEV.vibration),
    temperature: NORMAL_BASELINE.temperature + gaussian(rng, 0, NOISE_STDDEV.temperature),
  };

  const final = profile ? applyDegradation(noisy, profile, timestamp) : noisy;

  return {
    timestamp,
    rotationSpeed: round(final.rotationSpeed, 0),
    inletPressure: round(final.inletPressure, 2),
    outletPressure: round(final.outletPressure, 2),
    flowRate: round(final.flowRate, 1),
    vibration: round(final.vibration, 2),
    temperature: round(final.temperature, 1),
  };
}

function round(n: number, decimals: number): number {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

export function generateHistory(
  pumpId: string,
  window: TimeWindow,
  now: Date,
): TelemetryPoint[] {
  const cfg = TIME_WINDOWS[window];
  const count = Math.floor(cfg.durationMs / cfg.resolutionMs);
  const start = now.getTime() - cfg.durationMs;
  const profile = getDegradationProfile(pumpId, now);
  const rng = mulberry32(hashSeed(`${pumpId}:${window}`));

  const points: TelemetryPoint[] = [];
  for (let i = 0; i <= count; i++) {
    const ts = new Date(start + i * cfg.resolutionMs);
    points.push(generatePoint(ts, rng, profile));
  }
  return points;
}

export function generateNextPoint(
  pumpId: string,
  previousTimestamp: Date,
  now: Date,
  resolutionMs: number,
): TelemetryPoint {
  const ts = new Date(previousTimestamp.getTime() + resolutionMs);
  const profile = getDegradationProfile(pumpId, now);
  const rng = mulberry32(hashSeed(`${pumpId}:tick:${ts.getTime()}`));
  return generatePoint(ts, rng, profile);
}
