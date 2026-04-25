import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { createClient } from '@supabase/supabase-js'
import { app } from './firebase'

const storage = getStorage(app)

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY
) as string | undefined
const documentBucket = (import.meta.env.VITE_SUPABASE_DOCUMENT_BUCKET as string | undefined) ?? 'patient-documents'
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

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
  if (supabase) {
    const safeName = file.name.replace(/[^\w.\-]+/g, '_')
    const path = `users/${uid}/documents/${docId}/${safeName}`
    onProgress?.(15)

    const { error } = await supabase.storage
      .from(documentBucket)
      .upload(path, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      throw new Error(`Supabase Storage upload failed: ${error.message}`)
    }

    onProgress?.(85)
    const { data: signed, error: signedError } = await supabase.storage
      .from(documentBucket)
      .createSignedUrl(path, 60 * 60 * 24 * 7)

    if (signedError || !signed?.signedUrl) {
      throw new Error(`Supabase Storage link failed: ${signedError?.message ?? 'No signed URL returned'}`)
    }

    onProgress?.(100)
    return { downloadUrl: signed.signedUrl, storagePath: `supabase://${documentBucket}/${path}` }
  }

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
