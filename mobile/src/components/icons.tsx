import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// Icons ported 1:1 from the inline <svg> markup in the source design.

export function EyeIcon({ size = 44, color = '#006386' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="6.5" stroke={color} strokeWidth={1.6} />
      <Circle cx="12" cy="12" r="2.4" fill={color} />
      <Path
        d="M2 12C4 7 8 4.5 12 4.5S20 7 22 12C20 17 16 19.5 12 19.5S4 17 2 12Z"
        stroke={color}
        strokeWidth={1.4}
      />
    </Svg>
  );
}

export function ShieldIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L4 6v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V6l-8-4Z" stroke={color} strokeWidth={1.4} />
    </Svg>
  );
}

export function CameraIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={7} width={18} height={13} rx={2.5} stroke={color} strokeWidth={1.6} />
      <Path d="M8 7l1.5-2.5h5L16 7" stroke={color} strokeWidth={1.6} />
      <Circle cx={12} cy={13.5} r={3.4} stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}

export function TabScanIcon({ size = 21, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={7} width={18} height={13} rx={2.5} stroke={color} strokeWidth={1.7} />
      <Circle cx={12} cy={13.5} r={3.2} stroke={color} strokeWidth={1.7} />
    </Svg>
  );
}

export function TabHistoryIcon({ size = 21, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={4} width={16} height={4.2} rx={1.2} stroke={color} strokeWidth={1.7} />
      <Rect x={4} y={10.2} width={16} height={4.2} rx={1.2} stroke={color} strokeWidth={1.7} />
      <Rect x={4} y={16.4} width={16} height={4.2} rx={1.2} stroke={color} strokeWidth={1.7} />
    </Svg>
  );
}

export function TabClinicsIcon({ size = 21, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" stroke={color} strokeWidth={1.7} />
      <Circle cx={12} cy={9} r={2.4} stroke={color} strokeWidth={1.7} />
    </Svg>
  );
}

export function TabProfileIcon({ size = 21, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8.2} r={3.6} stroke={color} strokeWidth={1.7} />
      <Path d="M4.5 20c1.4-4 4.3-6 7.5-6s6.1 2 7.5 6" stroke={color} strokeWidth={1.7} />
    </Svg>
  );
}
