import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { getFirebaseStorage } from './firebase.ts'
import { contentTypeFor, MAX_FILE_BYTES } from '../utils/files.ts'

function safeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/-+/g, '-').slice(0, 80)
}

export async function uploadUserFile(uid: string, subjectId: string, file: File) {
  const contentType = contentTypeFor(file.name)
  if (!contentType) throw new Error('Use a PDF, PPT, PPTX, DOC, DOCX, JPG, PNG, or WEBP file.')
  if (file.size > MAX_FILE_BYTES) throw new Error('Files must be under 20 MB.')
  const path = `users/${uid}/subjects/${subjectId}/${crypto.randomUUID()}-${safeName(file.name)}`
  const storageRef = ref(getFirebaseStorage(), path)
  await uploadBytes(storageRef, file, { contentType })
  const downloadURL = await getDownloadURL(storageRef)
  return { storagePath: path, downloadURL, fileType: contentType, fileName: file.name, fileSize: file.size }
}

export async function uploadShipmentFile(shipmentId: string, file: File) {
  const contentType = contentTypeFor(file.name)
  if (!contentType) throw new Error('Use a PDF, PPT, PPTX, DOC, DOCX, JPG, PNG, or WEBP file.')
  if (file.size > MAX_FILE_BYTES) throw new Error('Files must be under 20 MB.')
  const path = `shipments/${shipmentId}/${crypto.randomUUID()}-${safeName(file.name)}`
  const storageRef = ref(getFirebaseStorage(), path)
  await uploadBytes(storageRef, file, { contentType })
  const downloadURL = await getDownloadURL(storageRef)
  return { storagePath: path, downloadURL, fileType: contentType, fileName: file.name, fileSize: file.size }
}

export async function uploadSharedFile(subjectId: string, file: File) {
  const contentType = contentTypeFor(file.name)
  if (!contentType) throw new Error('Use a PDF, PPT, PPTX, DOC, DOCX, JPG, PNG, or WEBP file.')
  if (file.size > MAX_FILE_BYTES) throw new Error('Files must be under 20 MB.')
  const path = `shared/subjects/${subjectId}/${crypto.randomUUID()}-${safeName(file.name)}`
  const storageRef = ref(getFirebaseStorage(), path)
  await uploadBytes(storageRef, file, { contentType })
  const downloadURL = await getDownloadURL(storageRef)
  return { storagePath: path, downloadURL, fileType: contentType, fileName: file.name, fileSize: file.size }
}

export async function deleteStoredFiles(paths: string[]) {
  await Promise.all(
    paths.filter(Boolean).map(async (path) => {
      try {
        await deleteObject(ref(getFirebaseStorage(), path))
      } catch (error) {
        const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : ''
        if (code !== 'storage/object-not-found') throw error
      }
    }),
  )
}
