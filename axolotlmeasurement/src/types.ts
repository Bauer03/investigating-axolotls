export type fileOptions = 'file' | 'folder'

export type AxoData = {
  image_name: string
  bounding_box: [number[]]
  keypoints: [number[]]
}

export interface ImageFile {
  name: string // may change to uid if poses issues
  inputPath: string
  processed: boolean // tracks whether image has been returned from model. set to true after image returned from model.
  verified: boolean // tracks user confirmation of model-returned data. set to true after user clicks validate image.
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

export interface AxolotlAPI {
  fileUploadRequest: (type: fileOptions) => Promise<string[]>
  fs: {
    readFile: (filePath: string, encoding?: BufferEncoding) => Promise<string | Buffer>
    writeFile: (filePath: string, data: string | Buffer) => Promise<void>
    readFolder: (filePaths: string[], encoding?: BufferEncoding) => Promise<string[] | Buffer[]>
    processImages: (paths: string[]) => Promise<AxoData[]>
  }
}

declare global {
  interface Window {
    electron: unknown
    api: AxolotlAPI
  }
}
