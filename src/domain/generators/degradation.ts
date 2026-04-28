import type { TelemetrySignal } from '../models';

export interface DegradationProfile {
  start: Date;
  rampHours: number;
  deltas: Partial<Record<TelemetrySignal, number>>;
}

export function sigmoidProgress(t: number, t0: number, k: number): number {
  return 1 / (1 + Math.exp(-(t - t0) / k));
}

export function applyDegradation(
  baseValues: Record<TelemetrySignal, number>,
  profile: DegradationProfile,
  timestamp: Date,
): Record<TelemetrySignal, number> {
  const t = timestamp.getTime();
  const t0 = profile.start.getTime();
  const k = (profile.rampHours * 60 * 60 * 1000) / 4;
  const progress = sigmoidProgress(t, t0, k);

  const result = { ...baseValues };
  for (const signal of Object.keys(profile.deltas) as TelemetrySignal[]) {
    const delta = profile.deltas[signal] ?? 0;
    result[signal] += delta * progress;
  }
  return result;
}
