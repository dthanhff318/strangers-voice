// AudioWorklet Processor for Playing Audio
// This runs on the audio rendering thread (separate from main thread)

class PlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.audioQueue = []
    this.currentChunk = null
    this.chunkIndex = 0

    // Listen for audio chunks from main thread
    this.port.onmessage = (event) => {
      if (event.data.audioData) {
        // Receive ArrayBuffer and convert back to Float32Array
        const audioData = new Float32Array(event.data.audioData)
        this.audioQueue.push(audioData)
      }
    }
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0]

    if (!output || !output[0]) {
      return true
    }

    const outputChannel = output[0] // First channel (mono)

    // Fill the output buffer with queued audio data
    for (let i = 0; i < outputChannel.length; i++) {
      // If we don't have a current chunk, get one from the queue
      if (!this.currentChunk || this.chunkIndex >= this.currentChunk.length) {
        this.currentChunk = this.audioQueue.shift() || null
        this.chunkIndex = 0
      }

      // If we have audio data, play it. Otherwise, output silence
      if (this.currentChunk && this.chunkIndex < this.currentChunk.length) {
        outputChannel[i] = this.currentChunk[this.chunkIndex]
        this.chunkIndex++
      } else {
        outputChannel[i] = 0 // Silence
      }
    }

    return true // Keep processor alive
  }
}

// Register the processor
registerProcessor('playback-processor', PlaybackProcessor)
