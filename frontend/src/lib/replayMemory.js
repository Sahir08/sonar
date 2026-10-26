// Where each replay was left, so coming back to Today (or the overview) picks up at the same moment.
// In memory only and holds just a reading index, never health data. Cleared on reload.
// Keys: a string for demo patients and the overview, or the upload's analysis object
// (so a new upload starts fresh).

const byName = new Map()
const byObject = new WeakMap()

const storeFor = (key) => (typeof key === 'object' ? byObject : byName)

export function recallIndex(key) {
  if (key === null || key === undefined) return null
  return storeFor(key).get(key) ?? null
}

export function rememberIndex(key, index) {
  if (key === null || key === undefined) return
  storeFor(key).set(key, index)
}
