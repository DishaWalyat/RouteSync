import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { getDb } from './firebase.ts'
import type { SharedMaterial } from '../types/academic.ts'
import { deleteStoredFiles, uploadSharedFile } from './storage.ts'
import { asNumber, asString, stamp } from './records.ts'

function sharedMaterialsCollection() {
  return collection(getDb(), 'sharedMaterials')
}

function mapSharedMaterial(id: string, data: Record<string, unknown>): SharedMaterial {
  const role = asString(data.uploaderRole) === 'admin' ? 'admin' : 'teacher'
  return {
    id,
    title: asString(data.title),
    subjectId: asString(data.subjectId),
    subjectName: asString(data.subjectName),
    fileName: asString(data.fileName),
    fileType: asString(data.fileType),
    storagePath: asString(data.storagePath),
    downloadURL: asString(data.downloadURL),
    fileSize: asNumber(data.fileSize),
    uploadedByUid: asString(data.uploadedByUid),
    uploadedByName: asString(data.uploadedByName),
    uploaderRole: role,
    uploadedAt: stamp(data.uploadedAt),
  }
}

export function watchSharedMaterials(
  onData: (rows: SharedMaterial[]) => void,
  onError: (error: Error) => void,
) {
  const q = query(sharedMaterialsCollection(), orderBy('uploadedAt', 'desc'))
  return onSnapshot(
    q,
    (snapshot) =>
      onData(snapshot.docs.map((item) => mapSharedMaterial(item.id, item.data() as Record<string, unknown>))),
    (error) => onError(error),
  )
}

export async function uploadAndPublishMaterial(params: {
  file: File
  title: string
  subjectId: string
  subjectName: string
  authorUid: string
  authorName: string
  authorRole: 'teacher' | 'admin'
}) {
  const uploaded = await uploadSharedFile(params.subjectId, params.file)
  try {
    const docRef = await addDoc(sharedMaterialsCollection(), {
      title: params.title || params.file.name,
      subjectId: params.subjectId,
      subjectName: params.subjectName,
      fileName: uploaded.fileName,
      fileType: uploaded.fileType,
      storagePath: uploaded.storagePath,
      downloadURL: uploaded.downloadURL,
      fileSize: uploaded.fileSize,
      uploadedByUid: params.authorUid,
      uploadedByName: params.authorName,
      uploaderRole: params.authorRole,
      uploadedAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    await deleteStoredFiles([uploaded.storagePath])
    throw error
  }
}

export async function deleteSharedMaterial(material: SharedMaterial) {
  await deleteStoredFiles([material.storagePath])
  await deleteDoc(doc(getDb(), 'sharedMaterials', material.id))
}
