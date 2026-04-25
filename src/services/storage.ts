import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { app } from './firebase'

const storage = getStorage(app)

export type UploadProgress = {
  progress: number
  downloadUrl?: string
  error?: string
}

export async function uploadPatientDocument(
  uid: string,
  docId: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<{ downloadUrl: string; storagePath: string }> {
  const path = `users/${uid}/documents/${docId}/${file.name}`
  const storageRef = ref(storage, path)
  const uploadTask = uploadBytesResumable(storageRef, file)

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        onProgress?.(pct)
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref)
        resolve({ downloadUrl: url, storagePath: path })
      }
    )
  })
}

export async function uploadPatientPhoto(
  uid: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<{ downloadUrl: string; storagePath: string }> {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `users/${uid}/profile/photo.${extension}`
  const storageRef = ref(storage, path)
  const uploadTask = uploadBytesResumable(storageRef, file)

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        onProgress?.(pct)
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref)
        resolve({ downloadUrl: url, storagePath: path })
      }
    )
  })
}

export { storage }
