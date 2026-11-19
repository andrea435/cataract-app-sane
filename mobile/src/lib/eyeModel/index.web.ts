// The TFLite model runs only in the iPhone and Android apps, not in a web browser.
import type { EyeAnalysis } from './preprocess';

export type { EyeAnalysis } from './preprocess';

export interface CaptureFrame {
  viewWidth: number;
  viewHeight: number;
  ringDiameter: number;
}

export function preloadEyeModel(): void {}

export async function analyseEyePhoto(_uri: string, _frame: CaptureFrame | null): Promise<EyeAnalysis> {
  throw new Error('Cataract detection runs in the phone app only.');
}
