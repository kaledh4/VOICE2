export class TTSService {
    private static audio: HTMLAudioElement | null = null;

    static speak(text: string, characterVoice: string = 'ar-SA'): Promise<void> {
        return new Promise((resolve) => {
            // 1. Try Browser Native Speech Synthesis first
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ar-SA';

            const voices = window.speechSynthesis.getVoices();
            const arabicVoice = voices.find(v => v.lang.startsWith('ar'));

            if (arabicVoice) {
                utterance.voice = arabicVoice;
                utterance.onend = () => resolve();
                utterance.onerror = () => resolve(); // Fallback on error
                window.speechSynthesis.speak(utterance);
            } else {
                // 2. Fallback to Google Translate TTS API (Network based)
                // This is a reliable free way to get Arabic voices when the device doesn't have them.
                this.speakWithFallback(text).then(resolve);
            }
        });
    }

    private static speakWithFallback(text: string): Promise<void> {
        return new Promise((resolve) => {
            if (this.audio) {
                this.audio.pause();
                this.audio = null;
            }

            const encodedText = encodeURIComponent(text);
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ar&client=tw-ob&q=${encodedText}`;

            this.audio = new Audio(url);
            this.audio.onended = () => resolve();
            this.audio.onerror = () => {
                console.error("TTS Fallback failed");
                resolve();
            };

            this.audio.play().catch(err => {
                console.error("Audio play failed:", err);
                resolve();
            });
        });
    }

    static stop() {
        window.speechSynthesis.cancel();
        if (this.audio) {
            this.audio.pause();
            this.audio = null;
        }
    }
}
