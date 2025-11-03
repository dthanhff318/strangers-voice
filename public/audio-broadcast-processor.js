// AudioWorklet Processor for Broadcasting Audio
// This runs on the audio rendering thread (separate from main thread)

class BroadcastProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.bufferSize = 4096
    this.buffer = []
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]

    // If no input, return
    if (!input || !input[0]) {
      return true
    }

    const inputChannel = input[0] // First channel (mono)

    // Accumulate samples in buffer
    for (let i = 0; i < inputChannel.length; i++) {
      this.buffer.push(inputChannel[i])
    }

    // When buffer reaches desired size, send to main thread
    if (this.buffer.length >= this.bufferSize) {
      // Convert to Float32Array for efficient transfer
      const audioData = new Float32Array(this.buffer.splice(0, this.bufferSize))

      // Send to main thread (transferable for better performance)
      this.port.postMessage({ audioData: audioData.buffer }, [audioData.buffer])
    }

    return true // Keep processor alive
  }
}

// Register the processor
registerProcessor('broadcast-processor', BroadcastProcessor)
