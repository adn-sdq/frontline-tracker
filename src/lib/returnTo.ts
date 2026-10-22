// Remembers where someone was going (e.g. a scanned label) so sign-in can take
// them straight there instead of the home page. Per tab, cleared once used.
const KEY = "fit.returnTo"

export function rememberReturnTo(path: string) {
  try {
    sessionStorage.setItem(KEY, path)
  } catch {
    /* storage blocked — they'll land on home instead */
  }
}

/** Read without clearing (safe to call during render). */
export function peekReturnTo(): string | null {
  try {
    return sessionStorage.getItem(KEY)
  } catch {
    return null
  }
}

/** Called once the destination is reached. */
export function clearReturnTo() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* nothing to clear */
  }
}
