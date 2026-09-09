/**
 * Content-admin gate. The admin API is authorized by an email allowlist in the
 * `ADMIN_EMAILS` env var (comma-separated). It fails CLOSED: if the var is unset
 * or empty, nobody is an admin.
 */

export function getAdminEmails(): string | undefined {
  return process.env.ADMIN_EMAILS
}

export function isAdminEmail(
  email: string | null | undefined,
  allowlistCsv: string | undefined,
): boolean {
  if (!allowlistCsv || allowlistCsv.trim() === '') return false
  if (!email) return false

  const allowed = allowlistCsv
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  return allowed.includes(email.trim().toLowerCase())
}
