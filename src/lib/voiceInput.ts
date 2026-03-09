/**
 * Voice Input — Web Speech API integration for Arcus.
 *
 * Provides a React hook that:
 *  1. Requests microphone permission on first click.
 *  2. Streams live speech-to-text into a callback so the prompt bar
 *     updates in real-time as the user speaks.
 *  3. Exposes start/stop controls and an `isListening` flag.
 */

'use client';

import { useCallback, useRef, useState } from 'react';

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  return (
    (window as unknown as Record<string, unknown>).SpeechRecognition as new () => SpeechRecognitionLike ??
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition as new () => SpeechRecognitionLike ??
    null
  );
}

export interface UseVoiceInputOptions {
  /** Called with the latest transcript (final + interim) on every recognition event. */
  onTranscript: (text: string) => void;
  /** Called when a permission or runtime error occurs. */
  onError?: (message: string) => void;
  /** BCP-47 language tag, defaults to 'en-US'. */
  lang?: string;
}

export function useVoiceInput({ onTranscript, onError, lang = 'en-US' }: UseVoiceInputOptions) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef('');

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const start = useCallback(async () => {
    if (isListening) {
      stop();
      return;
    }

    if (typeof window === 'undefined') return;
    if (!window.isSecureContext) {
      onError?.('Microphone requires HTTPS or localhost.');
      return;
    }

    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      onError?.('Speech recognition is not supported in this browser.');
      return;
    }

    // Explicitly request mic permission first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
    } catch {
      onError?.('Microphone permission is required. Check your browser settings.');
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;
    finalRef.current = '';

    recognition.onresult = (event) => {
      let interim = '';
      let finalText = finalRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        const t = r?.[0]?.transcript || '';
        if (r?.isFinal) {
          finalText += t;
        } else {
          interim += t;
        }
      }

      finalRef.current = finalText;
      onTranscript(`${finalText}${interim}`.trimStart());
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      recognitionRef.current = null;
      if (event.error && event.error !== 'no-speech' && event.error !== 'aborted') {
        onError?.('Dictation error. Please try again.');
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }, [isListening, lang, onError, onTranscript, stop]);

  return { isListening, start, stop };
}
