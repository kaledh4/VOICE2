export class SpeechRecognitionService {
    private recognition: any;
    private isListening: boolean = false;
    private onResult: (text: string) => void;
    private onEnd: () => void;
    private onError: (error: string) => void;

    constructor(
        onResult: (text: string) => void,
        onEnd: () => void,
        onError: (error: string) => void
    ) {
        this.onResult = onResult;
        this.onEnd = onEnd;
        this.onError = onError;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            this.onError("المتصفح لا يدعم التعرف على الكلام. يرجى استخدام متصفح كروم.");
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'ar-SA';
        this.recognition.continuous = false;
        this.recognition.interimResults = false;

        this.recognition.onresult = (event: any) => {
            const text = event.results[0][0].transcript;
            this.onResult(text);
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.onEnd();
        };

        this.recognition.onerror = (event: any) => {
            this.isListening = false;
            this.onError(event.error);
        };
    }

    start() {
        if (this.isListening) return;
        try {
            this.recognition.start();
            this.isListening = true;
        } catch (e) {
            console.error(e);
        }
    }

    stop() {
        if (!this.isListening) return;
        this.recognition.stop();
        this.isListening = false;
    }
}
