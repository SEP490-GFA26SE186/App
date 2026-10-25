// apps/mobile/src/services/config.ts
import { Platform } from 'react-native';

export type ApiEnvironment = 'dev' | 'prod' | 'mock';

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
  currentConfig = {
    env,
    customBaseUrl: customUrl,
  };
};

export const getApiEnvironment = (): ApiEnvironment => currentConfig.env;

export const DEMO_CREDENTIALS = {
  parent: {
    email: 'me.lanhuong@storyweaver.vn',
    password: '123456',
    role: 'parent',
    name: 'Mẹ Lan Hương',
    kidPin: '1234',
  },
  admin: {
    email: 'admin@storyweaver.vn',
    password: '123456',
    role: 'admin',
    name: 'Quản trị viên',
  },
  specialist: {
    email: 'kdv@storyweaver.vn',
    password: '123456',
    role: 'specialist',
    name: 'Chuyên gia sư phạm',
  },
};
