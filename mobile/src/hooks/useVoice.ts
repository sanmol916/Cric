import { useCallback, useEffect, useRef, useState } from 'react';

// @react-native-voice/voice is a native module: it only works in a custom dev
// build or a store build, NOT in the standard Expo Go app. We load it
// defensively so the app still runs (with manual entry) when it is absent.
type VoiceModule = typeof import('@react-native-voice/voice').default;

let Voice: VoiceModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Voice = require('@react-native-voice/voice').default as VoiceModule;
} catch {
  Voice = null;
}

export interface UseVoiceResult {
  available: boolean;
  listening: boolean;
  partial: string;
  finalText: string;
  error: string | null;
  start: (locale?: string) => Promise<void>;
  stop: () => Promise<void>;
  reset: () => void;
}

export function useVoice(): UseVoiceResult {
  const [available, setAvailable] = useState(false);
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState('');
  const [finalText, setFinalText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!Voice) {
      setAvailable(false);
      return;
    }

    Voice.onSpeechStart = () => mounted.current && setListening(true);
    Voice.onSpeechEnd = () => mounted.current && setListening(false);
    Voice.onSpeechError = (e) => {
      if (!mounted.current) return;
      setListening(false);
      const code = e?.error?.code;
      if (code === '7' || code === 'recognition_fail') return; // no-match, ignore
      setError(e?.error?.message || 'Speech recognition error');
    };
    Voice.onSpeechResults = (e) => {
      if (!mounted.current) return;
      const text = e.value?.[0] ?? '';
      if (text) {
        setFinalText((prev) => (prev ? `${prev} ${text}` : text).trim());
        setPartial('');
      }
    };
    Voice.onSpeechPartialResults = (e) => {
      if (!mounted.current) return;
      setPartial(e.value?.[0] ?? '');
    };

    Voice.isAvailable()
      .then((v) => mounted.current && setAvailable(!!v))
      .catch(() => mounted.current && setAvailable(false));

    return () => {
      mounted.current = false;
      try {
        Voice?.destroy().then(() => Voice?.removeAllListeners());
      } catch {
        /* ignore */
      }
    };
  }, []);

  const start = useCallback(async (locale = 'hi-IN') => {
    if (!Voice) {
      setError('Voice recognition needs a dev/production build. Use manual entry in Expo Go.');
      return;
    }
    setError(null);
    setPartial('');
    setFinalText('');
    try {
      await Voice.start(locale);
      setListening(true);
    } catch {
      setError('Could not start the microphone. Check permissions.');
      setListening(false);
    }
  }, []);

  const stop = useCallback(async () => {
    if (!Voice) return;
    try {
      await Voice.stop();
    } catch {
      /* ignore */
    }
    setListening(false);
  }, []);

  const reset = useCallback(() => {
    setPartial('');
    setFinalText('');
    setError(null);
  }, []);

  return { available, listening, partial, finalText, error, start, stop, reset };
}
