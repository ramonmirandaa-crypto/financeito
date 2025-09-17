import crypto from 'crypto'

export class EncryptionConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EncryptionConfigError'
  }
}

const keyB64 = process.env.ENCRYPTION_KEY_BASE64 || ''
let cachedKey: Buffer | null = null
let cachedKeyError: string | null = null

if (!keyB64) {
  cachedKeyError =
    'ENCRYPTION_KEY_BASE64 ausente. Configure uma chave Base64 de 32 bytes (256 bits) para habilitar a criptografia.'
  console.error(cachedKeyError)
} else {
  const decoded = Buffer.from(keyB64, 'base64')
  if (decoded.length !== 32) {
    cachedKeyError =
      'ENCRYPTION_KEY_BASE64 inválido. Gere uma chave de 32 bytes, codifique em Base64 e defina a variável de ambiente.'
    console.error(cachedKeyError)
  } else {
    cachedKey = decoded
  }
}

function ensureEncryptionKey(): Buffer {
  if (cachedKey) return cachedKey
  throw new EncryptionConfigError(
    cachedKeyError ||
      'ENCRYPTION_KEY_BASE64 ausente ou inválido. Configure uma chave Base64 de 32 bytes (256 bits) para habilitar a criptografia.'
  )
}

export function encryptJSON(obj: any): string {
  const key = ensureEncryptionKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const plaintext = Buffer.from(JSON.stringify(obj))
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString('base64')
}

export function decryptJSON(b64: string): any {
  const key = ensureEncryptionKey()
  const buf = Buffer.from(b64, 'base64')
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const data = buf.subarray(28)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const dec = Buffer.concat([decipher.update(data), decipher.final()])
  return JSON.parse(dec.toString('utf8'))
}
