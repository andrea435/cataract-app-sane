// Pure helpers for the VGG19 cataract model (no React Native imports, so they can be
// checked in Node against the reference Python run of the same .tflite file).
//
// What the model expects (read from cataract_model_VGG19final.tflite):
//   input  float32 [1, 224, 224, 3], RGB, pixel values scaled to 0..1 (pixel / 255)
//   output float32 [1, 3] softmax, in this order:
//          0 = cataract, 1 = normal eye, 2 = not an eye / unusable photo
// The model has no preprocessing layers inside it, so the app must do this scaling.

export const MODEL_INPUT_SIZE = 224;

export const CLASS_LABELS = ['cataract', 'normal', 'not_eye'] as const;

export interface EyeAnalysis {
  /** Softmax scores straight from the model, 0..1. */
  cataract: number;
  normal: number;
  notEye: number;
  /** True when "not an eye" is the model's top answer: ask for a retake. */
  isEye: boolean;
  /** Chance of cataract among the two eye classes, 0..100, as shown on the result screen. */
  probability: number;
}

/** RGBA bytes (as decoded from the 224x224 JPEG) -> float32 RGB tensor scaled to 0..1. */
export function rgbaToModelInput(rgba: Uint8Array, width: number, height: number): Float32Array {
  if (width !== MODEL_INPUT_SIZE || height !== MODEL_INPUT_SIZE) {
    throw new Error(`Expected a ${MODEL_INPUT_SIZE}x${MODEL_INPUT_SIZE} image, got ${width}x${height}`);
  }
  const n = width * height;
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    out[i * 3] = rgba[i * 4] / 255;
    out[i * 3 + 1] = rgba[i * 4 + 1] / 255;
    out[i * 3 + 2] = rgba[i * 4 + 2] / 255;
  }
  return out;
}

export function interpretOutput(scores: ArrayLike<number>): EyeAnalysis {
  const cataract = scores[0];
  const normal = scores[1];
  const notEye = scores[2];
  const isEye = !(notEye >= cataract && notEye >= normal);
  const eyeTotal = cataract + normal;
  const probability = eyeTotal > 0 ? Math.round((cataract / eyeTotal) * 100) : 0;
  return { cataract, normal, notEye, isEye, probability };
}

/**
 * The part of the photo that sat inside the capture circle. The camera preview fills its
 * area like `cover`, so the photo is scaled until it covers the view and the overflow is
 * cut off; this maps the on-screen circle back to photo pixels.
 */
export function ringCrop(
  photo: { width: number; height: number },
  view: { width: number; height: number } | null,
  ringDiameter: number
): { originX: number; originY: number; width: number; height: number } {
  const shortSide = Math.min(photo.width, photo.height);
  let side = shortSide;
  if (view && view.width > 0 && view.height > 0) {
    const scale = Math.max(view.width / photo.width, view.height / photo.height);
    side = Math.min(shortSide, Math.round(ringDiameter / scale));
  }
  return {
    originX: Math.round((photo.width - side) / 2),
    originY: Math.round((photo.height - side) / 2),
    width: side,
    height: side,
  };
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64_LOOKUP = (() => {
  const t = new Uint8Array(256);
  for (let i = 0; i < B64.length; i++) t[B64.charCodeAt(i)] = i;
  t['-'.charCodeAt(0)] = 62;
  t['_'.charCodeAt(0)] = 63;
  return t;
})();

export function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/^data:[^,]*,/, '').replace(/[^A-Za-z0-9+/\-_]/g, '');
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let o = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const a = B64_LOOKUP[clean.charCodeAt(i)];
    const b = B64_LOOKUP[clean.charCodeAt(i + 1)];
    const c = i + 2 < clean.length ? B64_LOOKUP[clean.charCodeAt(i + 2)] : 0;
    const d = i + 3 < clean.length ? B64_LOOKUP[clean.charCodeAt(i + 3)] : 0;
    const v = (a << 18) | (b << 12) | (c << 6) | d;
    if (o < out.length) out[o++] = (v >> 16) & 255;
    if (o < out.length && i + 2 < clean.length) out[o++] = (v >> 8) & 255;
    if (o < out.length && i + 3 < clean.length) out[o++] = v & 255;
  }
  return out.subarray(0, o);
}
