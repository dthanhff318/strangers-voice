# Audio Streaming Architecture

## Overview

This document explains the audio streaming architecture used in the live broadcasting feature. The implementation uses modern Web Audio API with **AudioWorklet** for real-time, low-latency audio streaming over Supabase Realtime.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Key Concepts](#key-concepts)
- [Broadcasting Flow](#broadcasting-flow)
- [Listening Flow](#listening-flow)
- [File Structure](#file-structure)
- [Implementation Details](#implementation-details)
- [Migration from ScriptProcessorNode](#migration-from-scriptprocessornode)
- [Performance Characteristics](#performance-characteristics)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         HOST (Broadcaster)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Microphone]                                                   │
│       ↓                                                         │
│  [MediaStream] ← getUserMedia()                                │
│       ↓                                                         │
│  [AudioContext] ← Audio processing environment                 │
│       ↓                                                         │
│  [MediaStreamSource] ← Convert stream to audio node           │
│       ↓                                                         │
│  [AudioWorkletNode] ← Process audio on audio thread           │
│       ↓ (postMessage)                                          │
│  [Main Thread] ← Receive processed audio chunks               │
│       ↓                                                         │
│  [Supabase Realtime] ← Broadcast to channel                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    (Realtime Channel)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       LISTENER (Audience)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Supabase Realtime] ← Receive audio chunks                    │
│       ↓                                                         │
│  [Main Thread] ← Convert to Float32Array                       │
│       ↓ (postMessage)                                          │
│  [AudioWorkletNode] ← Buffer and playback on audio thread     │
│       ↓                                                         │
│  [AudioContext.destination] ← Output to speakers              │
│       ↓                                                         │
│  [Speakers]                                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Concepts

### 1. MediaStream

**What is it?**
- Represents a real-time stream of media data (audio/video)
- Obtained from microphone, camera, or screen share
- Contains one or more `MediaStreamTrack` objects

**Example:**
```typescript
const mediaStream = await navigator.mediaDevices.getUserMedia({
  audio: {
    sampleRate: 44100,
    channelCount: 1,  // Mono
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  }
})
```

**Key Properties:**
- `getTracks()` - Get all tracks (audio/video)
- `getAudioTracks()` - Get only audio tracks
- `active` - Whether stream is active

---

### 2. AudioContext

**What is it?**
- The "factory" for audio processing
- Manages the entire audio graph (nodes and connections)
- Has its own timeline and sample rate

**Example:**
```typescript
const audioContext = new AudioContext({
  sampleRate: 44100  // 44,100 samples per second
})
```

**Key Properties:**
- `sampleRate` - Sample rate (Hz)
- `currentTime` - Current audio time (seconds)
- `destination` - Final output (speakers)
- `state` - 'running' | 'suspended' | 'closed'

**Sample Rate:**
- `44100 Hz` = CD quality
- `48000 Hz` = Professional audio
- Higher = better quality but more data

---

### 3. MediaStreamSource

**What is it?**
- Converts `MediaStream` (raw data) into an `AudioNode`
- Acts as the source node in the audio graph
- Bridge between MediaStream API and Web Audio API

**Example:**
```typescript
const source = audioContext.createMediaStreamSource(mediaStream)
```

**Why needed?**
- `MediaStream` cannot be directly connected in audio graph
- `AudioContext` only works with `AudioNode` objects
- MediaStreamSource wraps the stream for processing

---

### 4. AudioWorkletNode

**What is it?**
- Custom audio processor that runs on a separate audio rendering thread
- Enables low-latency, real-time audio processing
- Replaces the deprecated `ScriptProcessorNode`

**Example:**
```typescript
// Load the processor
await audioContext.audioWorklet.addModule('/audio-processor.js')

// Create the node
const workletNode = new AudioWorkletNode(audioContext, 'processor-name', {
  numberOfInputs: 1,
  numberOfOutputs: 1,
  channelCount: 1,
})
```

**Key Benefits:**
- Runs off main thread → no UI blocking
- Lower latency → better for real-time
- More efficient → dedicated audio thread

---

## Broadcasting Flow

### Step-by-Step Process

#### 1. Request Microphone Access
```typescript
// File: src/lib/audioStreaming.ts:31
async startCapture(): Promise<MediaStream> {
  this.mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: { ... }
  })
  return this.mediaStream
}
```
- Requests user permission for microphone
- Returns MediaStream with audio track

---

#### 2. Create Audio Context
```typescript
// File: src/lib/audioStreaming.ts:57
this.audioContext = new AudioContext({
  sampleRate: 44100
})
```
- Creates audio processing environment
- Sets sample rate to 44.1kHz (CD quality)

---

#### 3. Create MediaStreamSource
```typescript
// File: src/lib/audioStreaming.ts:58
this.mediaStreamSource = this.audioContext.createMediaStreamSource(
  this.mediaStream
)
```
- Converts MediaStream to AudioNode
- Now can be connected in audio graph

---

#### 4. Load AudioWorklet Module
```typescript
// File: src/lib/audioStreaming.ts:61
await this.audioContext.audioWorklet.addModule(
  '/audio-broadcast-processor.js'
)
```
- Loads custom processor code
- Runs on audio rendering thread

---

#### 5. Create AudioWorkletNode
```typescript
// File: src/lib/audioStreaming.ts:64-68
this.workletNode = new AudioWorkletNode(
  this.audioContext,
  'broadcast-processor',
  {
    numberOfInputs: 1,    // Receive from MediaStreamSource
    numberOfOutputs: 1,   // Output to destination
    channelCount: 1,      // Mono
  }
)
```
- Creates worklet node instance
- Configured for mono audio input/output

---

#### 6. Listen for Audio Data
```typescript
// File: src/lib/audioStreaming.ts:71-83
this.workletNode.port.onmessage = (event) => {
  const audioData = Array.from(
    new Float32Array(event.data.audioData)
  )

  this.channel?.send({
    type: 'broadcast',
    event: 'audio_chunk',
    payload: { audioData },
  })
}
```
- Receives processed audio from worklet
- Broadcasts to Supabase Realtime channel

---

#### 7. Connect Audio Graph
```typescript
// File: src/lib/audioStreaming.ts:86-87
this.mediaStreamSource.connect(this.workletNode)
this.workletNode.connect(this.audioContext.destination)
```
- Microphone → Worklet → Speakers
- Allows host to monitor their own audio

---

#### 8. Process Audio (AudioWorklet Thread)
```javascript
// File: public/audio-broadcast-processor.js
process(inputs, outputs, parameters) {
  const inputChannel = inputs[0][0]

  // Accumulate samples
  for (let i = 0; i < inputChannel.length; i++) {
    this.buffer.push(inputChannel[i])
  }

  // Send when buffer is full (4096 samples)
  if (this.buffer.length >= this.bufferSize) {
    const audioData = new Float32Array(
      this.buffer.splice(0, this.bufferSize)
    )

    // Transfer to main thread (zero-copy)
    this.port.postMessage(
      { audioData: audioData.buffer },
      [audioData.buffer]
    )
  }

  return true // Keep processor alive
}
```
- Processes 128 frames at a time (Web Audio standard)
- Buffers to 4096 samples before sending
- Uses transferable objects for performance

---

## Listening Flow

### Step-by-Step Process

#### 1. Create Audio Context
```typescript
// File: src/lib/audioStreaming.ts:133
this.audioContext = new AudioContext({
  sampleRate: 44100
})
```

---

#### 2. Load Playback Processor
```typescript
// File: src/lib/audioStreaming.ts:136
await this.audioContext.audioWorklet.addModule(
  '/audio-playback-processor.js'
)
```

---

#### 3. Create AudioWorkletNode
```typescript
// File: src/lib/audioStreaming.ts:139-143
this.workletNode = new AudioWorkletNode(
  this.audioContext,
  'playback-processor',
  {
    numberOfInputs: 0,   // No input (data comes via messages)
    numberOfOutputs: 1,  // Output to speakers
    channelCount: 1,     // Mono
  }
)
```

---

#### 4. Connect to Speakers
```typescript
// File: src/lib/audioStreaming.ts:146
this.workletNode.connect(this.audioContext.destination)
```

---

#### 5. Subscribe to Realtime Channel
```typescript
// File: src/lib/audioStreaming.ts:150-162
this.channel
  .on('broadcast', { event: 'audio_chunk' }, (payload) => {
    const audioData = payload.payload.audioData as number[]

    if (audioData && this.isPlaying && this.workletNode) {
      // Convert to Float32Array
      const float32Data = new Float32Array(audioData)

      // Send to worklet (transferable)
      this.workletNode.port.postMessage(
        { audioData: float32Data.buffer },
        [float32Data.buffer]
      )
    }
  })
  .subscribe()
```
- Receives audio chunks from Supabase
- Forwards to worklet for playback

---

#### 6. Playback Audio (AudioWorklet Thread)
```javascript
// File: public/audio-playback-processor.js
process(inputs, outputs, parameters) {
  const outputChannel = outputs[0][0]

  for (let i = 0; i < outputChannel.length; i++) {
    // Get next chunk if needed
    if (!this.currentChunk || this.chunkIndex >= this.currentChunk.length) {
      this.currentChunk = this.audioQueue.shift() || null
      this.chunkIndex = 0
    }

    // Play audio or silence
    if (this.currentChunk && this.chunkIndex < this.currentChunk.length) {
      outputChannel[i] = this.currentChunk[this.chunkIndex]
      this.chunkIndex++
    } else {
      outputChannel[i] = 0  // Silence
    }
  }

  return true
}
```
- Maintains queue of audio chunks
- Plays samples smoothly
- Outputs silence when no data available

---

## File Structure

```
project-root/
├── public/
│   ├── audio-broadcast-processor.js   # Worklet for capturing audio
│   └── audio-playback-processor.js    # Worklet for playing audio
│
├── src/
│   ├── lib/
│   │   └── audioStreaming.ts          # Main audio streaming logic
│   │       ├── AudioStreamService     # Broadcasting service
│   │       └── AudioListenerService   # Listening service
│   │
│   └── hooks/
│       └── useAudioStream.ts          # React hook for audio streaming
│
└── docs/
    └── AUDIO_STREAMING_ARCHITECTURE.md  # This file
```

---

## Implementation Details

### AudioStreamService (Broadcasting)

**Responsibilities:**
- Capture audio from microphone
- Process audio via AudioWorklet
- Broadcast chunks to Supabase Realtime

**Key Methods:**
```typescript
class AudioStreamService {
  async startCapture(): Promise<MediaStream>
  async startBroadcast(channel: RealtimeChannel): Promise<void>
  stopBroadcast(): void
  isActive(): boolean
}
```

---

### AudioListenerService (Playback)

**Responsibilities:**
- Subscribe to Supabase Realtime channel
- Forward audio chunks to AudioWorklet
- Play audio through speakers

**Key Methods:**
```typescript
class AudioListenerService {
  async startListening(channel: RealtimeChannel): Promise<void>
  stopListening(): void
  isActive(): boolean
}
```

---

### Configuration

```typescript
interface AudioStreamConfig {
  sampleRate?: number          // Default: 44100 Hz
  channelCount?: number        // Default: 1 (mono)
  echoCancellation?: boolean   // Default: true
  noiseSuppression?: boolean   // Default: true
  autoGainControl?: boolean    // Default: true
}
```

---

## Migration from ScriptProcessorNode

### Why Migrate?

**ScriptProcessorNode Issues:**
- ❌ Deprecated API
- ❌ Runs on main thread → blocks UI
- ❌ Higher latency
- ❌ Browser console warnings

**AudioWorklet Benefits:**
- ✅ Modern, recommended API
- ✅ Runs on audio rendering thread
- ✅ Lower latency
- ✅ Better performance
- ✅ No deprecation warnings

---

### Key Changes

#### Before (ScriptProcessorNode):
```typescript
// OLD CODE
this.scriptProcessor = this.audioContext.createScriptProcessor(
  4096, 1, 1
)

this.scriptProcessor.onaudioprocess = (event) => {
  const inputData = event.inputBuffer.getChannelData(0)
  const audioData = Array.from(inputData)
  this.channel?.send({ ... })
}

this.mediaStreamSource.connect(this.scriptProcessor)
this.scriptProcessor.connect(this.audioContext.destination)
```

#### After (AudioWorklet):
```typescript
// NEW CODE
await this.audioContext.audioWorklet.addModule(
  '/audio-broadcast-processor.js'
)

this.workletNode = new AudioWorkletNode(
  this.audioContext,
  'broadcast-processor'
)

this.workletNode.port.onmessage = (event) => {
  const audioData = Array.from(new Float32Array(event.data.audioData))
  this.channel?.send({ ... })
}

this.mediaStreamSource.connect(this.workletNode)
this.workletNode.connect(this.audioContext.destination)
```

---

## Performance Characteristics

### Latency

**Buffer Size:** 4096 samples
**Sample Rate:** 44100 Hz
**Latency per chunk:** ~93ms (4096 ÷ 44100)

```
Timeline:
T=0ms:     User starts broadcasting
T=93ms:    First audio chunk sent
T=186ms:   Second audio chunk sent
T=279ms:   Third audio chunk sent
...
```

---

### Data Transfer

**Per Chunk:**
- Samples: 4096
- Format: Float32Array
- Size: 4096 × 4 bytes = 16,384 bytes (~16 KB)

**Per Second:**
- Chunks: ~10.77 (44100 ÷ 4096)
- Data: ~176 KB/s

**Optimization:**
- Uses transferable objects (zero-copy transfer)
- Minimizes garbage collection
- Efficient binary data handling

---

### Thread Distribution

```
Main Thread:
- React UI rendering
- User interactions
- Supabase communication
- Message passing to/from worklets

Audio Rendering Thread:
- Audio processing (process() method)
- Buffering
- Sample manipulation
- No UI work → no blocking
```

---

## Browser Compatibility

**AudioWorklet Support:**
- Chrome/Edge: ✅ 66+
- Firefox: ✅ 76+
- Safari: ✅ 14.1+
- Opera: ✅ 53+

**Fallback:**
- ScriptProcessorNode still works (deprecated but supported)
- Consider feature detection for older browsers

---

## Best Practices

### 1. Always Clean Up Resources
```typescript
stopBroadcast(): void {
  this.isStreaming = false

  // Disconnect and clean up in order
  if (this.workletNode) {
    this.workletNode.disconnect()
    this.workletNode.port.onmessage = null
    this.workletNode = null
  }

  if (this.audioContext) {
    this.audioContext.close()  // Important!
    this.audioContext = null
  }

  if (this.mediaStream) {
    this.mediaStream.getTracks().forEach(track => track.stop())
    this.mediaStream = null
  }
}
```

---

### 2. Handle Errors Gracefully
```typescript
try {
  await audioStreamService.startCapture()
  await audioStreamService.startBroadcast(channel)
} catch (error) {
  if (error.name === 'NotAllowedError') {
    // User denied microphone permission
  } else if (error.name === 'NotFoundError') {
    // No microphone found
  } else {
    // Other errors
  }
}
```

---

### 3. Use Transferable Objects
```typescript
// ✅ Good: Zero-copy transfer
this.port.postMessage(
  { audioData: audioData.buffer },
  [audioData.buffer]  // Transferable
)

// ❌ Bad: Copies data (slower)
this.port.postMessage({ audioData: audioData })
```

---

### 4. Monitor Audio Context State
```typescript
audioContext.addEventListener('statechange', () => {
  console.log('AudioContext state:', audioContext.state)

  if (audioContext.state === 'suspended') {
    // Resume if needed (e.g., after user interaction)
    audioContext.resume()
  }
})
```

---

## Troubleshooting

### Issue: No audio heard

**Possible causes:**
1. Microphone permission denied
2. AudioContext suspended (requires user gesture)
3. Channel not subscribed
4. Audio muted in browser

**Solutions:**
```typescript
// Check microphone permission
const permission = await navigator.permissions.query({ name: 'microphone' })
console.log('Microphone permission:', permission.state)

// Resume AudioContext
if (audioContext.state === 'suspended') {
  await audioContext.resume()
}

// Verify channel subscription
console.log('Channel state:', channel.state)
```

---

### Issue: Audio choppy or glitchy

**Possible causes:**
1. Network latency
2. Buffer size too small
3. CPU overload

**Solutions:**
```typescript
// Increase buffer size
const bufferSize = 8192  // Instead of 4096

// Monitor performance
console.log('Audio context time:', audioContext.currentTime)
console.log('Queue length:', this.audioQueue.length)
```

---

### Issue: High latency

**Possible causes:**
1. Large buffer size
2. Network delay
3. Queue buildup

**Solutions:**
```typescript
// Reduce buffer size
const bufferSize = 2048  // Lower latency, more frequent sends

// Monitor queue
if (this.audioQueue.length > 10) {
  console.warn('Audio queue backing up!')
  // Consider dropping old chunks
}
```

---

## Further Reading

- [Web Audio API Specification](https://www.w3.org/TR/webaudio/)
- [AudioWorklet MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet)
- [Enter Audio Worklet (Google Developers)](https://developers.google.com/web/updates/2017/12/audio-worklet)
- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)

---

## License

This documentation is part of the Record Strangers project.

---

**Last Updated:** 2025-01-08
**Author:** Record Strangers Team
