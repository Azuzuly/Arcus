/**
 * Voice Input — Web Speech API wrapper
 * Streams speech recognition results directly into the prompt bar.
 * Requests microphone permission on first use.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface VoiceInputState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  permissionState: 'prompt' | 'granted' | 'denied' | 'unknown';
}

interface UseVoiceInputOptions {
  /** Called with the final transcript when speech ends or is stopped */
  onResult?: (transcript: string) => void;
  /** Called with interim (in-progress) transcript as user speaks */
  onInterim?: (interim: string) => void;
  /** Called when listening starts */
  onStart?: () => void;
  /** Called when listening stops */
  onEnd?: () => void;
  /** Called on error */
  onError?: (error: string) => void;
  /** Language for recognition (default: 'en-US') */
  language?: string;
  /** Continuous mode - keep listening until manually stopped */
  continuous?: boolean;
}

// Extend Window for SpeechRecognition
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

function getSpeechRecognition(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  return (
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    null
  );
}

/**
 * Check if the browser supports the Web Speech API.
 */
export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognition() !== null;
}

/**
 * Request microphone permission explicitly.
 * Returns the permission state.
 */
export async function requestMicrophonePermission(): Promise<'granted' | 'denied' | 'prompt'> {
  try {
    // Try the Permissions API first
    if (navigator.permissions) {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      if (result.state === 'granted') return 'granted';
      if (result.state === 'denied') return 'denied';
    }

    // Trigger the actual permission prompt by requesting a stream
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop all tracks immediately - we just needed the permission
    stream.getTracks().forEach(track => track.stop());
    return 'granted';
  } catch (err: any) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      return 'denied';
    }
    return 'denied';
  }
}

/**
 * React hook for voice input with streaming transcription.
 */
export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const {
    onResult,
    onInterim,
    onStart,
    onEnd,
    onError,
    language = 'en-US',
    continuous = true,
  } = options;

  const [state, setState] = useState<VoiceInputState>({
    isListening: false,
    isSupported: false,
    transcript: '',
    interimTranscript: '',
    error: null,
    permissionState: 'unknown',
  });

  const recognitionRef = useRef<any>(null);
  const accumulatedTranscriptRef = useRef('');

  // Check support on mount
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isSupported: isSpeechRecognitionSupported(),
    }));
  }, []);

  /**
   * Start listening. Will request mic permission if needed.
   */
  const startListening = useCallback(async () => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      const errMsg = 'Speech recognition is not supported in this browser.';
      setState(prev => ({ ...prev, error: errMsg }));
      onError?.(errMsg);
      return;
    }

    // Request microphone permission first
    const permission = await requestMicrophonePermission();
    setState(prev => ({ ...prev, permissionState: permission }));

    if (permission === 'denied') {
      const errMsg = 'Microphone permission denied. Please allow microphone access in your browser settings.';
      setState(prev => ({ ...prev, error: errMsg }));
      onError?.(errMsg);
      return;
    }

    // Create recognition instance
    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setState(prev => ({
        ...prev,
        isListening: true,
        error: null,
        transcript: '',
        interimTranscript: '',
      }));
      accumulatedTranscriptRef.current = '';
      onStart?.();
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        accumulatedTranscriptRef.current += finalTranscript;
        setState(prev => ({
          ...prev,
          transcript: accumulatedTranscriptRef.current,
          interimTranscript: '',
        }));
        onResult?.(accumulatedTranscriptRef.current);
      }

      if (interimTranscript) {
        setState(prev => ({ ...prev, interimTranscript }));
        onInterim?.(accumulatedTranscriptRef.current + interimTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      const errorMessages: Record<string, string> = {
        'no-speech': 'No speech detected. Try again.',
        'audio-capture': 'No microphone found. Check your audio input.',
        'not-allowed': 'Microphone access denied.',
        'network': 'Network error. Check your connection.',
        'aborted': 'Speech recognition was aborted.',
      };
      const errMsg = errorMessages[event.error] || `Speech recognition error: ${event.error}`;
      setState(prev => ({ ...prev, error: errMsg, isListening: false }));
      onError?.(errMsg);
    };

    recognition.onend = () => {
      setState(prev => ({ ...prev, isListening: false }));
      onEnd?.();
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [language, continuous, onResult, onInterim, onStart, onEnd, onError]);

  /**
   * Stop listening and get the final transcript.
   */
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  /**
   * Toggle listening on/off.
   */
  const toggleListening = useCallback(async () => {
    if (state.isListening) {
      stopListening();
    } else {
      await startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  /**
   * Abort listening without returning results.
   */
  const abort = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    accumulatedTranscriptRef.current = '';
    setState(prev => ({
      ...prev,
      isListening: false,
      transcript: '',
      interimTranscript: '',
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    toggleListening,
    abort,
  };
}
