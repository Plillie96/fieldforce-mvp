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
