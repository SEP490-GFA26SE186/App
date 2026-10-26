// apps/mobile/src/services/config.ts
import { Platform } from 'react-native';

export type ApiEnvironment = 'dev' | 'prod';

// Local dev default: Android emulator uses 10.0.2.2, Web/iOS uses localhost
const LOCAL_DEV_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:3000/api/v1'
    : 'http://localhost:3000/api/v1';

const PROD_URL = 'https://api.storyweaver.id.vn/api/v1';

export interface AppApiConfig {
  env: ApiEnvironment;
  customBaseUrl?: string;
}

let currentConfig: AppApiConfig = {
  env: 'dev',
};

export const getApiBaseUrl = (): string => {
  if (currentConfig.customBaseUrl && currentConfig.customBaseUrl.trim()) {
    return currentConfig.customBaseUrl.trim().replace(/\/+$/, '');
  }
  if (currentConfig.env === 'prod') {
    return PROD_URL;
  }
  return LOCAL_DEV_URL;
};

export const setApiEnvironment = (env: ApiEnvironment, customUrl?: string) => {
  // Giá trị ngoài 'dev' | 'prod' (vd 'mock' cũ) được đưa về 'dev'
  const safeEnv: ApiEnvironment = env === 'prod' ? 'prod' : 'dev';
  currentConfig = {
    env: safeEnv,
    customBaseUrl: customUrl,
  };
};

export const getApiEnvironment = (): ApiEnvironment => currentConfig.env;
