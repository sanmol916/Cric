import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * A boolean flag persisted in AsyncStorage. Returns [value, setTrue, loaded].
 */
export function usePersistedFlag(key: string): {
  value: boolean;
  loaded: boolean;
  setValue: (v: boolean) => void;
} {
  const [value, setState] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (active) setState(raw === 'true');
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [key]);

  const setValue = useCallback(
    (v: boolean) => {
      setState(v);
      AsyncStorage.setItem(key, v ? 'true' : 'false').catch(() => {});
    },
    [key],
  );

  return { value, loaded, setValue };
}
