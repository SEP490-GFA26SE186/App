// src/utils/speech-tts.ts
// Universal Speech Synthesis (TTS) for Web & Native Expo Go
// Reads story page aloud in Vietnamese with soothing voice, adjustable speed, and play/pause controls

export interface SpeechOptions {
  rate?: number; // 0.85 for gentle kids reading, 1.0 for normal
  pitch?: number; // 1.05 for friendly tone
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

let ExpoSpeech: any = null;
try {
  ExpoSpeech = require('expo-speech');
} catch {}

class SpeechTTSManager {
  private synth: any = null;
  private currentUtterance: any = null;
  private isSpeaking: boolean = false;
  private viVoice: any = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoice();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.initVoice();
      }
    }
  }

  private initVoice() {
    if (!this.synth) return;
    try {
      const voices = this.synth.getVoices();
      this.viVoice =
        voices.find((v: any) => v.lang && (v.lang.startsWith('vi') || v.name.toLowerCase().includes('vietnam'))) ||
        voices.find((v: any) => v.lang && v.lang.startsWith('en')) ||
        null;
    } catch {}
  }

  public speak(text: string, options: SpeechOptions = {}) {
    const cleanText = text.replace(/\[.*?\]/g, '').trim();
    if (!cleanText) return;

    // Stop any running speech first
    this.stop();

    // 1. Native Expo Go / React Native Support
    if (ExpoSpeech && typeof ExpoSpeech.speak === 'function') {
      this.isSpeaking = true;
      options.onStart?.();

      ExpoSpeech.speak(cleanText, {
        language: 'vi-VN',
        pitch: options.pitch ?? 1.05,
        rate: options.rate ?? 0.9,
        onStart: () => {
          this.isSpeaking = true;
          options.onStart?.();
        },
        onDone: () => {
          this.isSpeaking = false;
          options.onEnd?.();
        },
        onStopped: () => {
          this.isSpeaking = false;
          options.onEnd?.();
        },
        onError: (err: any) => {
          this.isSpeaking = false;
          options.onError?.(err);
        },
      });
      return;
    }

    // 2. Web Browser Speech Synthesis Support
    if (this.synth && typeof SpeechSynthesisUtterance !== 'undefined') {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'vi-VN';
      utterance.rate = options.rate ?? 0.9;
      utterance.pitch = options.pitch ?? 1.05;

      if (this.viVoice) {
        utterance.voice = this.viVoice;
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
        options.onStart?.();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        options.onEnd?.();
      };

      utterance.onerror = (err) => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        options.onError?.(err);
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    }
  }

  public stop() {
    this.isSpeaking = false;
    if (ExpoSpeech && typeof ExpoSpeech.stop === 'function') {
      try {
        ExpoSpeech.stop();
      } catch {}
    }
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {}
      this.currentUtterance = null;
    }
  }

  public pause() {
    if (ExpoSpeech && typeof ExpoSpeech.pause === 'function') {
      try {
        ExpoSpeech.pause();
      } catch {}
    }
    if (this.synth && this.isSpeaking) {
      try {
        this.synth.pause();
      } catch {}
    }
  }

  public resume() {
    if (ExpoSpeech && typeof ExpoSpeech.resume === 'function') {
      try {
        ExpoSpeech.resume();
      } catch {}
    }
    if (this.synth) {
      try {
        this.synth.resume();
      } catch {}
    }
  }

  public getSpeakingState(): boolean {
    return this.isSpeaking;
  }
}

export const speechTTS = new SpeechTTSManager();
