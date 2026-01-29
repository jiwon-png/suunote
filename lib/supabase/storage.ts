/**
 * Supabase Storage 유틸리티 함수
 * 파일 업로드, 다운로드, 삭제 기능 제공
 */

import { createClient } from '@/lib/supabase/client'
import { getErrorMessage, logError } from '@/lib/utils/errors'

/**
 * 파일 업로드
 * 
 * @param bucket Storage 버킷 이름
 * @param path 파일 경로 (예: `{userId}/{postId}/{fileName}`)
 * @param file 업로드할 파일
 * @returns 업로드된 파일의 공개 URL
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<{ data: string | null; error: Error | null }> {
  try {
    const supabase = createClient()

    // 파일 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false, // 기존 파일이 있으면 에러 반환
      })

    if (uploadError) {
      logError(uploadError, 'uploadFile')
      return {
        data: null,
        error: new Error(getErrorMessage(uploadError)),
      }
    }

    // 공개 URL 생성
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)

    if (!urlData?.publicUrl) {
      return {
        data: null,
        error: new Error('파일 URL을 생성할 수 없습니다.'),
      }
    }

    return { data: urlData.publicUrl, error: null }
  } catch (error) {
    logError(error, 'uploadFile')
    return {
      data: null,
      error: new Error(getErrorMessage(error)),
    }
  }
}

/**
 * 파일 다운로드 URL 생성 (공개 URL)
 * 
 * @param bucket Storage 버킷 이름
 * @param path 파일 경로
 * @returns 파일의 공개 URL
 */
export async function getFileUrl(
  bucket: string,
  path: string
): Promise<{ data: string | null; error: Error | null }> {
  try {
    const supabase = createClient()

    const { data } = supabase.storage.from(bucket).getPublicUrl(path)

    if (!data?.publicUrl) {
      return {
        data: null,
        error: new Error('파일 URL을 생성할 수 없습니다.'),
      }
    }

    return { data: data.publicUrl, error: null }
  } catch (error) {
    logError(error, 'getFileUrl')
    return {
      data: null,
      error: new Error(getErrorMessage(error)),
    }
  }
}

/**
 * 파일 삭제
 * 
 * @param bucket Storage 버킷 이름
 * @param paths 삭제할 파일 경로 배열
 * @returns 성공 여부
 */
export async function deleteFiles(
  bucket: string,
  paths: string[]
): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()

    const { error } = await supabase.storage.from(bucket).remove(paths)

    if (error) {
      logError(error, 'deleteFiles')
      return {
        error: new Error(getErrorMessage(error)),
      }
    }

    return { error: null }
  } catch (error) {
    logError(error, 'deleteFiles')
    return {
      error: new Error(getErrorMessage(error)),
    }
  }
}

/**
 * 단일 파일 삭제
 * 
 * @param bucket Storage 버킷 이름
 * @param path 삭제할 파일 경로
 * @returns 성공 여부
 */
export async function deleteFile(
  bucket: string,
  path: string
): Promise<{ error: Error | null }> {
  return deleteFiles(bucket, [path])
}
