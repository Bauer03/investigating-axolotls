import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { DeletionCriteria, ImageFile, AxoData, fileOptions } from '../types'
import fetch from 'node-fetch'
import fs from 'fs'
import { JsonImageStorage } from './jsonStorage'
const storage = new JsonImageStorage()

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')
  await storage.init()

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('file-upload-request', async (event, type: fileOptions) => {
    const mainWindow = BrowserWindow.fromWebContents(event.sender)
    if (mainWindow) {
      const filepaths = await handleUploadRequest(mainWindow, type)
      mainWindow.focus() // in case file selection removes focus
      return filepaths
    }
    return []
  })

  ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
    const buffer = await fs.promises.readFile(filePath)
    return buffer.toString('base64')
  })

  ipcMain.handle(
    'download-all-images',
    async (_event, filesToSave: { name: string; data: string }[]) => {
      // user selects file directory for mass save. May make folder auto in future?
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Save Processed Images',
        buttonLabel: 'Save Here',
        defaultPath: 'processed-images.zip'
      })

      if (canceled || !filePath) {
        return { success: false, message: 'Save dialog was canceled.' }
      }

      const saveDirectory = join(filePath, '..')

      try {
        const savePromises = filesToSave.map((file) => {
          const base64Data = file.data.replace(/^data:image\/png;base64,/, '')
          const buffer = Buffer.from(base64Data, 'base64')
          const fullPath = join(saveDirectory, basename(file.name))
          return fs.promises.writeFile(fullPath, buffer)
        })

        await Promise.all(savePromises)

        return { success: true, message: `Successfully saved ${filesToSave.length} images.` }
      } catch (error) {
        console.error('Failed to save images:', error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        return { success: false, message: `Error saving files: ${errorMessage}` }
      }
    }
  )

  ipcMain.handle('process-images', async (_: unknown, paths: string[]) => {
    try {
      const response = await fetch('http://localhost:8001/process-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ paths: paths })
      })

      const data = await response.json()
      console.log('Response from backend:', data)
      return data.data as AxoData
    } catch (error) {
      console.error('Error processing images:', error)
      return { error: 'Failed to process images' }
    }
  })

  // Get all images from the database.
  ipcMain.handle('db:get-all-images', async () => {
    const images = await storage.getAllImages()
    // The images are already in the correct format now!
    return images
  })

  // Add image to database
  ipcMain.handle('db:add-image', async (_: unknown, image) => {
    try {
      await storage.addImage(image)
      console.log(`[Storage] Added image: ${image.name}`)
      return { success: true }
    } catch (error) {
      console.error(`[Storage] Error adding image:`, error)
      throw error
    }
  })

  // Singe image deletion
  ipcMain.handle('db:delete-image', async (_: unknown, inputPath: string) => {
    const deleted = await storage.deleteImage(inputPath)
    if (deleted) {
      console.log(`[Storage] Deleted image: ${inputPath}`)
    }
    return deleted
  })

  // got help from mr gpt here
  ipcMain.handle('db:delete-images-where', async (_: unknown, criteria: DeletionCriteria) => {
    const deletedCount = await storage.deleteImagesWhere(criteria)
    console.log(`[Storage] Bulk delete finished. Criteria:`, criteria, `Deleted: ${deletedCount}`)
    return deletedCount
  })

  ipcMain.handle(
    'db:update-image',
    async (_: unknown, inputPath: string, data: Partial<ImageFile>) => {
      const updateCount = await storage.updateImage(inputPath, data)
      console.log(`[Storage] Updated image: ${inputPath} with`, data)
      return updateCount
    }
  )

  // Prints contents of db
  ipcMain.handle('debug:dump-db', async () => {
    console.log('[DEBUG] Dumping database contents...')
    await storage.dumpDatabase()
  })
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', async () => {
  await storage.flush()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

/**
 * Handles "upload file".
 */
async function handleUploadRequest(win: BrowserWindow, type: fileOptions): Promise<string[]> {
  const options: Electron.OpenDialogOptions =
    type === 'file'
      ? {
          properties: ['openFile', 'multiSelections'],
          filters: [{ name: 'Images', extensions: ['jpeg', 'jpg', 'png'] }]
        }
      : {
          properties: ['openDirectory', 'createDirectory']
        }

  const result = await dialog.showOpenDialog(win, options)

  if (!result.canceled) {
    if (type === 'file') {
      console.log('Picked: ' + result.filePaths)
      return result.filePaths
    } else {
      try {
        const files = await fs.promises.readdir(result.filePaths[0])
        // console.log('debug for folder upload: ' + files)
        return files.map((file) => join(result.filePaths[0], file))
      } catch (error) {
        console.error('Error getting file paths from folder: ' + error)
        return []
      }
    }
  } else {
    console.log('User canceled file dialog.')
  }
  return []
}
function basename(name: string): string {
  return name.replace(/^.*[\\/]/, '')
}
