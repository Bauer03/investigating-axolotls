export type fileOptions = 'file' | 'folder'

export interface ImageFile {
  name: string
  filePath: string
}

export interface AxolotlAPI {
  fileUploadRequest: (type: fileOptions) => Promise<string[]>
  fs: {
    readFile: (filePath: string, encoding?: BufferEncoding) => Promise<string | Buffer>
    writeFile: (filePath: string, data: string | Buffer) => Promise<void>
    readFolder: (filePaths: string[], encoding?: BufferEncoding) => Promise<string[] | Buffer[]>
  }
}

declare global {
  interface Window {
    electron: unknown
    api: AxolotlAPI
  }
}
