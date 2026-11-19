# Detection model

The app screens each eye photo with Sane's VGG19 cataract model,
`assets/models/cataract_model_VGG19final.tflite` (26 MB). It runs on the phone with
[`react-native-fast-tflite`](https://github.com/mrousavy/react-native-fast-tflite), so
screening works with no signal. Code: `src/lib/eyeModel/`.

## What the model expects

Read from the `.tflite` file itself:

| | |
| --- | --- |
| Input | `float32 [1, 224, 224, 3]`, RGB, each pixel divided by 255 (0 to 1) |
| Output | `float32 [1, 3]`, softmax |
| Class 0 | cataract |
| Class 1 | normal eye |
| Class 2 | not an eye / unusable photo |
| Inside | ImageNet VGG19 conv base (frozen, weights unchanged), Flatten, Dense 256 ReLU, Dense 3 softmax. Weights are int8 (dynamic range). |

The model has **no preprocessing layers**, so the app does the scaling. It was checked
which scaling the model was trained with: with pixels/255 its outputs are in a normal range
and a dark pupil reads as normal, a cloudy pupil as cataract, and ordinary non-eye photos
as class 2. With Keras' VGG19 `preprocess_input` (BGR, mean subtraction, 0 to 255) the
outputs saturate to 0 or 1, which is the sign of the wrong scaling. If the model is
retrained with a different preprocessing, change `rgbaToModelInput` in
`src/lib/eyeModel/preprocess.ts` to match.

## Training data and accuracy

From Sane's thesis (*IoT-Enabled Machine Learning Framework for Cataract Detection*, NUST),
section 5.2. These are the thesis's figures; they were not re-measured for the app.

- **1,476 images** in three classes (cataract, normal, not an eye), split 1,313 for training
  and 163 for validation.
- Sources:
  - Padia, N. et al. (2022). *Cataract image dataset*. Kaggle.
    <https://www.kaggle.com/datasets/nandanp6/cataract-image-dataset>
  - Cataract (2022). *Cataract v01* (version 7). Roboflow Universe.
  - Roboflow Universe (2024). *Walls dataset* (version 4), used for the "not an eye" class.
- **Validation accuracy 95.71%** for the VGG19 model. (Chapter 6 of the thesis also quotes
  100% and 97.92%; 95.71% is the figure the thesis uses consistently.)
- The thesis does not state the datasets' licences. Check them before any commercial use.

Validation accuracy is measured on held-out images from the same datasets, not on patients
screened in the field with phone cameras, so it is not a field sensitivity or specificity.

## How the app runs it

0. **Loading the model**: `expo-asset` copies the bundled `.tflite` to a real file first and
   fast-tflite loads it from that `file://` path. (In a release APK React Native gives the
   asset as an Android resource name, which fast-tflite's loader can't open; build 30 failed
   this way with "detection model did not run".) If any step fails, the Scanning screen shows
   the step and the error under "Could not analyse the photo".

1. **Capture** records the size of the camera preview and the 260 pt alignment circle.
2. **Scanning** (`analyseEyePhoto`):
   - crops the photo to the square inside the circle (`ringCrop`; the preview covers its
     area, so the circle is mapped back to photo pixels),
   - resizes it to 224 x 224 with `expo-image-manipulator`, decodes it with `jpeg-js`,
   - divides each RGB value by 255 and runs the model.
3. `interpretOutput`:
   - if "not an eye" is the top class, the worker is asked to retake the photo,
   - otherwise the shown probability is `cataract / (cataract + normal)`, 0 to 100.
     50% and above is "Cataract detected" (`statusFields` in `src/data/types.ts`).

The Mild / Moderate / Severe label is a band of that probability (50–64, 65–79, 80+). The
model was not trained to grade severity, so treat it as the model's confidence, not a
clinical grade.

## Replacing the model

Drop the new `.tflite` into `assets/models/`, update the `require(...)` in
`src/lib/eyeModel/index.ts`, and check the input shape, scaling and class order above still
hold. The model is a native module, so it needs a development build or the APK, not Expo
Go. On web, `index.web.ts` reports that detection runs in the phone app only.
