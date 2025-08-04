export type fileOptions = 'file' | 'folder'

// src/types.ts

export type AxoData = {
  image_name: string
  bounding_box: number[][]
  keypoints: number[][]
}

// passed to deletion functions, used to determine WHAT images to delete. for single deletions, unnecessary. only need path.
export interface DeletionCriteria {
  processed?: boolean
  verified?: boolean
}
export interface ImageUpdateData {
  processed?: boolean
  verified?: boolean
  keypoints?: string
}

// probably overcomplicating things but lets me clearly see if i have a problem
export type ProcessSuccess = {
  message: string
  data: AxoData[]
}

export type ProcessError = {
  error: string
  details?: string
}

// Defining types for API, needs to be done every time I add to preload
export interface AxolotlAPI {
  fileUploadRequest: (type: fileOptions) => Promise<string[]>
  getDBImages: () => Promise<ImageFile[]>
  addDBImage: (image: ImageFile) => Promise<void>
  deleteImage(inputPath: string): Promise<boolean>
  deleteImagesWhere: (criteria: DeletionCriteria) => Promise<number>
  updateImage: (inputPath: string, data: ImageUpdateData) => Promise<number>

  fs: {
    readFile: (filePath: string, encoding?: BufferEncoding) => Promise<string | Buffer>
    writeFile: (filePath: string, data: string | Buffer) => Promise<void>
    readFolder: (filePaths: string[], encoding?: BufferEncoding) => Promise<string[] | Buffer[]>
    processImages: (paths: string[]) => Promise<ProcessSuccess | ProcessError>
  }
}

export interface ImageFile {
  name: string
  inputPath: string
  processed: boolean
  verified: boolean
  data?: AxoData
}

/**
 * Calculates the Euclidean distance between two keypoints.
 * Pulled from online. May have to format stuff before passing it to this if there are erorrs
 */
// export function calculateDistance(points: Keypoint[]): number {
//   if (points.length < 2) {
//     return 0
//   }

//   // Example for two points. This can be adapted to sum the distances
//   // between sequential points if the model returns a series of them.
//   const point1 = points[0]
//   const point2 = points[1]

//   const dx = point2.x - point1.x
//   const dy = point2.y - point1.y

//   return Math.sqrt(dx * dx + dy * dy)
// }

declare global {
  interface Window {
    electron: unknown
    api: AxolotlAPI
  }
}
