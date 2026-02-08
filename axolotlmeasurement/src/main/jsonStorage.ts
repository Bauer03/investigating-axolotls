import { app } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import { ImageFile } from '../types'

interface ImageDatabase {
  version: number
  images: ImageFile[]
  metadata: {
    lastModified: string
    totalImages: number
  }
}

export class JsonImageStorage {
  private dbPath: string
  private cache: ImageDatabase | null = null
  private saveTimeout: NodeJS.Timeout | null = null

  constructor() {
    // Store the JSON file in the same userData directory
    this.dbPath = join(app.getPath('userData'), 'axolotl-measurements.json')
  }

  /**
   * Initialize the storage - creates file if it doesn't exist
   */
  async init(): Promise<void> {
    try {
      await this.load()
      console.log('[JSON Storage] Loaded existing database')
    } catch (error) {
      // File doesn't exist, create initial structure
      console.log(error, '[JSON Storage] Err: Creating new database')
      const initialDb: ImageDatabase = {
        version: 1,
        images: [],
        metadata: {
          lastModified: new Date().toISOString(),
          totalImages: 0
        }
      }
      await this.save(initialDb)
    }
  }

  /**
   * Load the database from disk
   * This caches the data in memory for fast access
   */
  private async load(): Promise<ImageDatabase> {
    const content = await fs.readFile(this.dbPath, 'utf-8')
    this.cache = JSON.parse(content)
    return this.cache!
  }

  /**
   * Save the database to disk atomically
   * Uses a write-to-temp-then-rename strategy to prevent corruption
   */
  private async save(data: ImageDatabase): Promise<void> {
    // Update metadata
    data.metadata.lastModified = new Date().toISOString()
    data.metadata.totalImages = data.images.length

    // Write to temporary file first
    const tempPath = `${this.dbPath}.tmp`
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2))

    // Atomically rename temp file to actual database file
    // This prevents corruption if the app crashes during write
    await fs.rename(tempPath, this.dbPath)

    this.cache = data
    console.log(`[JSON Storage] Saved ${data.images.length} images`)
  }

  async updateImage(inputPath: string, updates: Partial<ImageFile>): Promise<number> {
    if (!this.cache) {
      await this.load()
    }

    const imageIndex = this.cache!.images.findIndex((img) => img.inputPath === inputPath)
    if (imageIndex === -1) {
      return 0
    }

    // Directly apply updates - no special keypoint handling needed
    this.cache!.images[imageIndex] = {
      ...this.cache!.images[imageIndex],
      ...updates
    }

    await this.saveDebounced()
    return 1
  }

  /**
   * Debounced save - prevents excessive disk writes when making multiple changes
   */
  private async saveDebounced(): Promise<void> {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }

    this.saveTimeout = setTimeout(async () => {
      if (this.cache) {
        await this.save(this.cache)
      }
    }, 500) // Wait 500ms after last change before saving
  }

  async getAllImages(): Promise<ImageFile[]> {
    if (!this.cache) {
      await this.load()
    }
    return this.cache!.images
  }

  async deleteImage(inputPath: string): Promise<boolean> {
    if (!this.cache) {
      await this.load()
    }

    const initialLength = this.cache!.images.length
    this.cache!.images = this.cache!.images.filter((img) => img.inputPath !== inputPath)

    const deleted = this.cache!.images.length < initialLength
    if (deleted) {
      await this.saveDebounced()
    }

    return deleted
  }

  async deleteImagesWhere(criteria: { processed?: boolean; verified?: boolean }): Promise<number> {
    if (!this.cache) {
      await this.load()
    }

    const initialLength = this.cache!.images.length

    this.cache!.images = this.cache!.images.filter((img) => {
      // Keep images that DON'T match the criteria
      if (criteria.processed !== undefined && img.processed === criteria.processed) {
        if (criteria.verified !== undefined && img.verified === criteria.verified) {
          return false // Delete this image
        } else if (criteria.verified === undefined) {
          return false // Delete this image
        }
      } else if (criteria.processed === undefined && criteria.verified !== undefined) {
        if (img.verified === criteria.verified) {
          return false // Delete this image
        }
      }
      return true // Keep this image
    })

    const deletedCount = initialLength - this.cache!.images.length
    if (deletedCount > 0) {
      await this.saveDebounced()
    }

    return deletedCount
  }

  async addImage(image: ImageFile): Promise<void> {
    if (!this.cache) {
      await this.load()
    }

    const exists = this.cache!.images.some((img) => img.inputPath === image.inputPath)
    if (exists) {
      throw new Error(`Image ${image.inputPath} already exists`)
    }

    this.cache!.images.push(image)
    await this.saveDebounced()
  }

  /**
   * Force an immediate save (useful for app shutdown)
   */
  async flush(): Promise<void> {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
      this.saveTimeout = null
    }
    if (this.cache) {
      await this.save(this.cache)
    }
  }

  /**
   * Debug method to dump the database structure
   */
  async dumpDatabase(): Promise<void> {
    if (!this.cache) {
      await this.load()
    }

    console.log('[JSON Storage] Database dump:')
    console.log(`Version: ${this.cache!.version}`)
    console.log(`Total images: ${this.cache!.metadata.totalImages}`)
    console.log(`Last modified: ${this.cache!.metadata.lastModified}`)

    if (this.cache!.images.length > 0) {
      console.table(
        this.cache!.images.map((img) => ({
          name: img.name,
          processed: img.processed,
          verified: img.verified,
          keypointCount: img.keypoints?.length || 0
        }))
      )
    }
  }
}
