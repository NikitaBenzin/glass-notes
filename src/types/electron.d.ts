import { ElectronAPI } from '../../electron/preload';

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};
