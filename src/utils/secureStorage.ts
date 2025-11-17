import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FALLBACK_PREFIX = 'secure:';
let secureStoreAvailable: boolean | null = null;

async function canUseSecureStore() {
  if (secureStoreAvailable !== null) {
    return secureStoreAvailable;
  }
  try {
    secureStoreAvailable = await SecureStore.isAvailableAsync();
  } catch (error) {
    console.warn('SecureStore unavailable, falling back to AsyncStorage', error);
    secureStoreAvailable = false;
  }
  return secureStoreAvailable;
}

export async function saveSecret(key: string, value?: string) {
  const useSecure = await canUseSecureStore();
  if (!value) {
    if (useSecure) {
      await SecureStore.deleteItemAsync(key);
    }
    await AsyncStorage.removeItem(`${FALLBACK_PREFIX}${key}`);
    return;
  }

  if (useSecure) {
    await SecureStore.setItemAsync(key, value);
  }
  await AsyncStorage.setItem(`${FALLBACK_PREFIX}${key}`, value);
}

export async function getSecret(key: string) {
  const useSecure = await canUseSecureStore();
  if (useSecure) {
    const value = await SecureStore.getItemAsync(key);
    if (value) {
      return value;
    }
  }
  return AsyncStorage.getItem(`${FALLBACK_PREFIX}${key}`);
}