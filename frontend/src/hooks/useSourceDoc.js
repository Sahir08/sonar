import { useParams } from 'react-router-dom'
import { useSession } from '../context/session.js'
import { demoApi, demoPatientName } from '../lib/cache.js'
import { useApi } from './useApi.js'

/**
 * PATTERNS or REPORT for the current source.
 * Demo fetches from the API; upload and Nightscout read from the analysis in memory.
 * Returns { data, error, loading, retry, name, notFound }.
 */
export function useSourceDoc(source, doc) {
  const { id } = useParams()
  const session = useSession()
  const isDemo = source === 'demo'

  const patients = useApi(demoApi.patients, isDemo ? 'patients' : null)
  const remote = useApi((signal) => demoApi[doc](id, signal), isDemo ? `${doc}:${id}` : null)

  if (!isDemo) {
    return {
      data: session[source]?.analysis?.[doc] ?? null,
      error: null,
      loading: false,
      retry: () => {},
      name: 'Your data',
      notFound: false,
    }
  }

  const name = demoPatientName(patients.data, id)
  return {
    data: remote.data,
    error: patients.error || remote.error,
    loading: patients.loading || remote.loading,
    retry: () => {
      if (patients.error) patients.retry()
      if (remote.error) remote.retry()
    },
    name,
    notFound: !!patients.data && !name,
  }
}
