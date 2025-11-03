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

      return this.mediaStream;
    } catch (error) {
      console.error("Error accessing microphone:", error);
      throw new Error("Failed to access microphone. Please check permissions.");
    }
  }

  async startBroadcast(channel: RealtimeChannel): Promise<void> {
    if (!this.mediaStream) {
      throw new Error("Media stream not initialized. Call startCapture first.");
    }

    this.channel = channel;
    this.audioContext = new AudioContext({
      sampleRate: this.config.sampleRate,
    });
    this.mediaStreamSource = this.audioContext.createMediaStreamSource(
      this.mediaStream
    );

    // Load AudioWorklet module
    await this.audioContext.audioWorklet.addModule(
      "/audio-broadcast-processor.js"
    );

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

    // Listen for audio data from the worklet
    this.workletNode.port.onmessage = (event) => {
      if (!this.isStreaming) return;

      // Convert ArrayBuffer back to Float32Array, then to regular array for JSON
      const audioData = Array.from(new Float32Array(event.data.audioData));

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
  }

  stopBroadcast(): void {
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
    this.channel = channel;
    this.audioContext = new AudioContext({ sampleRate: 44100 });

    // Load AudioWorklet module
    await this.audioContext.audioWorklet.addModule(
      "/audio-playback-processor.js"
    );

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

    // Connect to audio destination (speakers)
    this.workletNode.connect(this.audioContext.destination);
    this.isPlaying = true;

    // Subscribe to audio chunks from Supabase
    this.channel
      .on("broadcast", { event: "audio_chunk" }, (payload) => {
        console.log("payload", payload);
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
  }

  stopListening(): void {
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
  }

  isActive(): boolean {
    return this.isPlaying;
  }
}
