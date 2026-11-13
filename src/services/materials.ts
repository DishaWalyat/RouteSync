import { serverTimestamp } from 'firebase/firestore'
import type { Material } from '../types/academic.ts'
import { deleteStoredFiles, uploadUserFile } from './storage.ts'
import { linkAssignmentFile, unlinkAssignmentFile } from './assignments.ts'
import { linkLectureFile, unlinkLectureFile } from './lectures.ts'
import { asNumber, asString, removeRecord, stamp, userCollection, watchRecords } from './records.ts'
import { doc, setDoc } from 'firebase/firestore'

function mapMaterial(id: string, data: Record<string, unknown>): Material {
  return {
    id,
    subjectId: asString(data.subjectId),
    lectureId: asString(data.lectureId),
    assignmentId: asString(data.assignmentId),
    fileName: asString(data.fileName),
    fileType: asString(data.fileType),
    storagePath: asString(data.storagePath),
    downloadURL: asString(data.downloadURL),
    fileSize: asNumber(data.fileSize),
    uploadedAt: stamp(data.uploadedAt),
  }
}

export function watchMaterials(uid: string, onData: (rows: Material[]) => void, onError: (error: Error) => void) {
  return watchRecords(uid, 'materials', mapMaterial, onData, onError)
}

export async function addMaterial(uid: string, file: File, subjectId: string, lectureId = '', assignmentId = '') {
  if (!subjectId) throw new Error('Choose a subject before uploading.')
  const uploaded = await uploadUserFile(uid, subjectId, file)
  const ref = doc(userCollection(uid, 'materials'))
  try {
    await setDoc(ref, {
      subjectId,
      lectureId,
      assignmentId,
      fileName: uploaded.fileName,
      fileType: uploaded.fileType,
      storagePath: uploaded.storagePath,
      downloadURL: uploaded.downloadURL,
      fileSize: uploaded.fileSize,
      uploadedAt: serverTimestamp(),
    })
  } catch (error) {
    await deleteStoredFiles([uploaded.storagePath])
    throw error
  }
  if (lectureId) await linkLectureFile(uid, lectureId, ref.id)
  if (assignmentId) await linkAssignmentFile(uid, assignmentId, ref.id)
  return ref.id
}

export async function deleteMaterial(uid: string, material: Material) {
  await deleteStoredFiles([material.storagePath])
  if (material.lectureId) await unlinkLectureFile(uid, material.lectureId, material.id)
  if (material.assignmentId) await unlinkAssignmentFile(uid, material.assignmentId, material.id)
  await removeRecord(uid, 'materials', material.id)
}
