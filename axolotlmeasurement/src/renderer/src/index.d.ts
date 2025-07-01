// import { ElectronAPI } from '@electron-toolkit/preload'
import { fileOptions } from '../../types'

declare global {
  interface Window {
    electron: unknown // ... listen i'll add stuff later
    api: AxolotlAPI
  }
}

export interface AxolotlAPI {
  fileUploadRequest: (type: fileOptions) => Promise<string[]>
  fs: {
    readFile: (filePath: string, encoding?: BufferEncoding) => Promise<string>
    writeFile: (filePath: string, data: string) => Promise<void>
  }
}
