# Audio Streaming Architecture

## Overview

This document explains how the real-time audio streaming system works in the Live Rooms feature.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                            HOST                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. User clicks "Start Mic"                                      │
│  2. Request microphone permission                                │
│  3. Capture audio from microphone                                │
│  4. Process audio in real-time                                   │
│  5. Broadcast audio chunks                                       │
│                                                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ↓ Audio Chunks (every 93ms)
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                   SUPABASE REALTIME                              │
│                   (WebSocket Bridge)                             │
│                                                                   │
│  - Channel: `room:{roomId}`                                      │
│  - Event: `audio_chunk`                                          │
│  - Payload: { audioData: Float32Array }                          │
│                                                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ↓ Broadcast to all listeners
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                         LISTENERS                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. Subscribe to channel                                         │
│  2. Receive audio chunks                                         │
│  3. Queue audio data                                             │
│  4. Play audio through speakers                                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Detailed Flow

### 1. Host: Audio Capture

**File:** `src/lib/audioStreaming.ts` → `AudioStreamService.startCapture()`

```typescript
// Request microphone access
const mediaStream = await navigator.mediaDevices.getUserMedia({
  audio: {
    sampleRate: 44100,        // CD quality (44.1 kHz)
    channelCount: 1,          // Mono audio
    echoCancellation: true,   // Remove echo
    noiseSuppression: true,   // Remove background noise
    autoGainControl: true,    // Auto adjust volume
  },
  video: false
})
```

**What happens:**
- Browser shows permission popup
- User allows → Get MediaStream from microphone
- MediaStream contains raw audio data

**Audio Quality Settings:**
| Setting | Value | Description |
|---------|-------|-------------|
| Sample Rate | 44100 Hz | 44,100 samples per second (CD quality) |
| Channels | 1 (Mono) | Single audio channel |
| Echo Cancellation | ON | Prevents audio feedback loops |
| Noise Suppression | ON | Filters background noise |
| Auto Gain Control | ON | Normalizes volume levels |

---

### 2. Host: Audio Processing

**File:** `src/lib/audioStreaming.ts` → `AudioStreamService.startBroadcast()`

```typescript
// Create audio processing context
const audioContext = new AudioContext({ sampleRate: 44100 })

// Connect microphone to audio context
const mediaStreamSource = audioContext.createMediaStreamSource(mediaStream)

// Create processor to capture audio chunks
const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1)
```

**Audio Processing Graph:**
```
[Microphone] → [MediaStreamSource] → [ScriptProcessor] → [Destination]
                                            ↓
                                      Extract chunks
                                            ↓
                                    Broadcast via channel
```

**Buffer Size:** 4096 samples
- **Duration:** ~93ms per chunk (4096 / 44100 = 0.093 seconds)
- **Trade-off:** Balance between latency and CPU usage
  - Smaller buffer = Lower latency, Higher CPU
  - Larger buffer = Higher latency, Lower CPU

---

### 3. Host: Audio Broadcasting

**Every 93ms, this callback is triggered:**

```typescript
scriptProcessor.onaudioprocess = (event) => {
  // Get audio data from buffer
  const inputData = event.inputBuffer.getChannelData(0)
  // Float32Array[4096] with values from -1.0 to 1.0

  // Convert to regular array for JSON serialization
  const audioData = Array.from(inputData)

  // Broadcast to Supabase Realtime channel
  channel.send({
    type: 'broadcast',
    event: 'audio_chunk',
    payload: { audioData }  // [0.002, -0.003, 0.001, ...]
  })
}
```

**Audio Data Format:**
```javascript
// Float32Array with amplitude values
[
  0.002,   // Sample 1: Small positive amplitude
  -0.003,  // Sample 2: Small negative amplitude
  0.001,   // Sample 3: Very quiet
  0.856,   // Sample 4: Loud sound
  ...      // 4092 more samples
]
```

**Values range:** `-1.0` to `1.0`
- `0.0` = Silence
- `1.0` = Maximum positive amplitude
- `-1.0` = Maximum negative amplitude

---

### 4. Supabase Realtime Channel

**Channel Configuration:**

```typescript
const channel = supabase.channel(`room:{roomId}`, {
  config: {
    broadcast: {
      self: false,  // Host doesn't receive own broadcasts
      ack: false,   // No server acknowledgment needed
    }
  }
})
```

**How it works:**
1. Host creates/joins channel: `room:123`
2. Listeners join the same channel: `room:123`
3. Host broadcasts → Supabase relays → All listeners receive
4. No server-side processing, just relay (low latency)

**Channel Lifecycle:**
```
Host creates room
  → Channel created: `room:abc-123`
    → Listeners join same channel
      → Host broadcasts audio
        → Supabase relays to all listeners
          → Host ends room
            → Channel destroyed
```

---

### 5. Listeners: Receiving Audio

**File:** `src/lib/audioStreaming.ts` → `AudioListenerService.startListening()`

```typescript
// Subscribe to audio chunks
channel.on('broadcast', { event: 'audio_chunk' }, (payload) => {
  const audioData = payload.payload.audioData as number[]

  // Add to playback queue
  this.audioQueue.push(new Float32Array(audioData))
})
```

**Audio Queue:**
- Listeners receive chunks → Add to queue
- ScriptProcessor continuously reads from queue → Play audio
- Queue prevents stuttering/gaps

---

### 6. Listeners: Audio Playback

```typescript
// Create audio processor for playback
const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1)

scriptProcessor.onaudioprocess = (event) => {
  const outputData = event.outputBuffer.getChannelData(0)

  if (audioQueue.length > 0) {
    // Get next chunk from queue
    const chunk = audioQueue.shift()

    // Write to output buffer → Play through speakers
    for (let i = 0; i < outputData.length && i < chunk.length; i++) {
      outputData[i] = chunk[i]
    }
  } else {
    // No data in queue → Play silence
    outputData.fill(0)
  }
}

// Connect to speakers
scriptProcessor.connect(audioContext.destination)
```

**Playback Flow:**
```
Receive chunk → Add to queue → Read from queue → Output buffer → Speakers
     ↓              ↓              ↓                 ↓              ↓
  Network        Memory         Process          Web Audio      Hardware
```

---

## Timing & Performance

### Latency Breakdown

| Stage | Duration | Notes |
|-------|----------|-------|
| Audio capture | ~0ms | Hardware capture |
| Buffer processing | ~93ms | 4096 samples buffer |
| Network transmission | ~50-200ms | Depends on connection |
| Listener buffering | ~93ms | Playback buffer |
| **Total latency** | **~236-386ms** | Quarter to half second |

### Data Rate

```
Sample Rate: 44100 Hz (samples/second)
Channels: 1 (mono)
Bit Depth: 32-bit float (but sent as JSON array)

Data per chunk:
- 4096 samples × 4 bytes = 16 KB raw
- JSON overhead: ~2x = ~32 KB per chunk
- Frequency: ~10.7 chunks/second (1000ms / 93ms)

Bandwidth: ~32 KB × 10.7 = ~342 KB/second = ~2.7 Mbps
```

**Note:** This is high! Consider compression in production.

---

## Security Considerations

### Current Implementation

⚠️ **WARNING:** Current implementation has security issues!

```typescript
// ❌ Client-side check only (can be bypassed)
if (!isHost) {
  setError('Only the host can start streaming')
  return
}

// ❌ Anyone can broadcast to any channel
const channel = supabase.channel('room:any-id')
channel.send({ event: 'audio_chunk', payload: fakeAudio })
```

### Potential Attacks

1. **Fake Host:** Listener can bypass `isHost` check and broadcast fake audio
2. **Channel Hijacking:** Malicious user can join any channel if they know the roomId
3. **Audio Injection:** Send fake audio chunks to disrupt the stream
4. **Spam Attack:** Flood channel with messages

### Recommended Solutions

#### Option 1: Presence Tracking (Client-side)
```typescript
// Track user role
await channel.track({ role: 'host', userId: user.id })

// Validate sender before playing audio
channel.on('broadcast', { event: 'audio_chunk' }, (payload) => {
  const presence = channel.presenceState()
  const sender = presence[payload.senderId]

  if (sender?.role === 'host') {
    playAudio(payload.audioData) // ✅ Valid
  } else {
    console.warn('Rejected non-host audio') // ❌ Reject
  }
})
```

**Pros:** Easy to implement
**Cons:** Still client-side, can be bypassed by sophisticated attackers

#### Option 2: Server-side Authorization (Recommended)
```sql
-- Supabase RLS policy for Realtime
CREATE POLICY "Only room host can broadcast"
ON realtime.messages
FOR INSERT
WITH CHECK (
  (SELECT host_id FROM live_rooms WHERE id = channel_id::uuid) = auth.uid()
);
```

**Pros:** True server-side validation, secure
**Cons:** Requires Supabase Pro plan, more complex setup

---

## Code References

### Main Files

| File | Purpose |
|------|---------|
| `src/lib/audioStreaming.ts` | Core audio streaming logic |
| `src/hooks/useAudioStream.ts` | React hook for audio streaming |
| `src/hooks/useLiveRoom.ts` | Live room state management |
| `src/components/LiveRoom.tsx` | UI component for live rooms |

### Key Functions

| Function | File | Description |
|----------|------|-------------|
| `startCapture()` | audioStreaming.ts:31 | Request microphone access |
| `startBroadcast()` | audioStreaming.ts:51 | Start broadcasting audio |
| `startListening()` | audioStreaming.ts:130 | Start receiving audio |
| `stopBroadcast()` | audioStreaming.ts:90 | Stop streaming and cleanup |

---

## Troubleshooting

### Common Issues

#### 1. No audio received by listeners
**Check:**
- Host has started streaming (`isStreaming = true`)
- Channel names match exactly (`room:{roomId}`)
- Listeners have subscribed to channel
- Browser console for errors

#### 2. Audio is choppy/stuttering
**Causes:**
- Network latency too high (>500ms)
- CPU overloaded (increase buffer size)
- Queue not filling fast enough

**Solutions:**
- Increase buffer size: `4096 → 8192`
- Reduce audio quality: `44100 → 22050 Hz`
- Implement adaptive buffering

#### 3. Echo/feedback loop
**Check:**
- `echoCancellation` is enabled
- `self: false` in channel config
- Host is not playing audio while streaming

#### 4. High bandwidth usage
**Current:** ~2.7 Mbps per stream

**Solutions:**
- Implement audio compression (Opus codec)
- Reduce sample rate: `44100 → 16000 Hz` (voice optimized)
- Use lower bit depth: 32-bit → 16-bit

---

## Future Improvements

### 1. Audio Compression
```typescript
// Use Opus codec for compression
// Reduce bandwidth from 2.7 Mbps to ~50 Kbps
const encoder = new OpusEncoder()
const compressed = encoder.encode(audioData)
```

### 2. Adaptive Quality
```typescript
// Adjust quality based on network conditions
if (networkSpeed < 1Mbps) {
  sampleRate = 16000  // Lower quality
} else {
  sampleRate = 44100  // High quality
}
```

### 3. Replace ScriptProcessorNode
```typescript
// ScriptProcessorNode is deprecated
// Use AudioWorklet (modern API)
await audioContext.audioWorklet.addModule('audio-processor.js')
const worklet = new AudioWorkletNode(audioContext, 'audio-processor')
```

### 4. Multi-host Support
- Allow multiple people to speak (like Clubhouse)
- Manage speaker permissions
- Mix multiple audio streams

---

## References

- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MediaStream API](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_API)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Audio Worklet](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet)

---

**Last Updated:** 2025-01-08
**Version:** 1.0.0
