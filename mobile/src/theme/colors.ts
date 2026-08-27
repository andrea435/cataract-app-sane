// Converted 1:1 from the oklch(...) values in the original design (Cataract Screening App.dc.html)
// via the OKLab/OKLCH -> sRGB reference conversion, so the palette matches the source pixel-for-pixel.
export const colors = {
  pageBg: '#eef2f5', // oklch(96% 0.006 235)
  cardBg: '#fafcfd', // oklch(99% 0.003 235)
  ink: '#141c21', // oklch(22% 0.015 235)

  textPrimary: '#232a2e', // oklch(28% 0.012 235)
  textStrong: '#282f33', // oklch(30% 0.012 235)
  textBody: '#353c40', // oklch(35% 0.012 235)
  textLabel: '#3c4448', // oklch(38% 0.012 235)
  textLabelStrong: '#42494d', // oklch(40% 0.012 235)
  textMuted: '#575f63', // oklch(48% 0.012 235)
  textMuted2: '#4f565b', // oklch(45% 0.012 235)
  textSubtle: '#636a6f', // oklch(52% 0.012 235)
  textSubtle2: '#6b7378', // oklch(55% 0.012 235)
  textFaint: '#747c80', // oklch(58% 0.012 235)
  textOnDarkMuted: '#a2b0b9', // oklch(75% 0.02 235)
  textOnDarkFaint: '#d3d8dc', // oklch(88% 0.008 235) (approx opacity look)

  brand: '#007296', // oklch(50% 0.13 220) primary accent
  brandDark: '#006386', // oklch(45% 0.13 220)
  brandDarker: '#0081a5', // oklch(55% 0.13 220) (hover-ish)
  brandTint: '#d3edf6', // oklch(93% 0.03 220) light accent bg
  brandTintStrong: '#d0e1e7', // oklch(90% 0.02 220)
  brandSoftBorder: '#83b7c8', // oklch(75% 0.06 220)

  danger: '#ab413e', // oklch(52% 0.14 25)
  dangerBg: '#fce1de', // oklch(93% 0.03 25)
  success: '#1d7d3e', // oklch(52% 0.13 150)
  successDark: '#00682a', // oklch(45% 0.13 150)
  successBg: '#dbeede', // oklch(93% 0.03 150)

  border: '#d3d8dc', // oklch(88% 0.008 235)
  borderSoft: '#e1e5e8', // oklch(92% 0.006 235)
  divider: '#e4e9eb', // oklch(93% 0.006 235)
  trackBg: '#dee6ea', // oklch(92% 0.01 235)
  ringTrack: '#dee6ea', // oklch(92% 0.01 235)
  spinnerTrack: '#d0e1e7', // oklch(90% 0.02 220)

  surfaceMuted: '#f2f6f8', // oklch(97% 0.005 235)
  disabledBg: '#c8cfd3', // oklch(85% 0.01 235)
  placeholderStripeLight: '#bec5ca', // oklch(82% 0.01 235)
  placeholderStripe: '#d1d9dd', // oklch(88% 0.01 235)

  captureBg: '#070c0f', // oklch(15% 0.01 235)
  captureStripeA: '#242a2d', // oklch(28% 0.01 235)
  captureStripeB: '#1b2023', // oklch(24% 0.01 235)
  captureRing: '#83b7c8', // oklch(75% 0.06 220)
  captureShutterBorder: '#50565a', // oklch(45% 0.01 235)
  captureCaption: '#c2d0d9', // oklch(85% 0.02 235)

  white: '#ffffff',
} as const;
