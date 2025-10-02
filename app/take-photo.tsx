import React, { useRef, useState, useContext, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { AuthContext } from '../context/AuthContext';

// This route intentionally avoids importing expo-camera or expo-media-library
// at module scope so Metro / symbolication never tries to require native
// modules while parsing routes. Native modules are imported dynamically
// after the user requests to open the camera.

export default function TakePhotoSafe() {
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [CameraComponent, setCameraComponent] = useState<any>(null);
  const [MediaLibraryModule, setMediaLibraryModule] = useState<any>(null);
  const [cameraType, setCameraType] = useState<any>(null);
  const [backPhoto, setBackPhoto] = useState<string | null>(null);
  const [frontPhoto, setFrontPhoto] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const openCamera = async () => {
    setInitializing(true);
    try {
      // dynamic import to avoid native module resolution during route parse
      const camModule = await import('expo-camera');
      const media = await import('expo-media-library');

      // expo-camera may export Camera as a named or default export depending on bundler.
      const CameraComp = (camModule && (camModule.Camera ?? camModule.default ?? camModule));
      setCameraComponent(() => CameraComp);
      setMediaLibraryModule(media);

      // permission function can be on the Camera component or exported at the top-level.
      const requestPerm =
        (CameraComp && CameraComp.requestCameraPermissionsAsync) ||
        camModule.requestCameraPermissionsAsync ||
        (camModule.Camera && camModule.Camera.requestCameraPermissionsAsync);

      if (requestPerm) {
        const { status } = await requestPerm();
        setHasPermission(status === 'granted');
      } else {
        // If we can't find a permission API, assume not available on this runtime.
        setHasPermission(false);
      }

      // default to back camera using available constants
      const consts = (CameraComp && (CameraComp.Constants ?? CameraComp)) ?? {} as any;
      const backConst = consts.Type?.back ?? consts.back ?? 'back';
      setCameraType(backConst as any);
    } catch (err: any) {
      const message = err?.message ?? String(err);
      console.error('Failed to initialize camera', err);
      Alert.alert(
        'Camera unavailable',
        message.includes('ExponentCamera')
          ? 'Native camera module not available. Use a development build or run on a simulator/device with camera support.'
          : message
      );
      setHasPermission(false);
    } finally {
      setInitializing(false);
    }
  };

  const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

  const captureBoth = async () => {
    if (!CameraComponent || !cameraRef.current) {
      Alert.alert('Camera not ready');
      return;
    }
    setLoading(true);
    try {
      const Consts = CameraComponent.Constants || CameraComponent;
      const frontConst = Consts.Type?.front ?? (Consts as any).front ?? 'front';
      const backConst = Consts.Type?.back ?? (Consts as any).back ?? 'back';

      // ensure back first
      setCameraType(backConst);
      // wait for camera switch
      await sleep(500);
      const back = await (cameraRef.current as any).takePictureAsync({ quality: 0.7, skipProcessing: true });
      setBackPhoto(back.uri);

      // switch to front
      setCameraType(frontConst);
      await sleep(500);
      const front = await (cameraRef.current as any).takePictureAsync({ quality: 0.7, skipProcessing: true });
      setFrontPhoto(front.uri);

      // save both
      await savePhotoRecord(front.uri, back.uri);
      router.replace('/(tabs)/feed');
    } catch (err) {
      console.error('captureBoth error', err);
      Alert.alert('Error capturing photos');
    } finally {
      setLoading(false);
    }
  };

  const savePhotoRecord = async (frontUri?: string, backUri?: string) => {
    try {
      const stored = await AsyncStorage.getItem('photos');
      const photos = stored ? JSON.parse(stored) : [];
      const record: any = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      if (frontUri) record.front = frontUri;
      if (backUri) record.back = backUri;
      record.user = user ? { username: user.username } : null;
      photos.push(record);
      await AsyncStorage.setItem('photos', JSON.stringify(photos));
    } catch (e) {
      console.error('Error saving photo record', e);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    setLoading(true);
    try {
      const photo = await (cameraRef.current as any).takePictureAsync({ quality: 0.7, skipProcessing: true });
      // assign to back or front depending on current cameraType
      const frontConst = CameraComponent?.Constants?.Type?.front ?? (CameraComponent?.Type as any)?.front ?? 'front';
      const backConst = CameraComponent?.Constants?.Type?.back ?? (CameraComponent?.Type as any)?.back ?? 'back';
      if (cameraType === frontConst || cameraType === 'front') {
        setFrontPhoto(photo.uri);
      } else {
        setBackPhoto(photo.uri);
      }
      // optionally save to gallery if module present
      if (MediaLibraryModule && MediaLibraryModule.createAssetAsync) {
        try {
          await MediaLibraryModule.createAssetAsync(photo.uri);
        } catch {
          // ignore gallery save errors
        }
      }
      // If both photos are captured, save record and navigate to feed
      const nowFront = frontPhoto || (cameraType === frontConst ? photo.uri : undefined);
      const nowBack = backPhoto || (cameraType === backConst ? photo.uri : undefined);
      if (nowFront && nowBack) {
        await savePhotoRecord(nowFront, nowBack);
        router.replace('/(tabs)/feed');
      }
    } catch {
      console.error('Error taking picture');
      Alert.alert('Error', 'Could not take picture.');
    } finally {
      setLoading(false);
    }
  };

  const switchCamera = () => {
    if (!CameraComponent) return;
    const Consts = CameraComponent.Constants || CameraComponent;
    const front = Consts.Type?.front ?? (Consts as any).front ?? 'front';
    const back = Consts.Type?.back ?? (Consts as any).back ?? 'back';
    setCameraType((prev: any) => (prev === front ? back : front));
  };

  const saveBoth = async () => {
    if (!backPhoto || !frontPhoto) {
      Alert.alert('Both photos required', 'Please capture both back and front photos before saving.');
      return;
    }
    setLoading(true);
    try {
      await savePhotoRecord(frontPhoto, backPhoto);
      router.replace('/(tabs)/feed');
    } catch (e) {
      console.error('Error saving both photos', e);
      Alert.alert('Error', 'Could not save photos.');
    } finally {
      setLoading(false);
    }
  };

  // initial UI: Open Camera button (only visible when user is signed in)
  if (!CameraComponent) {
    // If we're running on web, provide an in-browser camera UI fallback.
    // If running in Expo Go (native) and expo-camera isn't available, offer an ImagePicker fallback.
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Take a BeReal</Text>
        {!user ? (
          <Text style={styles.note}>Please sign in to use the camera.</Text>
        ) : (
          <>
            {Platform.OS === 'web' ? (
              <WebCameraFallback onSave={async (uri: string) => await savePhotoRecord(uri, undefined)} />
            ) : (
              <>
                <Button title={initializing ? 'Initializing...' : 'Open Camera'} onPress={openCamera} disabled={initializing} />
                <View style={{ height: 8 }} />
                <Button title="Pick / Take Photo (Expo Go fallback)" onPress={async () => await pickImageFallback()} />
                {initializing && <ActivityIndicator style={{ marginTop: 12 }} />}
                <View style={{ height: 12 }} />
                <Button title="Cancel" onPress={() => router.back()} />
              </>
            )}
          </>
        )}
      </View>
    );
  }

  // --- Helpers: web camera fallback and image-picker fallback for Expo Go ---
  async function pickImageFallback() {
    try {
      const ImagePicker = await import('expo-image-picker');
      // prefer camera if available, otherwise open library
      let result: any;
      try {
        result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      } catch (e) {
        result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
      }
      if (!result || result.cancelled) return;
      const uri = result.assets ? result.assets[0].uri : result.uri;
      await savePhotoRecord(uri, undefined);
      Alert.alert('Saved', 'Photo saved (fallback).');
      router.replace('/(tabs)/feed');
    } catch (err) {
      console.error('pickImageFallback error', err);
      Alert.alert('Image picker unavailable', String(err));
    }
  }

  function WebCameraFallback({ onSave }: { onSave: (uri: string) => Promise<void> }) {
    const videoRef = useRef<any>(null);
    const canvasRef = useRef<any>(null);
    const [stream, setStream] = useState<any>(null);
    const [captured, setCaptured] = useState<string | null>(null);

    useEffect(() => {
      return () => {
        if (stream && stream.getTracks) {
          stream.getTracks().forEach((t: any) => t.stop());
        }
      };
    }, [stream]);

    const start = async () => {
      try {
        const s = await (navigator.mediaDevices as any).getUserMedia({ video: { facingMode: 'environment' } });
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
        if (videoRef.current) videoRef.current.play();
      } catch (e) {
        console.error('Web camera error', e);
        Alert.alert('Web camera unavailable', String(e));
      }
    };

    const capture = async () => {
      try {
        const video: any = videoRef.current;
        const canvas: any = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCaptured(dataUrl);
      } catch (e) {
        console.error('Web capture failed', e);
        Alert.alert('Capture error', String(e));
      }
    };

    const save = async () => {
      if (!captured) return;
      await onSave(captured);
      Alert.alert('Saved', 'Photo saved from web camera');
      router.replace('/(tabs)/feed');
    };

    return (
      <View style={{ alignItems: 'center' }}>
        {!stream ? (
          <Button title="Start Web Camera" onPress={start} />
        ) : (
          <>
            {/* @ts-ignore - using native DOM video element in react-native-web */}
            <video ref={videoRef} style={{ width: 320, height: 240, backgroundColor: '#000' }} />
            <View style={{ height: 8 }} />
            <Button title="Capture" onPress={capture} />
            <View style={{ height: 8 }} />
            {captured ? (
              <>
                {/* show thumbnail using an img tag on web */}
                {/* @ts-ignore */}
                <img src={captured} alt="preview" style={{ width: 160, height: 120, marginTop: 8 }} />
                <View style={{ height: 8 }} />
                <Button title="Save" onPress={save} />
              </>
            ) : null}
          </>
        )}
      </View>
    );
  }

  // Camera is available (render CameraComponent)
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Camera permissions not granted</Text>
        <Button title="Back" onPress={() => router.back()} />
      </View>
    );
  }

  const Camera = CameraComponent;

  // Render native camera with an onCameraReady flag to avoid black preview
  const [cameraReady, setCameraReady] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <Camera
          style={styles.camera}
          ref={cameraRef}
          ratio="16:9"
          type={cameraType}
          onCameraReady={() => setCameraReady(true)}
        />
        {!cameraReady && <ActivityIndicator style={{ position: 'absolute', top: 12, right: 12 }} />}
      </View>
      <View style={styles.controls}>
        <Button title={loading ? 'Saving...' : 'Capture'} onPress={takePicture} disabled={loading} />
        <Button title="Switch Camera" onPress={switchCamera} />
        <Button title="Save BeReal" onPress={saveBoth} disabled={loading || !backPhoto || !frontPhoto} />
        <Button title="Cancel" onPress={() => router.back()} />
      </View>
      <View style={{ padding: 12 }}>
        <Text style={{ color: '#fff' }}>Back photo: {backPhoto ? 'Captured' : '—'}</Text>
        <Text style={{ color: '#fff' }}>Front photo: {frontPhoto ? 'Captured' : '—'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 22, marginBottom: 12 },
  note: { color: 'gray' },
  cameraContainer: { flex: 1, alignSelf: 'stretch', width: '100%', backgroundColor: '#000' },
  camera: { flex: 1 },
  controls: { width: '100%', padding: 12, flexDirection: 'row', justifyContent: 'space-around' },
});
