import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useScreening } from '../state/ScreeningContext';
import { PrimaryButton } from '../components/Buttons';

type Props = NativeStackScreenProps<RootStackParamList, 'Capture'>;

export default function CaptureScreen({ navigation }: Props) {
  const { eye, setCapturedPhotoUri, setActiveTab } = useScreening();
  const [permission, requestPermission] = useCameraPermissions();
  const [ready, setReady] = useState(false);
  const [taking, setTaking] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const cancel = () => {
    setActiveTab('scan');
    navigation.navigate('Main');
  };

  const shutter = async () => {
    if (!cameraRef.current || !ready || taking) return;
    setTaking(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo?.uri) {
        setCapturedPhotoUri(photo.uri);
        navigation.navigate('Scanning');
      }
    } finally {
      setTaking(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={cancel} hitSlop={8}>
          <Text style={styles.headerLink}>{'←'} Cancel</Text>
        </Pressable>
        <Text style={styles.headerLabel}>{eye} eye</Text>
        <View style={{ width: 46 }} />
      </View>

      <View style={styles.previewArea}>
        {permission?.granted ? (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            onCameraReady={() => setReady(true)}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.permissionFallback]}>
            <Text style={styles.permissionText}>
              {permission?.canAskAgain === false
                ? 'Camera access was denied. Enable it in system settings to capture an eye image.'
                : 'Requesting camera access…'}
            </Text>
          </View>
        )}

        <View pointerEvents="none" style={styles.ringOuter}>
          <View style={styles.ringInner} />
        </View>
        <Text pointerEvents="none" style={styles.caption}>
          Align the eye within the circle.{'\n'}Hold steady and keep the eye open.
        </Text>
      </View>

      <View style={styles.shutterRow}>
        <Pressable
          onPress={shutter}
          disabled={!permission?.granted || !ready || taking}
          style={({ pressed }) => [styles.shutter, pressed && { opacity: 0.8 }]}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.captureBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerLink: {
    color: colors.white,
    fontSize: 14,
  },
  headerLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.85,
  },
  previewArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionFallback: {
    backgroundColor: colors.captureBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  permissionText: {
    color: colors.captureCaption,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  ringOuter: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 2,
    borderColor: colors.captureRing,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: 236,
    height: 236,
    borderRadius: 118,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  caption: {
    position: 'absolute',
    bottom: 26,
    fontSize: 13,
    color: colors.captureCaption,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 19,
  },
  shutterRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    paddingBottom: 40,
  },
  shutter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: colors.white,
    borderWidth: 5,
    borderColor: colors.captureShutterBorder,
  },
});
