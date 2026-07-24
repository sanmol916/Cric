import { useCallback, useEffect, useRef, useState } from 'react';

// Minimal typings for the Web Speech API (not in the standard DOM lib).
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResult {
  readonly length: number;
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface UseSpeechResult {
  supported: boolean;
  listening: boolean;
  interim: string;
  finalTranscript: string;
  error: string | null;
  lang: string;
  setLang: (lang: string) => void;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

/**
 * React wrapper around the browser SpeechRecognition API.
 * Defaults to Hindi (hi-IN) which handles Hinglish speech well.
 */
export function useSpeech(defaultLang = 'hi-IN'): UseSpeechResult {
  const [supported] = useState<boolean>(() => getRecognitionCtor() !== null);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState(defaultLang);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const shouldListenRef = useRef(false);

  useEffect(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = lang;

    recognition.onresult = (e) => {
      let interimText = '';
      let finalText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const text = result[0]?.transcript ?? '';
        if (result.isFinal) finalText += text;
        else interimText += text;
      }
      if (finalText) {
        setFinalTranscript((prev) => (prev ? `${prev} ${finalText}` : finalText).trim());
        setInterim('');
      } else {
        setInterim(interimText);
      }
    };
    recognition.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      setError(e.error === 'not-allowed'
        ? 'Microphone permission denied. Allow mic access and try again.'
        : `Speech error: ${e.error}`);
    };
    recognition.onend = () => {
      // Chrome stops after silence; restart if the user is still recording.
      if (shouldListenRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          /* ignore */
        }
      }
      setListening(false);
    };

    recognitionRef.current = recognition;
    return () => {
      shouldListenRef.current = false;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      try {
        recognition.abort();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    };
  }, [lang]);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    setError(null);
    setInterim('');
    shouldListenRef.current = true;
    try {
      recognition.start();
      setListening(true);
    } catch {
      // start() throws if already started — ignore.
    }
  }, []);

  const stop = useCallback(() => {
    shouldListenRef.current = false;
    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
    }
    setListening(false);
    setInterim('');
  }, []);

  const reset = useCallback(() => {
    setFinalTranscript('');
    setInterim('');
    setError(null);
  }, []);

  return {
    supported,
    listening,
    interim,
    finalTranscript,
    error,
    lang,
    setLang,
    start,
    stop,
    reset,
  };
}
