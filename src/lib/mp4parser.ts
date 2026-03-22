import { createFile } from "mp4box"
import { uxp } from "../globals"

type ParseInput = {
  buffer: ArrayBuffer
  filename: string
  fileSize: number
}

type MP4BoxBuffer = ArrayBuffer & {
  fileStart: number
}

export interface Chapter {
  id: string
  title: string
  startTimeMs: number
  startTimecode: string
}

export interface VideoSpecs {
  width: number
  height: number
  codec: string
  bitrate: number // in kbps
  audioCodec: string
  audioSampleRate: number
  audioChannels: number
}

export interface ParseResult {
  chapters: Chapter[]
  duration: number
  filename: string
  fps: number
  fileSize: number // in bytes
  specs: VideoSpecs
}

function decodeUtf8(data: Uint8Array): string {
  if (typeof TextDecoder !== "undefined") {
    return new TextDecoder().decode(data)
  }

  let encoded = ""

  for (const byte of data) {
    encoded += `%${byte.toString(16).padStart(2, "0")}`
  }

  try {
    return decodeURIComponent(encoded)
  } catch {
    let fallback = ""

    for (const byte of data) {
      fallback += String.fromCharCode(byte)
    }

    return fallback
  }
}

function buildChapters(chapters: Array<{ timestamp: number; title: string }>): Chapter[] {
  return chapters.map((chapter, index) => ({
    id: `chapter-${index}`,
    title: chapter.title || `Chapter ${index + 1}`,
    startTimeMs: chapter.timestamp,
    startTimecode: msToTimecode(chapter.timestamp),
  }))
}

// Convert milliseconds to SMPTE timecode
export function msToTimecode(ms: number, fps: number = 30): string {
  const totalSeconds = ms / 1000
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)
  const frames = Math.floor((totalSeconds % 1) * fps)

  return [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    seconds.toString().padStart(2, "0"),
    frames.toString().padStart(2, "0"),
  ].join(":")
}

// Convert milliseconds to frame number
export function msToFrames(ms: number, fps: number = 30): number {
  return Math.round((ms / 1000) * fps)
}

// Parse chapter text from QuickTime text sample
function parseChapterTextSample(data: Uint8Array): string {
  // QuickTime text samples start with a 2-byte length prefix
  if (data.length < 2) return ""
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  const textLength = view.getUint16(0)
  if (textLength === 0 || 2 + textLength > data.length) {
    // Try raw UTF-8 decode as fallback
    return decodeUtf8(data).replace(/\0/g, "").trim()
  }
  const textData = data.slice(2, 2 + textLength)
  return decodeUtf8(textData).trim()
}

// Parse the chpl (chapter list) box data - legacy Nero format
function parseChplBox(data: Uint8Array): Array<{ timestamp: number; title: string }> {
  const chapters: Array<{ timestamp: number; title: string }> = []
  
  if (data.length < 9) {
    return chapters
  }

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  
  // Version (1 byte), flags (3 bytes)
  let offset = 4
  
  // Reserved/unknown (4 bytes in some implementations)
  offset += 4
  
  // Chapter count (1 byte)
  if (offset >= data.length) return chapters
  const chapterCount = data[offset]
  offset += 1
  

  
  for (let i = 0; i < chapterCount && offset < data.length; i++) {
    if (offset + 9 > data.length) break
    
    // Timestamp is 8 bytes (64-bit), in 100-nanosecond units
    const timestampHigh = view.getUint32(offset)
    const timestampLow = view.getUint32(offset + 4)
    const timestamp100ns = timestampHigh * 0x100000000 + timestampLow
    const timestampMs = timestamp100ns / 10000
    offset += 8
    
    // Title length (1 byte)
    const titleLength = data[offset]
    offset += 1
    
    if (offset + titleLength > data.length) break
    
    const titleBytes = data.slice(offset, offset + titleLength)
    const title = decodeUtf8(titleBytes)
    offset += titleLength
    
    chapters.push({ timestamp: timestampMs, title })
  }
  
  return chapters
}

// Map raw fps to standard frame rates
function mapToStandardFps(rawFps: number): number {
  const standardRates = [23.976, 24, 25, 29.97, 30, 50, 59.94, 60, 120]
  let closest = standardRates[0]
  let minDiff = Math.abs(rawFps - closest)
  
  for (const rate of standardRates) {
    const diff = Math.abs(rawFps - rate)
    if (diff < minDiff) {
      minDiff = diff
      closest = rate
    }
  }
  
  return closest
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findBoxByType(boxes: any[], type: string): any | null {
  for (const box of boxes) {
    if (box.type === type) return box
    if (box.boxes && Array.isArray(box.boxes)) {
      const found = findBoxByType(box.boxes, type)
      if (found) return found
    }
  }
  return null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findAllBoxesByType(boxes: any[], type: string): any[] {
  const results: unknown[] = []
  for (const box of boxes) {
    if (box.type === type) results.push(box)
    if (box.boxes && Array.isArray(box.boxes)) {
      results.push(...findAllBoxesByType(box.boxes, type))
    }
  }
  return results
}

async function readBrowserFile(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`))
    reader.readAsArrayBuffer(file)
  })
}

function getPathTail(pathValue: string): string {
  const normalized = pathValue.replace(/\\/g, "/")
  const segments = normalized.split("/").filter(Boolean)
  return segments[segments.length - 1] || pathValue
}

function buildFileUrlCandidates(filePath: string): string[] {
  if (/^file:/i.test(filePath)) {
    return [filePath]
  }

  const normalizedPath = filePath.replace(/\\/g, "/")

  if (/^[A-Za-z]:\//.test(normalizedPath)) {
    return [
      `file:/${normalizedPath}`,
      `file://${normalizedPath}`,
      `file:///${normalizedPath}`,
    ]
  }

  return [`file:${normalizedPath}`, `file://${normalizedPath}`]
}

async function readUXPFileFromPath(filePath: string): Promise<ParseInput> {
  const fs = uxp.storage.localFileSystem
  const format = uxp.storage.formats.binary
  const candidates = buildFileUrlCandidates(filePath)
  let lastError: unknown = null

  for (const candidate of candidates) {
    try {
      const entry = await fs.getEntryWithUrl(candidate)

      if (!entry || !entry.isFile) {
        continue
      }

      const metadata = await entry.getMetadata()
      const buffer = (await entry.read({ format })) as ArrayBuffer

      return {
        buffer,
        filename: entry.name || metadata?.name || getPathTail(filePath),
        fileSize: metadata?.size || buffer.byteLength,
      }
    } catch (error) {
      lastError = error
    }
  }

  const message = lastError instanceof Error ? lastError.message : "Unable to access file path"
  throw new Error(`Failed to access media file: ${message}`)
}

async function parseMP4Input({ buffer, filename, fileSize }: ParseInput): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const mp4boxFile = createFile()
    let duration = 0
    let settled = false

    const resolveOnce = (result: ParseResult) => {
      if (settled) return
      settled = true
      resolve(result)
    }

    const rejectOnce = (error: Error) => {
      if (settled) return
      settled = true
      reject(error)
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mp4boxFile.onReady = (info: any) => {
      // Duration is in timescale units, convert to ms
      duration = (info.duration / info.timescale) * 1000
      
      // Extract specs from tracks
      let detectedFps = 30 // Default fallback
      const specs: VideoSpecs = {
        width: 0,
        height: 0,
        codec: "unknown",
        bitrate: 0,
        audioCodec: "unknown",
        audioSampleRate: 0,
        audioChannels: 0,
      }
      
      if (info.tracks) {
        for (const track of info.tracks) {
          if (track.type === "video") {
            // Resolution
            specs.width = track.video?.width || track.track_width || 0
            specs.height = track.video?.height || track.track_height || 0
            
            // Codec
            specs.codec = track.codec || "unknown"
            
            // Bitrate (calculate from size and duration if available)
            if (track.bitrate) {
              specs.bitrate = Math.round(track.bitrate / 1000)
            }
            
            // Calculate fps from sample count and duration
            if (track.nb_samples && track.movie_duration && track.movie_timescale) {
              const trackDurationSec = track.movie_duration / track.movie_timescale
              const rawFps = track.nb_samples / trackDurationSec
              detectedFps = mapToStandardFps(rawFps)
            } else if (track.timescale && track.sample_duration) {
              const rawFps = track.timescale / track.sample_duration
              detectedFps = mapToStandardFps(rawFps)
            }
          } else if (track.type === "audio") {
            specs.audioCodec = track.codec || "unknown"
            specs.audioSampleRate = track.audio?.sample_rate || 0
            specs.audioChannels = track.audio?.channel_count || 0
          }
        }
      }
      
      let chapters: Chapter[] = []
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fileBoxes = (mp4boxFile as any).boxes
      
      // Method 1: Look for QuickTime chapter track (text track referenced by "chap")
      // Find tracks that have chapter references pointing to them
      const chapterTrackIds = new Set<number>()
      
      if (info.tracks) {
        for (const track of info.tracks) {
          // Check if any track references this one as chapters
          if (track.references) {
            for (const ref of track.references) {
              if (ref.type === "chap") {
                for (const id of ref.track_ids || []) {
                  chapterTrackIds.add(id)
                }
              }
            }
          }
        }
        
        // Also look for text tracks that might be chapters
        for (const track of info.tracks) {
          if (track.type === "text" || track.type === "sbtl" || track.codec === "text" || 
              (track.codec && track.codec.includes("text"))) {
            // Assume it's a chapter track if no explicit reference found
            if (chapterTrackIds.size === 0) {
              chapterTrackIds.add(track.id)
            }
          }
        }
      }
      
      // If we found chapter tracks, extract samples from them
      if (chapterTrackIds.size > 0) {
        
        // Set up sample extraction
        const chapterTrackId = Array.from(chapterTrackIds)[0]
        const extractedChapters: Array<{ timestamp: number; title: string }> = []
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mp4boxFile.onSamples = (trackId: number, _user: any, samples: any[]) => {
          if (trackId === chapterTrackId) {
            for (const sample of samples) {
              const timestampMs = (sample.cts / sample.timescale) * 1000
              const data = new Uint8Array(sample.data)
              const title = parseChapterTextSample(data)
              
              if (title) {
                extractedChapters.push({ timestamp: timestampMs, title })
              }
            }
            
            // Convert to our format
            chapters = buildChapters(extractedChapters)
            
            resolveOnce({
              chapters,
              duration,
              filename,
              fps: detectedFps,
              fileSize,
              specs,
            })
          }
        }
        
        // Request samples from the chapter track
        mp4boxFile.setExtractionOptions(chapterTrackId, null, { nbSamples: 1000 })
        mp4boxFile.start()
        
        // Timeout fallback if no samples received
        setTimeout(() => {
          if (!settled && chapters.length === 0) {
            tryFallbackMethods()
          }
        }, 2000)
      } else {
        tryFallbackMethods()
      }
      
      function tryFallbackMethods() {
        // Method 2: Look for chpl box (Nero chapters)
        if (fileBoxes) {
          const chplBox = findBoxByType(fileBoxes, "chpl")
          if (chplBox && chplBox.data) {
            const parsedChapters = parseChplBox(chplBox.data)
            if (parsedChapters.length > 0) {
              chapters = buildChapters(parsedChapters)
              resolveOnce({ chapters, duration, filename, fps: detectedFps, fileSize, specs })
              return
            }
          }
          
          // Method 3: Check udta for raw chapter data
          const udtaBoxes = findAllBoxesByType(fileBoxes, "udta")
          
          for (const udta of udtaBoxes) {
            if (udta.boxes) {
              for (const box of udta.boxes) {
                if (box.type === "chpl" && box.data) {
                  const parsedChapters = parseChplBox(box.data)
                  if (parsedChapters.length > 0) {
                    chapters = buildChapters(parsedChapters)
                    resolveOnce({ chapters, duration, filename, fps: detectedFps, fileSize, specs })
                    return
                  }
                }
              }
            }
          }
        }
        
        // No chapters found
        resolveOnce({ chapters: [], duration, filename, fps: detectedFps, fileSize, specs })
      }
    }

    mp4boxFile.onError = (module: string, message: string) => {
      const details = [module, message].filter(Boolean).join(": ")
      rejectOnce(new Error(`Failed to parse MP4: ${details || "Unknown error"}`))
    }

    const mp4Buffer = buffer as MP4BoxBuffer
    mp4Buffer.fileStart = 0
    mp4boxFile.appendBuffer(mp4Buffer)
    mp4boxFile.flush()
  })
}

export async function parseMP4File(file: File): Promise<ParseResult> {
  const buffer = await readBrowserFile(file)

  return parseMP4Input({
    buffer,
    filename: file.name,
    fileSize: file.size,
  })
}

export async function parseMP4FilePath(filePath: string): Promise<ParseResult> {
  const input = await readUXPFileFromPath(filePath)
  return parseMP4Input(input)
}