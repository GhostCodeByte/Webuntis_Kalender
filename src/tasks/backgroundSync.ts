import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { runSync } from '../services/syncService';
import { getSettingsWithSecrets } from '../state/settingsStore';

const TASK_NAME = 'webuntis-background-sync';
const LAST_RUN_KEY = 'webuntis:lastBackgroundSync';

if (!TaskManager.isTaskDefined(TASK_NAME)) {
  TaskManager.defineTask(TASK_NAME, async () => {
    try {
      const settings = await getSettingsWithSecrets();
      if (!settings.autoSyncEnabled) {
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      if (!(await shouldRunNow(settings.autoSyncTime))) {
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      await runSync({ settings, pushToCalendar: true });
      await AsyncStorage.setItem(LAST_RUN_KEY, new Date().toISOString());
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
      console.error('Background sync failed', error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
}

export async function registerBackgroundSync() {
  const status = await BackgroundFetch.getStatusAsync();
  if (status === BackgroundFetch.BackgroundFetchStatus.Restricted || status === BackgroundFetch.BackgroundFetchStatus.Denied) {
    return false;
  }

  try {
    await BackgroundFetch.registerTaskAsync(TASK_NAME, {
      minimumInterval: 60 * 30,
      stopOnTerminate: false,
      startOnBoot: true
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already registered')) {
      return true;
    }
    throw error;
  }
  return true;
}

async function shouldRunNow(targetTime: string) {
  const lastRun = await AsyncStorage.getItem(LAST_RUN_KEY);
  const today = new Date().toDateString();
  if (lastRun && new Date(lastRun).toDateString() === today) {
    return false;
  }

  const now = new Date();
  const [hours, minutes] = targetTime.split(':').map((value) => Number(value) || 0);
  const scheduled = new Date();
  scheduled.setHours(hours, minutes, 0, 0);

  return now >= scheduled;
}
