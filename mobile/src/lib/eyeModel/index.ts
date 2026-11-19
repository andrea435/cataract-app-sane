// Runs Sane's VGG19 cataract model (assets/models/cataract_model_VGG19final.tflite)
// on the phone, fully offline. See preprocess.ts for what the model expects.
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { loadTensorflowModel, type TfliteModel } from 'react-native-fast-tflite';
import { decode as decodeJpeg } from 'jpeg-js';
import {
  EyeAnalysis,
  MODEL_INPUT_SIZE,
  base64ToBytes,
  interpretOutput,
  rgbaToModelInput,
  ringCrop,
} from './preprocess';

export type { EyeAnalysis } from './preprocess';

let modelPromise: Promise<TfliteModel> | null = null;

function loadModel(): Promise<TfliteModel> {
  if (!modelPromise) {
    modelPromise = loadTensorflowModel(require('../../../assets/models/cataract_model_VGG19final.tflite'), []).catch(
      e => {
        modelPromise = null;
        throw e;
      }
    );
  }
  return modelPromise;
}

/** Start loading the model early (it is ~26 MB) so the first scan is quicker. */
export function preloadEyeModel(): void {
  loadModel().catch(() => {});
}

export interface CaptureFrame {
  /** Size of the camera preview on screen, in points. */
  viewWidth: number;
  viewHeight: number;
  /** Diameter of the "align the eye" circle, in points. */
  ringDiameter: number;
}

export async function analyseEyePhoto(uri: string, frame: CaptureFrame | null): Promise<EyeAnalysis> {
  const model = await loadModel();

  // Applies EXIF rotation, so width/height are as the photo is seen.
  const full = await ImageManipulator.manipulate(uri).renderAsync();
  const crop = ringCrop(
    { width: full.width, height: full.height },
    frame ? { width: frame.viewWidth, height: frame.viewHeight } : null,
    frame?.ringDiameter ?? 0
  );
  const small = await ImageManipulator.manipulate(full)
    .crop(crop)
    .resize({ width: MODEL_INPUT_SIZE, height: MODEL_INPUT_SIZE })
    .renderAsync();
  const saved = await small.saveAsync({ format: SaveFormat.JPEG, compress: 1, base64: true });
  if (!saved.base64) throw new Error('Could not read the eye photo');

  const img = decodeJpeg(base64ToBytes(saved.base64), { useTArray: true, formatAsRGBA: true });
  const input = rgbaToModelInput(img.data, img.width, img.height);
  const [out] = await model.run([input.buffer as ArrayBuffer]);
  return interpretOutput(new Float32Array(out));
}
