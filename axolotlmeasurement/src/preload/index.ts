import { contextBridge, ipcRenderer } from 'electron'
import { promises as fs } from 'fs'
// import * as path from 'path'
import { electronAPI } from '@electron-toolkit/preload'
import { fileOptions } from '../types' // Assuming you have this type defined

const api = {
  fileUploadRequest: (type: fileOptions): Promise<string[]> =>
    ipcRenderer.invoke('file-upload-request', type),

  fs: {
    // only adding async versions for now, assuming that's all i'll need.
    readFile: async (filePath: string, encoding: BufferEncoding = 'utf8'): Promise<string> => {
      // todo: make sure path is in app's user data directory?
      return fs.readFile(filePath, encoding)
    },

    writeFile: async (filePath: string, data: string): Promise<void> => {
      fs.writeFile(filePath, data)
    }

    // may need to add 'exists' function for output file modification later on.
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api) // 'api' now includes your fs methods!
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
