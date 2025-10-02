import React, { useRef, useState, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform, Button } from 'react-native';
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

      Alert.alert('📸 BeReal Time!', 'Get ready to capture both cameras simultaneously!', [
        { text: 'Ready!', onPress: async () => {
          try {
            // ensure back first
            setCameraType(backConst);
            // wait for camera switch
            await sleep(800);
            const back = await (cameraRef.current as any).takePictureAsync({ quality: 0.8, skipProcessing: true });
            setBackPhoto(back.uri);

            // switch to front with notification
            Alert.alert('📱 Flip!', 'Now capturing your reaction!');
            setCameraType(frontConst);
            await sleep(800);
            const front = await (cameraRef.current as any).takePictureAsync({ quality: 0.8, skipProcessing: true });
            setFrontPhoto(front.uri);

            // save both
            await savePhotoRecord(front.uri, back.uri);
            Alert.alert('✨ BeReal Posted!', 'Your authentic moment has been shared!');
            router.replace('/(tabs)/feed');
          } catch (err) {
            console.error('captureBoth error', err);
            Alert.alert('Error capturing photos');
          }
        }}
      ]);
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

  // For Expo Go, we'll prioritize the image picker since native camera doesn't work
  const isExpoGo = !CameraComponent || Platform.OS === 'web';
  
  // initial UI: Show Expo Go optimized interface
  if (isExpoGo || !CameraComponent) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>BeReal.</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.expoGoContainer}>
          <Text style={styles.title}>📸 Time to BeReal!</Text>
          {!user ? (
            <Text style={styles.note}>Please sign in to use the camera.</Text>
          ) : (
            <>
              <Text style={styles.subtitle}>
                {Platform.OS === 'web' ? 'Web Camera Available' : 'Expo Go Mode'}
              </Text>
              <Text style={styles.description}>
                {Platform.OS === 'web' 
                  ? 'Use your web camera to capture authentic moments'
                  : 'Take or choose photos from your gallery to create your BeReal'
                }
              </Text>
              
              {Platform.OS === 'web' ? (
                <WebCameraFallback onSave={async (uri: string) => await savePhotoRecord(uri, undefined)} />
              ) : (
                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={styles.primaryActionButton} 
                    onPress={async () => await takePhotoWithPicker()}
                  >
                    <Text style={styles.primaryActionButtonText}>📸 Take Photo</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.secondaryActionButton} 
                    onPress={async () => await pickFromLibrary()}
                  >
                    <Text style={styles.secondaryActionButtonText}>🖼️ Choose from Gallery</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.simulateButton} 
                    onPress={async () => await simulateBeReal()}
                  >
                    <Text style={styles.simulateButtonText}>✨ Simulate BeReal (Demo)</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => router.back()}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  }

  // --- Helpers: Enhanced image picker functions for Expo Go ---
  async function takePhotoWithPicker() {
    try {
      setLoading(true);
      const ImagePicker = await import('expo-image-picker');
      
      // Request camera permissions
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Camera access is needed to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        await savePhotoRecord(uri, undefined);
        Alert.alert('✨ BeReal Created!', 'Your authentic moment has been captured!');
        router.replace('/(tabs)/feed');
      }
    } catch (err) {
      console.error('takePhotoWithPicker error', err);
      Alert.alert('Camera Error', 'Could not access camera. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function pickFromLibrary() {
    try {
      setLoading(true);
      const ImagePicker = await import('expo-image-picker');
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        await savePhotoRecord(uri, undefined);
        Alert.alert('✨ BeReal Created!', 'Your photo has been shared!');
        router.replace('/(tabs)/feed');
      }
    } catch (err) {
      console.error('pickFromLibrary error', err);
      Alert.alert('Gallery Error', 'Could not access photo library. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function simulateBeReal() {
    try {
      setLoading(true);
      
      // Create a simulated BeReal with placeholder images
      const demoPhotos = [
        'https://picsum.photos/400/600?random=' + Date.now(),
        'https://picsum.photos/800/1200?random=' + (Date.now() + 1)
      ];
      
      await savePhotoRecord(demoPhotos[0], demoPhotos[1]);
      Alert.alert('✨ Demo BeReal Created!', 'A sample BeReal has been created for testing!');
      router.replace('/(tabs)/feed');
    } catch (err) {
      console.error('simulateBeReal error', err);
      Alert.alert('Error', 'Could not create demo BeReal.');
    } finally {
      setLoading(false);
    }
  }

  // Legacy fallback function
  async function pickImageFallback() {
    await takePhotoWithPicker();
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
          <TouchableOpacity style={styles.actionButton} onPress={start}>
            <Text style={styles.actionButtonText}>Start Web Camera</Text>
          </TouchableOpacity>
        ) : (
          <>
            {/* @ts-ignore - using native DOM video element in react-native-web */}
            <video ref={videoRef} style={{ width: 320, height: 240, backgroundColor: '#000' }} />
            <View style={{ height: 8 }} />
            <TouchableOpacity style={styles.actionButton} onPress={capture}>
              <Text style={styles.actionButtonText}>Capture</Text>
            </TouchableOpacity>
            <View style={{ height: 8 }} />
            {captured ? (
              <>
                {/* show thumbnail using an img tag on web */}
                {/* @ts-ignore */}
                <img src={captured} alt="preview" style={{ width: 160, height: 120, marginTop: 8 }} />
                <View style={{ height: 8 }} />
                <TouchableOpacity style={styles.saveButton} onPress={save}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
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
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const Camera = CameraComponent;

  // Render native camera with an onCameraReady flag to avoid black preview
  const [cameraReady, setCameraReady] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>BeReal.</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.cameraContainer}>
        <Camera
          style={styles.camera}
          ref={cameraRef}
          ratio="16:9"
          type={cameraType}
          onCameraReady={() => setCameraReady(true)}
        />
        {!cameraReady && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Preparing camera...</Text>
          </View>
        )}
        
        {/* Camera type indicator */}
        <View style={styles.cameraIndicator}>
          <Text style={styles.cameraIndicatorText}>
            {cameraType === 'front' ? '🤳' : '📸'}
          </Text>
        </View>
      </View>

      <View style={styles.controls}>
        <View style={styles.photoStatus}>
          <View style={[styles.statusDot, { backgroundColor: backPhoto ? '#4CAF50' : '#666' }]} />
          <Text style={styles.statusText}>Back camera</Text>
          <View style={[styles.statusDot, { backgroundColor: frontPhoto ? '#4CAF50' : '#666' }]} />
          <Text style={styles.statusText}>Front camera</Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.switchButton} 
            onPress={switchCamera}
            disabled={loading}
          >
            <Text style={styles.switchButtonText}>🔄</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.captureButton, loading && styles.captureButtonDisabled]} 
            onPress={captureBoth}
            disabled={loading}
          >
            <View style={styles.captureButtonInner}>
              <Text style={styles.captureButtonText}>
                {loading ? '⏳' : '📸'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.singleCaptureButton, loading && styles.captureButtonDisabled]} 
            onPress={takePicture}
            disabled={loading}
          >
            <Text style={styles.singleCaptureText}>Single</Text>
          </TouchableOpacity>
        </View>

        {(backPhoto && frontPhoto) && (
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={saveBoth}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Posting...' : '✨ Post BeReal'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    zIndex: 10,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  headerRight: {
    width: 32,
  },
  title: { fontSize: 22, marginBottom: 12, color: '#fff' },
  note: { color: 'gray' },
  cameraContainer: { 
    flex: 1, 
    position: 'relative',
    marginHorizontal: 0,
  },
  camera: { flex: 1 },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  cameraIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIndicatorText: {
    fontSize: 20,
  },
  controls: { 
    paddingHorizontal: 20,
    paddingVertical: 30,
    backgroundColor: '#000',
  },
  photoStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: '#ccc',
    fontSize: 12,
    marginRight: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  switchButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchButtonText: {
    fontSize: 24,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#000',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonText: {
    fontSize: 32,
  },
  singleCaptureButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  singleCaptureText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginVertical: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  fallbackButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginVertical: 8,
    alignItems: 'center',
  },
  fallbackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#333',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginVertical: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.5,
  },
  expoGoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#ccc',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 20,
    maxWidth: 300,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 30,
  },
  primaryActionButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryActionButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryActionButton: {
    backgroundColor: '#333',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
  },
  secondaryActionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  simulateButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  simulateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
