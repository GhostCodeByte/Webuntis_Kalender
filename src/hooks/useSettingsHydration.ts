import { useEffect, useState } from 'react';
import { useSettingsStore } from '@/src/state/settingsStore';

export function useSettingsHydration() {
  const [hydrated, setHydrated] = useState<boolean>(useSettingsStore.persist.hasHydrated());

  useEffect(() => {
    if (hydrated) {
      return;
    }
    const unsub = useSettingsStore.persist.onFinish(() => setHydrated(true));
    return () => {
      unsub?.();
    };
  }, [hydrated]);

  return hydrated;
}
