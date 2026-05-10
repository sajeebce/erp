import net from 'node:net'
import tls from 'node:tls'

export interface SmtpConfig {
  host: string
  port: number
  security: 'SSL' | 'STARTTLS' | 'NONE'
  username: string
  password: string
  fromAddress: string
  fromName?: string
}

export interface SendMailInput {
  to: string
  subject: string
  body: string
}

type SmtpSocket = net.Socket | tls.TLSSocket

function encodeHeader(value: string) {
  if (/^[\x00-\x7F]*$/.test(value)) return value
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`
}

function formatAddress(email: string, name?: string) {
  if (!name) return email
  return `"${name.replace(/"/g, '\\"')}" <${email}>`
}

function escapeData(body: string) {
  return body.replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..')
}

function readResponse(socket: SmtpSocket): Promise<string> {
  return new Promise((resolve, reject) => {
    let buffer = ''

    const cleanup = () => {
      socket.off('data', onData)
      socket.off('error', onError)
    }

    const onError = (error: Error) => {
      cleanup()
      reject(error)
    }

    const onData = (data: Buffer) => {
      buffer += data.toString('utf8')
      const lines = buffer.split(/\r?\n/).filter(Boolean)
      const last = lines[lines.length - 1]
      if (last && /^\d{3}\s/.test(last)) {
        cleanup()
        resolve(buffer)
      }
    }

    socket.on('data', onData)
    socket.on('error', onError)
  })
}

async function writeCommand(socket: SmtpSocket, command: string, expectedPrefix?: string, logLabel = command) {
  socket.write(`${command}\r\n`)
  const response = await readResponse(socket)
  if (expectedPrefix && !response.startsWith(expectedPrefix)) {
    throw new Error(`SMTP command failed (${logLabel}): ${response.trim()}`)
  }
  return response
}

function connectPlain(host: string, port: number): Promise<net.Socket> {
  return new Promise((resolve, reject) => {
    const socket = net.connect(port, host, () => resolve(socket))
    socket.once('error', reject)
  })
}

function connectTls(host: string, port: number): Promise<tls.TLSSocket> {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(port, host, { servername: host }, () => resolve(socket))
    socket.once('error', reject)
  })
}

function startTls(socket: net.Socket, host: string): Promise<tls.TLSSocket> {
  return new Promise((resolve, reject) => {
    const secureSocket = tls.connect({ socket, servername: host }, () => resolve(secureSocket))
    secureSocket.once('error', reject)
  })
}

export async function sendSmtpEmail(config: SmtpConfig, input: SendMailInput) {
  if (!config.host || !config.username || !config.password || !config.fromAddress) {
    throw new Error('SMTP host, username, app password, and from address are required')
  }

  let socket: SmtpSocket = config.security === 'SSL'
    ? await connectTls(config.host, config.port)
    : await connectPlain(config.host, config.port)

  try {
    await readResponse(socket)
    await writeCommand(socket, 'EHLO localhost', '250')

    if (config.security === 'STARTTLS') {
      await writeCommand(socket, 'STARTTLS', '220')
      socket = await startTls(socket as net.Socket, config.host)
      await writeCommand(socket, 'EHLO localhost', '250')
    }

    await writeCommand(socket, 'AUTH LOGIN', '334')
    await writeCommand(socket, Buffer.from(config.username).toString('base64'), '334', 'AUTH username')
    await writeCommand(socket, Buffer.from(config.password).toString('base64'), '235', 'AUTH password')
    await writeCommand(socket, `MAIL FROM:<${config.fromAddress}>`, '250')
    await writeCommand(socket, `RCPT TO:<${input.to}>`, '250')
    await writeCommand(socket, 'DATA', '354')

    const message = [
      `From: ${formatAddress(config.fromAddress, config.fromName)}`,
      `To: ${input.to}`,
      `Subject: ${encodeHeader(input.subject)}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      escapeData(input.body),
      '.',
    ].join('\r\n')

    socket.write(`${message}\r\n`)
    const response = await readResponse(socket)
    if (!response.startsWith('250')) {
      throw new Error(`SMTP message rejected: ${response.trim()}`)
    }

    await writeCommand(socket, 'QUIT')
  } finally {
    socket.end()
  }
}
