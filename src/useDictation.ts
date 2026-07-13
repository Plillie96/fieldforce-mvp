import { useEffect, useRef, useState } from 'react'

/**
 * Minimal shape of the Web Speech API's SpeechRecognition. It isn't in the
 * standard TS DOM lib and ships under a vendor prefix on Safari/Chrome, so we
 * describe just what we use.
 */
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechResultEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}

interface SpeechResultEvent {
  resultIndex: number
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/**
 * Speech-to-text via the browser's on-device recognition. `start` streams the
 * transcript (interim + final) to the callback so a field can update live.
 * `supported` is false where the API is unavailable, so callers can hide the UI.
 */
export function useDictation() {
  const [listening, setListening] = useState(false)
  const recRef = useRef<SpeechRecognitionLike | null>(null)
  const supported = getRecognitionCtor() !== null

  useEffect(() => {
    return () => recRef.current?.abort()
  }, [])

  function stop() {
    recRef.current?.stop()
  }

  function start(onText: (text: string) => void) {
    const Ctor = getRecognitionCtor()
    if (!Ctor) return
    recRef.current?.abort()

    const rec = new Ctor()
    rec.lang = navigator.language || 'en-US'
    rec.continuous = true
    rec.interimResults = true

    let finalText = ''
    rec.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0]?.transcript ?? ''
        if (result.isFinal) finalText += transcript
        else interim += transcript
      }
      onText((finalText + interim).replace(/\s+/g, ' ').trimStart())
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => {
      setListening(false)
      recRef.current = null
    }

    recRef.current = rec
    try {
      rec.start()
      setListening(true)
    } catch {
      setListening(false)
    }
  }

  return { supported, listening, start, stop }
}
