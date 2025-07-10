export type fileOptions = 'file' | 'folder'

export interface ImageFile {
  name: string // Not sure whether I need to watch for duplicate images somewhere?
  inputPath: string // sent to model
  verified: boolean // no output path is necessary, I can just disregard model output.
  distance?: number // model doesn't return this for now, this is just futureproofing. fill in manually with pixel distance
  keypoints?: number[] // array containing the coordinates for all keypoints
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
