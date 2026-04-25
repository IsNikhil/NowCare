import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  query,
} from 'firebase/firestore'
import type { QueryConstraint } from 'firebase/firestore'
import { db } from '../services/firebase'
import type { WithId } from '../types'

type CollectionState<T> = {
  data: WithId<T>[]
  loading: boolean
  error: string | null
}

const EMPTY: CollectionState<never> = { data: [], loading: false, error: null }

export function useFirestoreCollection<T>(
  collectionPath: string,
  constraints: QueryConstraint[]
): CollectionState<T> {
  const [state, setState] = useState<CollectionState<T>>({
    data: [],
    loading: !!collectionPath,
    error: null,
  })

  useEffect(() => {
    if (!collectionPath) return

    const ref = collection(db, collectionPath)
    const q = constraints.length > 0 ? query(ref, ...constraints) : query(ref)

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as T),
        }))
        setState({ data, loading: false, error: null })
      },
      (err) => {
        setState({ data: [], loading: false, error: err.message })
      }
    )

    return unsub
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionPath])

  return collectionPath ? state : (EMPTY as CollectionState<T>)
}
