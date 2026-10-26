// Only same-origin paths are allowed; `//host` and `/\host` would leave the app,
// and browsers drop tabs and newlines, so `/\t/host` would too.
export function safeRedirect(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  if (
    !value.startsWith('/') ||
    value.startsWith('//') ||
    // eslint-disable-next-line no-control-regex
    /[\u0000- \\]/.test(value)
  ) {
    return undefined
  }
  return value
}
