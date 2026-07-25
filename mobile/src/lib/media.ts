import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

function rid(): string {
  return `img_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

/**
 * Copy a picked/temporary image into the app's document directory so it
 * survives app restarts. Falls back to the original URI on any failure.
 */
async function persist(srcUri: string): Promise<string> {
  try {
    const dir = `${FileSystem.documentDirectory}images/`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
    const ext = (srcUri.split('.').pop() ?? 'jpg').split('?')[0].slice(0, 5) || 'jpg';
    const dest = `${dir}${rid()}.${ext}`;
    await FileSystem.copyAsync({ from: srcUri, to: dest });
    return dest;
  } catch {
    return srcUri;
  }
}

/** Launch the photo library and return a persisted image URI (or null). */
export async function pickImageFromLibrary(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.6,
  });
  if (result.canceled || !result.assets?.length) return null;
  return persist(result.assets[0].uri);
}

/** Launch the camera and return a persisted image URI (or null). */
export async function takePhoto(): Promise<string | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.6,
  });
  if (result.canceled || !result.assets?.length) return null;
  return persist(result.assets[0].uri);
}
