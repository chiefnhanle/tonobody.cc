export function useDraftStore() {
  const dbName = 'thought-vault-drafts'
  const storeName = 'drafts'
  const key = 'capture'

  function openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1)
      request.onupgradeneeded = () => request.result.createObjectStore(storeName)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async function getDraft(): Promise<{ title: string, html: string, savedAt: string } | null> {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly')
      const request = tx.objectStore(storeName).get(key)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  async function saveDraft(draft: { title: string, html: string }) {
    const db = await openDb()
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite')
      tx.objectStore(storeName).put({ ...draft, savedAt: new Date().toISOString() }, key)
      tx.onerror = () => reject(tx.error)
      tx.oncomplete = () => resolve()
    })
  }

  async function clearDraft() {
    const db = await openDb()
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite')
      tx.objectStore(storeName).delete(key)
      tx.onerror = () => reject(tx.error)
      tx.oncomplete = () => resolve()
    })
  }

  return { getDraft, saveDraft, clearDraft }
}
