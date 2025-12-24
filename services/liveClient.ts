import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

// Audio Context Helpers
function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Hook-like class structure to manage the session
export class LiveSessionManager {
  private ai: GoogleGenAI;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private inputNode: GainNode | null = null;
  private outputNode: GainNode | null = null;
  private sources: Set<AudioBufferSourceNode> = new Set();
  private nextStartTime: number = 0;
  private session: any = null; // Session type is not fully exported nicely, using any for internal logic
  private active: boolean = false;
  private onVolumeUpdate: (vol: number) => void;
  private mediaStream: MediaStream | null = null;

  constructor(apiKey: string, onVolumeChange: (vol: number) => void) {
    this.ai = new GoogleGenAI({ apiKey });
    this.onVolumeUpdate = onVolumeChange;
  }

  async connect(systemInstruction: string, voiceName: string) {
    this.active = true;

    // Check if mediaDevices exists (fails on non-HTTPS except localhost)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("navigator.mediaDevices.getUserMedia is not defined. Ensure you are using HTTPS or localhost.");
    }

    // 1. Get Microphone Access first to fail fast and cleanly
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      // Re-throw without logging to console, caller handles UI feedback
      throw err;
    }

    // Race condition check: If disconnect() was called while we were awaiting getUserMedia
    if (!this.active) {
      stream.getTracks().forEach(track => track.stop());
      return;
    }

    this.mediaStream = stream;

    // 2. Initialize Audio Contexts
    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

    // Resume contexts if suspended (browser autoplay policy)
    if (this.inputAudioContext.state === 'suspended') await this.inputAudioContext.resume();
    if (this.outputAudioContext.state === 'suspended') await this.outputAudioContext.resume();

    this.inputNode = this.inputAudioContext.createGain();
    this.outputNode = this.outputAudioContext.createGain();

    // Setup visualizer analyzer for output
    const analyzer = this.outputAudioContext.createAnalyser();
    analyzer.fftSize = 256;
    this.outputNode.connect(analyzer);
    this.outputNode.connect(this.outputAudioContext.destination);

    // Basic visualizer loop
    const dataArray = new Uint8Array(analyzer.frequencyBinCount);
    const updateVolume = () => {
      if (!this.active) return;
      analyzer.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      const avg = sum / dataArray.length;
      this.onVolumeUpdate(avg);
      requestAnimationFrame(updateVolume);
    };
    updateVolume();

    // Store stream for cleanup, use valid reference
    const currentStream = this.mediaStream;

    const sessionPromise = this.ai.live.connect({
      model: 'gemini-2.0-flash-exp',
      callbacks: {
        onopen: () => {
          console.log('Gemini Live Session Opened');
          if (!this.inputAudioContext || !currentStream) return;
          const source = this.inputAudioContext.createMediaStreamSource(currentStream);
          const scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

          scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
            if (!this.active) return;
            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
            const pcmBlob = createBlob(inputData);
            sessionPromise.then((session) => {
              session.sendRealtimeInput({ media: pcmBlob });
            });
          };

          source.connect(scriptProcessor);
          scriptProcessor.connect(this.inputAudioContext.destination);
        },
        onmessage: async (message: LiveServerMessage) => {
          if (!this.active) return;

          const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;

          if (base64EncodedAudioString && this.outputAudioContext && this.outputNode) {
            this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);

            const audioBuffer = await decodeAudioData(
              decode(base64EncodedAudioString),
              this.outputAudioContext,
              24000,
              1
            );

            const source = this.outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.outputNode);
            source.addEventListener('ended', () => {
              this.sources.delete(source);
            });

            source.start(this.nextStartTime);
            this.nextStartTime += audioBuffer.duration;
            this.sources.add(source);
          }

          const interrupted = message.serverContent?.interrupted;
          if (interrupted) {
            // Stop currently playing audio if the user interrupts
            for (const source of this.sources.values()) {
              source.stop();
              this.sources.delete(source);
            }
            this.nextStartTime = 0;
          }
        },
        onerror: (err) => {
          console.error('Gemini Live Error:', err);
        },
        onclose: () => {
          console.log('Gemini Live Closed');
        }
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
        },
        systemInstruction: systemInstruction,
      },
    });

    this.session = sessionPromise;
    return sessionPromise;
  }

  async disconnect() {
    this.active = false;

    // Cleanup Media Stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    // Cleanup Nodes
    if (this.inputNode) {
      this.inputNode.disconnect();
      this.inputNode = null;
    }
    if (this.outputNode) {
      this.outputNode.disconnect();
      this.outputNode = null;
    }

    // Close Audio Contexts
    if (this.inputAudioContext) {
      await this.inputAudioContext.close();
      this.inputAudioContext = null;
    }
    if (this.outputAudioContext) {
      await this.outputAudioContext.close();
      this.outputAudioContext = null;
    }

    // Stop all playing sources
    for (const source of this.sources.values()) {
      source.stop();
    }
    this.sources.clear();
    this.nextStartTime = 0;

    // Close session if possible
    if (this.session) {
      this.session = null;
    }
  }
}