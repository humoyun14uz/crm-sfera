import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const TOKEN_VERSION = 'sfera.v1'
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7

function secret() {
  return process.env.AUTH_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'local-development-secret-change-me')
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString('hex')}`
}

export function verifyPassword(password: string, encoded: string | null | undefined) {
  if (!encoded?.startsWith('scrypt$')) return false
  const [, salt, expected] = encoded.split('$')
  if (!salt || !expected) return false
  const actual = scryptSync(password, salt, 64)
  const expectedBuffer = Buffer.from(expected, 'hex')
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer)
}

export function issueLocalToken(payload: { userId: string; academyId: string; role: string }) {
  if (!secret()) throw new Error('AUTH_SECRET must be configured in production')
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS })).toString('base64url')
  const unsigned = `${TOKEN_VERSION}.${body}`
  const signature = createHmac('sha256', secret()).update(unsigned).digest('base64url')
  return `${unsigned}.${signature}`
}

export function verifyLocalToken(token: string) {
  try {
    const [version, body, signature] = token.split('.')
    if (version !== TOKEN_VERSION || !body || !signature || !secret()) return null
    const unsigned = `${version}.${body}`
    const expected = createHmac('sha256', secret()).update(unsigned).digest('base64url')
    const a = Buffer.from(signature)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString()) as { userId: string; academyId: string; role: string; exp: number }
    return parsed.exp > Math.floor(Date.now() / 1000) ? parsed : null
  } catch {
    return null
  }
}
