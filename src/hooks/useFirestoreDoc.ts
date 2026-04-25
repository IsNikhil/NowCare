import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import type { WithId } from '../types'

type DocState<T> = {
  data: WithId<T> | null
  loading: boolean
  error: string | null
}

const EMPTY: DocState<never> = { data: null, loading: false, error: null }

export function useFirestoreDoc<T>(path: string): DocState<T> {
  const [state, setState] = useState<DocState<T>>({
    data: null,
    loading: !!path,
    error: null,
  })

  useEffect(() => {
    if (!path) return

    const parts = path.split('/')
    const ref = doc(db, parts[0], ...parts.slice(1))

    const unsub = onSnapshot(
      ref,
      (snap) => {
        setState(
          snap.exists()
            ? { data: { id: snap.id, ...(snap.data() as T) }, loading: false, error: null }
            : { data: null, loading: false, error: null }
        )
      },
      (err) => setState({ data: null, loading: false, error: err.message })
    )

    return unsub
  }, [path])

  return path ? state : (EMPTY as DocState<T>)
}
