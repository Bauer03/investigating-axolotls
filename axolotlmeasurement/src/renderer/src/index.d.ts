// import { ElectronAPI } from '@electron-toolkit/preload'
import { fileOptions } from '../../types'

declare global {
  interface Window {
    api: {
      fileUploadRequest: (type: fileOptions) => void
    }
  }
}
