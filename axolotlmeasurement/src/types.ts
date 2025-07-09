export type fileOptions = 'file' | 'folder'

export interface ImageFile {
  name: string // to display file name (helps user identify files, say in case they want to remove them, or check if one already exists)
  inputPath: string // sent to model for processing. no idea right now if that will require some kind of processing, we'll see.
  outputPath: string | undefined // path to output files, for now being determined by python model.
  distance?: number // this is the main thing we're trying to display in this program.
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
