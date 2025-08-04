import { contextBridge, ipcRenderer } from 'electron'
import { promises as fs } from 'fs'
import { electronAPI } from '@electron-toolkit/preload'
import { fileOptions, AxolotlAPI, AxoData, ProcessError, ProcessSuccess } from '../types'

const api: AxolotlAPI = {
  getDBImages: () => ipcRenderer.invoke('db:get-all-images'),
  addDBImage: (image) => ipcRenderer.invoke('db:add-image', image),
  deleteImagesWhere: (criteria) => ipcRenderer.invoke('db:delete-images-where', criteria),
  deleteImage: (inputPath) => ipcRenderer.invoke('db:delete-image', inputPath),
  updateImage: (inputPath, data) => ipcRenderer.invoke('db:update-image', inputPath, data),
  debug: { dumpDB: () => ipcRenderer.invoke('debug:dump-db') },

  fileUploadRequest: (type: fileOptions): Promise<string[]> =>
    ipcRenderer.invoke('file-upload-request', type),

  fs: {
    readFile: async (filePath: string, encoding?: BufferEncoding): Promise<string | Buffer> => {
      if (encoding) {
        return fs.readFile(filePath, encoding)
      } else {
        return fs.readFile(filePath)
      }
    },

    writeFile: async (filePath: string, data: string | Buffer): Promise<void> => {
      await fs.writeFile(filePath, data)
    },

    readFolder: async (
      filePaths: string[],
      encoding?: BufferEncoding
    ): Promise<string[] | Buffer[]> => {
      if (encoding) {
        const readpaths: string[] = []
        for (const path of filePaths) {
          const content = await fs.readFile(path, encoding)
          readpaths.push(content as string)
        }
        return readpaths
      } else {
        const readpaths: Buffer[] = []
        for (const path of filePaths) {
          const content = await fs.readFile(path)
          readpaths.push(content as Buffer)
        }
        return readpaths
      }
    },

    processImages: async (paths: string[]): Promise<ProcessSuccess | ProcessError> => {
      try {
        const result: AxoData[] = await ipcRenderer.invoke('process-images', paths)
        return { message: 'Images processed successfully', data: result } as ProcessSuccess
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        } as ProcessError
      }
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
