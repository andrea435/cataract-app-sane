// Runs Sane's VGG19 cataract model (assets/models/cataract_model_VGG19final.tflite)
// on the phone, fully offline. See preprocess.ts for what the model expects.
import { Asset } from 'expo-asset';
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

/** Says which step failed, so the message on screen is enough to diagnose a problem. */
async function step<T>(name: string, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`${name}: ${msg}`);
  }
}

async function modelFileUri(): Promise<string> {
  // In a release APK, React Native resolves a bundled asset to an Android resource name
  // (no file:// URL), which fast-tflite can't open. expo-asset copies it to a real file.
  const asset = Asset.fromModule(require('../../../assets/models/cataract_model_VGG19final.tflite'));
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  if (!uri) throw new Error('model file not found in the app');
  return uri;
}

function loadModel(): Promise<TfliteModel> {
  if (!modelPromise) {
    modelPromise = (async () => {
      const url = await step('Copying model file', modelFileUri);
      return step('Loading model', () => loadTensorflowModel({ url }, []));
    })().catch(e => {
      modelPromise = null;
      throw e;
    });
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

  const input = await step('Preparing photo', async () => {
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
    if (!saved.base64) throw new Error('no image data');
    const img = decodeJpeg(base64ToBytes(saved.base64), { useTArray: true, formatAsRGBA: true });
    return rgbaToModelInput(img.data, img.width, img.height);
  });

  const out = await step('Running model', async () => {
    const [o] = await model.run([input.buffer as ArrayBuffer]);
    return new Float32Array(o);
  });
  return interpretOutput(out);
}
