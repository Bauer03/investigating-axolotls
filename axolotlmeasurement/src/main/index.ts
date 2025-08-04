import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { fileOptions, DeletionCriteria, ImageUpdateData } from '../types'
import fetch from 'node-fetch'
import Database from 'better-sqlite3'

export const db = new Database(join(app.getPath('userData'), 'axolotl-measurements.db'))

// Create table if it doesn't exist, this runs every time app starts, but only triggers if no db exists.
db.exec(`
  CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    inputPath TEXT UNIQUE,
    processed BOOLEAN,
    verified BOOLEAN,
    keypoints TEXT
  )
`)

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
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

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

  ipcMain.handle('process-images', async (event, paths: string[]) => {
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
      return data.data
    } catch (error) {
      console.error('Error processing images:', error)
      return { error: 'Failed to process images' }
    }
  })

  // Get all images from the database
  ipcMain.handle('db:get-all-images', () => {
    return db
      .prepare('SELECT * FROM images')
      .all()
      .map((img) => ({
        ...img,
        processed: Boolean(img.processed), // aaaargh
        verified: Boolean(img.verified), // january 2035
        data: { keypoints: JSON.parse(img.keypoints || '[]') }
      }))
  })

  // Add image to database
  ipcMain.handle('db:add-image', (event, image) => {
    const stmt = db.prepare(
      'INSERT INTO images (name, inputPath, processed, verified, keypoints) VALUES (?, ?, ?, ?, ?)'
    )
    // Keypoints stored as JSON string
    stmt.run(
      image.name,
      image.inputPath,
      image.processed ? 1 : 0, // Convert boolean to integer, sqlite can't take bool for some reasaon
      image.verified ? 1 : 0, // same here
      JSON.stringify(image.data.keypoints)
    )
  })

  // Singe image deletion
  ipcMain.handle('db:delete-image', (event, inputPath: string) => {
    const stmt = db.prepare('DELETE FROM images WHERE inputPath = ?')
    const result = stmt.run(inputPath)
    // result.changes will be 1 if a row was deleted, 0 otherwise.
    return result.changes > 0
  })

  // got help from mr gpt here, haven't written proper sql before. turns out it's pretty cool heehe
  ipcMain.handle('db:delete-images-where', (event, criteria: DeletionCriteria) => {
    let whereClause = 'WHERE 1 = 1' // Start with a clause that is always true
    const params: (number | string)[] = []

    if (criteria.processed !== undefined) {
      whereClause += ' AND processed = ?'
      params.push(criteria.processed ? 1 : 0)
    }
    if (criteria.verified !== undefined) {
      whereClause += ' AND verified = ?'
      params.push(criteria.verified ? 1 : 0)
    }

    // To prevent accidentally deleting everything if no criteria are passed
    if (params.length === 0) {
      console.error('Attempted to delete without any criteria. Aborting.')
      return 0
    }

    const query = `DELETE FROM images ${whereClause}`
    const stmt = db.prepare(query)
    const result = stmt.run(...params)

    return result.changes
  })

  ipcMain.handle('db:update-image', (event, inputPath: string, data: ImageUpdateData) => {
    // Convert boolean values to integers before building the query
    const convertedData: Record<string, unknown> = { ...data }
    if ('processed' in convertedData && typeof convertedData.processed === 'boolean') {
      convertedData.processed = convertedData.processed ? 1 : 0
    }
    if ('verified' in convertedData && typeof convertedData.verified === 'boolean') {
      convertedData.verified = convertedData.verified ? 1 : 0
    }

    const setClauses = Object.keys(convertedData)
      .map((key) => `${key} = ?`)
      .join(', ')
    const params = Object.values(convertedData)

    if (params.length === 0) {
      return 0 // Nothing to update
    }

    const query = `UPDATE images SET ${setClauses} WHERE inputPath = ?`
    const stmt = db.prepare(query)
    const result = stmt.run(...params, inputPath) // inputPath is the last param for the WHERE clause

    return result.changes
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
          filters: [{ name: 'Images', extensions: ['jpeg', 'jpg', 'png', 'gif'] }]
        }
      : {
          properties: ['openDirectory', 'createDirectory']
        }

  const result = await dialog.showOpenDialog(win, options)

  // note that I'm allowing the user to send an image through the model multiple times, since this might be an intended behavior.
  // this doens't mean you can select the same image multiple times - that's being prevented.
  if (!result.canceled) {
    if (type === 'file') {
      console.log('Picked: ' + result.filePaths)
      return result.filePaths
    } else {
      let filePaths: string[] = []
      try {
        filePaths = await requestFolderContents(result.filePaths[0]) // assuming this is the way to get a folder's path lol
        return filePaths
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

// async function handleProcessedImage() {
// hmm don't think i actually need this but leaving for train of thought
// }

/**
 * Passes in folder path to python server, returns file paths in that folder if they exist.
 */
async function requestFolderContents(folderPath: string): Promise<string[]> {
  try {
    const response = await fetch('http://localhost:8001/get-folder-contents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ path: folderPath })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`)
    }

    const filePaths: string[] = await response.json()
    console.log('Backend returned files: ', filePaths)
    return filePaths
  } catch (error) {
    console.error('Error getting folder contents: ', error)
    throw error
  }
}
