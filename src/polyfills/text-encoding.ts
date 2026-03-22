type SupportedEncoding = "utf-8" | "utf8" | "ascii" | "us-ascii" | "latin1" | "iso-8859-1" | "utf-16le" | "utf-16be"

function toUint8Array(input?: BufferSource | ArrayBufferView | ArrayBuffer | null): Uint8Array {
  if (!input) {
    return new Uint8Array(0)
  }

  if (input instanceof Uint8Array) {
    return input
  }

  if (ArrayBuffer.isView(input)) {
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
  }

  return new Uint8Array(input)
}

function decodeUtf8(bytes: Uint8Array): string {
  let encoded = ""

  for (const byte of bytes) {
    encoded += `%${byte.toString(16).padStart(2, "0")}`
  }

  try {
    return decodeURIComponent(encoded)
  } catch {
    let fallback = ""

    for (const byte of bytes) {
      fallback += String.fromCharCode(byte)
    }

    return fallback
  }
}

function decodeAscii(bytes: Uint8Array): string {
  let output = ""

  for (const byte of bytes) {
    output += String.fromCharCode(byte & 0x7f)
  }

  return output
}

function decodeLatin1(bytes: Uint8Array): string {
  let output = ""

  for (const byte of bytes) {
    output += String.fromCharCode(byte)
  }

  return output
}

function decodeUtf16(bytes: Uint8Array, littleEndian: boolean): string {
  let output = ""

  for (let index = 0; index + 1 < bytes.length; index += 2) {
    const codePoint = littleEndian
      ? bytes[index] | (bytes[index + 1] << 8)
      : (bytes[index] << 8) | bytes[index + 1]

    output += String.fromCharCode(codePoint)
  }

  if (bytes.length % 2 === 1) {
    output += String.fromCharCode(bytes[bytes.length - 1])
  }

  return output
}

class UXPTextDecoder {
  readonly encoding: SupportedEncoding

  constructor(label: string = "utf-8") {
    const normalized = label.toLowerCase() as SupportedEncoding

    if (
      normalized !== "utf-8" &&
      normalized !== "utf8" &&
      normalized !== "ascii" &&
      normalized !== "us-ascii" &&
      normalized !== "latin1" &&
      normalized !== "iso-8859-1" &&
      normalized !== "utf-16le" &&
      normalized !== "utf-16be"
    ) {
      throw new Error(`Unsupported encoding: ${label}`)
    }

    this.encoding = normalized
  }

  decode(input?: BufferSource | ArrayBufferView | ArrayBuffer | null): string {
    const bytes = toUint8Array(input)

    switch (this.encoding) {
      case "ascii":
      case "us-ascii":
        return decodeAscii(bytes)
      case "latin1":
      case "iso-8859-1":
        return decodeLatin1(bytes)
      case "utf-16le":
        return decodeUtf16(bytes, true)
      case "utf-16be":
        return decodeUtf16(bytes, false)
      case "utf8":
      case "utf-8":
      default:
        return decodeUtf8(bytes)
    }
  }
}

if (typeof globalThis.TextDecoder === "undefined") {
  ;(globalThis as typeof globalThis & { TextDecoder: typeof UXPTextDecoder }).TextDecoder = UXPTextDecoder
}
