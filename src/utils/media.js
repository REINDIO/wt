import { reactive } from 'vue'

// 響應式本機媒體 URL 快取：IndexedDB 載入完成後元件會自動更新影像
export const mediaUrls = reactive({})

let mediaDBPromise

function mediaDB() {
  if (!mediaDBPromise) {
    mediaDBPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open('wantoo-media', 1)
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains('files')) {
          req.result.createObjectStore('files')
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }
  return mediaDBPromise
}

export async function putMedia(blob, name, type) {
  const db = await mediaDB()
  const id = 'media-' + Date.now() + '-' + Math.random().toString(36).slice(2)
  await new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite')
    tx.objectStore('files').put(blob, id)
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
  mediaUrls[id] = URL.createObjectURL(blob)
  return { id, name, type }
}

export function resolveMediaSrc(media) {
  if (!media) return ''
  return media.src || mediaUrls[media.id] || ''
}

export async function restoreMedia(stateObj, onError) {
  const refs = new Set()
  function scan(obj) {
    if (!obj || typeof obj !== 'object') return
    if (obj.id && typeof obj.id === 'string' && obj.id.startsWith('media-')) {
      refs.add(obj.id)
    }
    Object.values(obj).forEach((v) => {
      if (v && typeof v === 'object') scan(v)
    })
  }
  scan(stateObj)
  if (!refs.size) return
  try {
    const db = await mediaDB()
    await Promise.all(
      [...refs].map(
        (id) =>
          new Promise((resolve) => {
            if (mediaUrls[id]) {
              resolve()
              return
            }
            const request = db.transaction('files').objectStore('files').get(id)
            request.onsuccess = () => {
              if (request.result) {
                mediaUrls[id] = URL.createObjectURL(request.result)
              }
              resolve()
            }
            request.onerror = () => resolve()
          })
      )
    )
  } catch {
    onError?.('此瀏覽器無法讀取本機影像。')
  }
}

export async function prepareMedia(file) {
  const imageTypes = ['image/jpeg', 'image/png', 'image/webp']
  const videoTypes = ['video/mp4', 'video/webm']
  if (!imageTypes.includes(file.type) && !videoTypes.includes(file.type)) {
    throw new Error('請選擇 JPG、PNG、WebP、MP4 或 WebM。')
  }
  const isVideo = videoTypes.includes(file.type)
  if (file.size > (isVideo ? 20 : 10) * 1024 * 1024) {
    throw new Error(isVideo ? '單支影片上限 20 MB。' : '單張照片上限 10 MB。')
  }

  let blob = file
  if (!isVideo) {
    const bitmap = await createImageBitmap(file)
    const ratio = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * ratio)
    canvas.height = Math.round(bitmap.height * ratio)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
    if (!blob) throw new Error('照片處理失敗。')
  }

  return putMedia(blob, file.name, isVideo ? 'video' : 'image')
}
