import { defineConfig, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null
  const parts = header.split(';')
  for (const part of parts) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return decodeURIComponent(rest.join('='))
  }
  return null
}

function deviceCookiePlugin() {
  const handle = (req: IncomingMessage, res: ServerResponse) => {
    const deviceId = readCookie(req.headers.cookie, 'esn_device_id')
    if (req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ deviceId: deviceId && UUID_REGEX.test(deviceId) ? deviceId : null }))
      return
    }
    if (req.method !== 'POST') {
      res.statusCode = 405
      res.end()
      return
    }
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    req.on('end', () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') as { deviceId?: string; secret?: string }
        if (!body.deviceId || !UUID_REGEX.test(body.deviceId) || !body.secret || body.secret.length < 16) {
          res.statusCode = 400
          res.end()
          return
        }
        const secure = req.headers['x-forwarded-proto'] === 'https'
        const flags = `HttpOnly; SameSite=Lax; Path=/; Max-Age=31536000${secure ? '; Secure' : ''}`
        res.setHeader('Set-Cookie', [
          `esn_device_id=${body.deviceId}; ${flags}`,
          `esn_device_secret=${encodeURIComponent(body.secret)}; ${flags}`,
        ])
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ ok: true }))
      } catch {
        res.statusCode = 400
        res.end()
      }
    })
  }

  return {
    name: 'esn-device-cookie',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/device', handle)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    deviceCookiePlugin(),
  ],
})
