import { RealtimeChannel } from "@supabase/supabase-js";

export interface AudioStreamConfig {
  sampleRate?: number;
  channelCount?: number;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
}

export class AudioStreamService {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private channel: RealtimeChannel | null = null;
  private isStreaming = false;
  private config: AudioStreamConfig;

  constructor(config: AudioStreamConfig = {}) {
    this.config = {
      sampleRate: 44100,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      ...config,
    };
  }

  async startCapture(): Promise<MediaStream> {
    try {
      console.log("[BROADCAST] 🎤 Requesting microphone access...");
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channelCount,
          echoCancellation: this.config.echoCancellation,
          noiseSuppression: this.config.noiseSuppression,
          autoGainControl: this.config.autoGainControl,
        },
        video: false,
      });

      console.log("[BROADCAST] ✅ Microphone access granted");
      return this.mediaStream;
    } catch (error) {
      console.error("[BROADCAST] ❌ Error accessing microphone:", error);
      throw new Error("Failed to access microphone. Please check permissions.");
    }
  }

  async startBroadcast(channel: RealtimeChannel): Promise<void> {
    if (!this.mediaStream) {
      throw new Error("Media stream not initialized. Call startCapture first.");
    }

    console.log("[BROADCAST] 📡 Starting broadcast...");
    this.channel = channel;
    this.audioContext = new AudioContext({
      sampleRate: this.config.sampleRate,
    });
    console.log("[BROADCAST] AudioContext created, state:", this.audioContext.state);

    this.mediaStreamSource = this.audioContext.createMediaStreamSource(
      this.mediaStream
    );

    // Load AudioWorklet module
    console.log("[BROADCAST] Loading AudioWorklet module...");
    await this.audioContext.audioWorklet.addModule(
      "/audio-broadcast-processor.js"
    );
    console.log("[BROADCAST] ✅ AudioWorklet module loaded");

    // Create AudioWorkletNode
    this.workletNode = new AudioWorkletNode(
      this.audioContext,
      "broadcast-processor",
      {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        channelCount: this.config.channelCount!,
      }
    );
    console.log("[BROADCAST] AudioWorkletNode created");

    let chunkCount = 0;
    // Listen for audio data from the worklet
    this.workletNode.port.onmessage = (event) => {
      if (!this.isStreaming) return;

      // Convert ArrayBuffer back to Float32Array, then to regular array for JSON
      const audioData = Array.from(new Float32Array(event.data.audioData));
      chunkCount++;

      if (chunkCount % 100 === 0) {
        console.log(`[BROADCAST] 📤 Sent ${chunkCount} audio chunks, data size:`, audioData.length);
      }

      // Broadcast audio chunks via Supabase Realtime
      this.channel?.send({
        type: "broadcast",
        event: "audio_chunk",
        payload: { audioData },
      });
    };

    // Connect the audio graph
    this.mediaStreamSource.connect(this.workletNode);
    this.workletNode.connect(this.audioContext.destination);
    this.isStreaming = true;
    console.log("[BROADCAST] ✅ Broadcasting started successfully");
  }

  stopBroadcast(): void {
    console.log("[BROADCAST] 🛑 Stopping broadcast...");
    this.isStreaming = false;

    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode.port.onmessage = null;
      this.workletNode = null;
    }

    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
      this.mediaStreamSource = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.channel = null;
    console.log("[BROADCAST] ✅ Broadcast stopped");
  }

  isActive(): boolean {
    return this.isStreaming;
  }
}

export class AudioListenerService {
  private audioContext: AudioContext | null = null;
  private isPlaying = false;
  private workletNode: AudioWorkletNode | null = null;
  private channel: RealtimeChannel | null = null;

  constructor() {}

  async startListening(channel: RealtimeChannel): Promise<void> {
    console.log("[LISTENER] 🎧 Starting listening...");
    this.channel = channel;
    this.audioContext = new AudioContext({ sampleRate: 44100 });
    console.log("[LISTENER] AudioContext created, state:", this.audioContext.state);

    // Load AudioWorklet module
    console.log("[LISTENER] Loading AudioWorklet module...");
    await this.audioContext.audioWorklet.addModule(
      "/audio-playback-processor.js"
    );
    console.log("[LISTENER] ✅ AudioWorklet module loaded");

    // Create AudioWorkletNode for playback
    this.workletNode = new AudioWorkletNode(
      this.audioContext,
      "playback-processor",
      {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        channelCount: 1,
      }
    );
    console.log("[LISTENER] AudioWorkletNode created");

    // Connect to audio destination (speakers)
    this.workletNode.connect(this.audioContext.destination);
    this.isPlaying = true;

    let receivedCount = 0;
    // Subscribe to audio chunks from Supabase
    this.channel
      .on("broadcast", { event: "audio_chunk" }, (payload) => {
        receivedCount++;
        if (receivedCount === 1) {
          console.log("[LISTENER] 📥 First audio chunk received!");
        }
        if (receivedCount % 100 === 0) {
          console.log(`[LISTENER] 📥 Received ${receivedCount} audio chunks`);
        }

        const audioData = payload.payload.audioData as number[];
        if (audioData && this.isPlaying && this.workletNode) {
          // Convert to Float32Array and send to worklet
          const float32Data = new Float32Array(audioData);
          this.workletNode.port.postMessage({ audioData: float32Data.buffer }, [
            float32Data.buffer,
          ]);
        }
      })
      .subscribe();

    console.log("[LISTENER] ✅ Listening started successfully");
  }

  stopListening(): void {
    console.log("[LISTENER] 🛑 Stopping listening...");
    this.isPlaying = false;

    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }

    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode.port.onmessage = null;
      this.workletNode = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    console.log("[LISTENER] ✅ Listening stopped");
  }

  isActive(): boolean {
    return this.isPlaying;
  }
}
