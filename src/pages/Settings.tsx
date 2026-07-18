import { useRef, useState } from 'react'
import { loadSettings, saveSettings } from '../db'
import { compressImage } from '../image'
import { TopBar } from '../components/ui'
import { IconCheck } from '../components/icons'

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export default function SettingsPage() {
  const initial = loadSettings()
  const [companyName, setCompanyName] = useState(initial.companyName)
  const [logo, setLogo] = useState(initial.logo)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function persist(next: { companyName?: string; logo?: string }) {
    const merged = { companyName, logo, ...next }
    setCompanyName(merged.companyName)
    setLogo(merged.logo)
    saveSettings(merged)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  async function onLogoPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const blob = await compressImage(file, 400, 0.85)
    const dataUrl = await blobToDataUrl(blob)
    persist({ logo: dataUrl })
  }

  return (
    <div className="page">
      <TopBar title="Company & report" back="/" />

      <div className="page-body form">
        <p className="muted">
          This branding appears on every exported punch list report — set it once.
        </p>

        <div className="field">
          <span className="field-label">Company name</span>
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            onBlur={() => persist({})}
            placeholder="e.g. Riverside Construction LLC"
          />
        </div>

        <div className="field">
          <span className="field-label">Company logo</span>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onLogoPicked} />
          <div className="logo-row">
            {logo ? (
              <img className="logo-preview" src={logo} alt="Company logo" />
            ) : (
              <div className="logo-empty">No logo</div>
            )}
            <div className="logo-actions">
              <button type="button" className="btn ghost" onClick={() => fileRef.current?.click()}>
                {logo ? 'Change logo' : 'Upload logo'}
              </button>
              {logo && (
                <button type="button" className="btn ghost" onClick={() => persist({ logo: '' })}>
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {saved && <p className="saved-note"><IconCheck size={14} /> Saved</p>}
      </div>
    </div>
  )
}
