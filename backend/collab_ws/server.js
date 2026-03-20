import http from 'http'
import url from 'url'
import fetch from 'node-fetch'
import { setupWSConnection } from 'y-websocket/bin/utils.js'

const BACKEND_VERIFY_URL = process.env.BACKEND_VERIFY_URL || 'http://backend:8000/api/v1/auth/me'
const PORT = process.env.PORT || 1234

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Ink&Echoes collaboration WS')
})

server.on('upgrade', async (req, socket, head) => {
  try {
    const parsed = url.parse(req.url, true)
    let token = parsed.query?.token || null

    // If token not provided in query, try cookies
    if (!token && req.headers && req.headers.cookie) {
      const rawCookies = req.headers.cookie.split(';').map(c => c.trim())
      for (const c of rawCookies) {
        if (c.startsWith('access_token=')) {
          token = c.split('=')[1]
          break
        }
      }
    }

    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
      socket.destroy()
      return
    }

    // Verify token with backend
    const resp = await fetch(BACKEND_VERIFY_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (resp.status !== 200) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
      socket.destroy()
      return
    }

    // If verified, delegate to y-websocket setup handler
    setupWSConnection(req, socket, head, { gc: true })
  } catch (err) {
    console.error('WS upgrade error', err)
    try {
      socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n')
    } catch (e) {}
    socket.destroy()
  }
})

server.listen(PORT, () => {
  console.log(`Collaboration WS server listening on ${PORT}`)
})
