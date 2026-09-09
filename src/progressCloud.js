const STORAGE_KEY = 'netplus_v3'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xvalxwncgnyccaqvujij.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_Jb99lbAuMh1rFGOJtA9Xbg_NsQrJFAa'

const headers = {
  apikey: SUPABASE_PUBLISHABLE_KEY,
  'Content-Type': 'application/json',
}

function isProgressObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

async function readCloudProgress() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/network_progress?id=eq.1&select=progress`, {
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
  })

  if (!response.ok) {
    throw new Error(`Cloud progress load failed (${response.status})`)
  }

  const rows = await response.json()
  return isProgressObject(rows?.[0]?.progress) ? rows[0].progress : null
}

async function writeCloudProgress(progress) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/network_progress?id=eq.1`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      progress,
      updated_at: new Date().toISOString(),
    }),
  })

  if (!response.ok) {
    throw new Error(`Cloud progress save failed (${response.status})`)
  }
}

function parseLocalProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function hasMeaningfulProgress(progress) {
  return isProgressObject(progress) && Object.keys(progress).length > 0
}

export async function bootstrapProgressSync() {
  try {
    const localProgress = parseLocalProgress()
    const cloudProgress = await readCloudProgress()

    if (hasMeaningfulProgress(cloudProgress)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudProgress))
    } else if (hasMeaningfulProgress(localProgress)) {
      await writeCloudProgress(localProgress)
    }
  } catch (error) {
    console.warn('[Network+ cloud sync] Startup sync unavailable; using local progress.', error)
  }
}

export function installProgressAutoSave() {
  const originalSetItem = Storage.prototype.setItem
  let saveTimer = null

  Storage.prototype.setItem = function setItemWithCloudSync(key, value) {
    originalSetItem.call(this, key, value)

    if (this !== window.localStorage || key !== STORAGE_KEY) return

    let progress
    try {
      progress = JSON.parse(value)
    } catch {
      return
    }

    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      writeCloudProgress(progress).catch((error) => {
        console.warn('[Network+ cloud sync] Save failed; local progress is still preserved.', error)
      })
    }, 250)
  }
}
