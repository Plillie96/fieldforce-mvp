import { useEffect, useState } from 'react'
import { getPhotoBlob } from './db'

/**
 * Resolves a photo id from IndexedDB into an object URL and revokes it on cleanup.
 * Returns undefined while loading or when there is no photo.
 */
export function usePhotoUrl(photoId?: string): string | undefined {
  const [url, setUrl] = useState<string>()

  useEffect(() => {
    let revoked = false
    let current: string | undefined

    if (!photoId) {
      setUrl(undefined)
      return
    }

    getPhotoBlob(photoId).then((blob) => {
      if (revoked || !blob) return
      current = URL.createObjectURL(blob)
      setUrl(current)
    })

    return () => {
      revoked = true
      if (current) URL.revokeObjectURL(current)
    }
  }, [photoId])

  return url
}

/**
 * Resolves an ordered list of photo ids into object URLs, revoking them on
 * cleanup. Preserves order and skips any that fail to load.
 */
export function usePhotoUrls(photoIds: string[]): string[] {
  const [urls, setUrls] = useState<string[]>([])
  const key = photoIds.join(',')

  useEffect(() => {
    let revoked = false
    const created: string[] = []

    if (photoIds.length === 0) {
      setUrls([])
      return
    }

    Promise.all(photoIds.map((id) => getPhotoBlob(id))).then((blobs) => {
      if (revoked) return
      for (const blob of blobs) {
        if (blob) created.push(URL.createObjectURL(blob))
      }
      setUrls(created)
    })

    return () => {
      revoked = true
      for (const u of created) URL.revokeObjectURL(u)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return urls
}
