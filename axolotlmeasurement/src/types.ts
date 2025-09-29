// src/types.ts

// Used when the user selects files or folders through the dialog
export type fileOptions = 'file' | 'folder'

// The fundamental keypoint structure - a labeled point in 2D space
export interface Keypoint {
  name: string  // Like "Snout", "Neck", etc.
  x: number     // X coordinate in pixels (relative to original image size)
  y: number     // Y coordinate in pixels (relative to original image size)
}

// The main structure for an image in your application
// Everything lives directly on this object - no nested "data" property
export interface ImageFile {
  inputPath: string      // Full file path to the original image
  outputPath: string     // Where processed image should be saved (if needed)
  name: string           // Just the filename, like "axolotl_001.jpg"
  processed: boolean     // Has the ML model run on this image?
  verified: boolean      // Has the user confirmed the keypoints are correct?
  keypoints: Keypoint[]  // The keypoint data - always present, empty array if none
  boundingBox: number[]  // Bounding box coordinates [x1, y1, x2, y2] - empty if none
}

// This interface describes what the Python backend returns
// It exists ONLY to type the backend response - you'll convert it to ImageFile immediately
export interface AxoData {
  image_name: string      // Matches ImageFile.name
  bounding_box: number[]  // Gets converted to ImageFile.boundingBox
  keypoints: Keypoint[] | number[][]  // Backend might return nested arrays, we normalize this
}

// Used to specify which images to delete in bulk operations
// For example: { processed: true, verified: false } deletes all unverified processed images
export interface DeletionCriteria {
  processed?: boolean
  verified?: boolean
}

// Used when updating an image's properties
// This allows partial updates - you only specify what you want to change
export interface ImageUpdateData {
  processed?: boolean
  verified?: boolean
  keypoints?: Keypoint[]
  boundingBox?: number[]
}

// The successful response from image processing
export interface ProcessSuccess {
  message: string
  data: AxoData[]  // Array of results from the backend
}

// The error response from image processing
export interface ProcessError {
  error: string
  details?: string
}

// This defines all the API methods available from the renderer process
// It maps to what you expose in preload/index.ts
export interface AxolotlAPI {
  // File selection dialog
  fileUploadRequest: (type: fileOptions) => Promise<string[]>

  // Database operations
  getDBImages: () => Promise<ImageFile[]>
  addDBImage: (image: ImageFile) => Promise<void>
  deleteImage: (inputPath: string) => Promise<boolean>
  deleteImagesWhere: (criteria: DeletionCriteria) => Promise<number>
  updateImage: (inputPath: string, data: ImageUpdateData) => Promise<number>

  // Debug utilities
  debug: {
    dumpDB: () => Promise<unknown>
  }

  // File system and processing operations
  fs: {
    readFile: (filePath: string, encoding?: BufferEncoding) => Promise<string | Buffer>
    writeFile: (filePath: string, data: string | Buffer) => Promise<void>
    readFolder: (filePaths: string[], encoding?: BufferEncoding) => Promise<string[] | Buffer[]>
    processImages: (paths: string[]) => Promise<ProcessSuccess | ProcessError>
  }

  // Batch download functionality
  downloadAllImages: (
    files: { name: string; data: string }[]
  ) => Promise<{ success: boolean; message: string }>
}

// Structure of your JSON database file
export interface ImageDatabase {
  version: number  // For future migrations if you change the structure
  images: ImageFile[]
  metadata: {
    lastModified: string
    totalImages: number
  }
}

// Make the API available on the window object globally
declare global {
  interface Window {
    electron: unknown
    api: AxolotlAPI
  }
}
