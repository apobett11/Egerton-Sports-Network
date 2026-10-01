const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readCookie(header, name) {
  if (!header) return null;
  for (const part of String(header).split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export default function handler(req, res) {
  if (req.method === 'GET') {
    const deviceId = readCookie(req.headers.cookie, 'esn_device_id');
    res.status(200).json({ deviceId: deviceId && UUID_REGEX.test(deviceId) ? deviceId : null });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  const deviceId = req.body?.deviceId;
  const secret = req.body?.secret;
  if (!deviceId || !UUID_REGEX.test(deviceId) || typeof secret !== 'string' || secret.length < 16) {
    res.status(400).end();
    return;
  }

  const secure = req.headers['x-forwarded-proto'] === 'https';
  const flags = `HttpOnly; SameSite=Lax; Path=/; Max-Age=31536000${secure ? '; Secure' : ''}`;
  res.setHeader('Set-Cookie', [
    `esn_device_id=${deviceId}; ${flags}`,
    `esn_device_secret=${encodeURIComponent(secret)}; ${flags}`,
  ]);
  res.status(200).json({ ok: true });
}
