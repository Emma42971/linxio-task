import { useState, useCallback, useRef, useEffect } from 'react';

export interface AIStreamOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: string) => void;
  apiEndpoint?: string;
  headers?: Record<string, string>;
}

export interface AIStreamState {
  text: string;
  isStreaming: boolean;
  error: string | null;
  isComplete: boolean;
}

/**
 * useAIStream Hook
 * 
 * Hook React pour gérer le streaming de réponses AI via Server-Sent Events (SSE).
 * Utilise EventSource pour recevoir les chunks de manière progressive.
 * 
 * @example
 * ```tsx
 * const { text, isStreaming, error, startStream, stopStream } = useAIStream({
 *   onChunk: (chunk) => console.log('Received chunk:', chunk),
 *   onComplete: (fullText) => console.log('Complete:', fullText),
 *   onError: (error) => console.error('Error:', error),
 * });
 * 
 * // Start streaming
 * startStream({
 *   message: 'Hello, AI!',
 *   history: [],
 * });
 * ```
 */
export function useAIStream(options: AIStreamOptions = {}) {
  const [state, setState] = useState<AIStreamState>({
    text: '',
    isStreaming: false,
    error: null,
    isComplete: false,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fullTextRef = useRef<string>('');

  /**
   * Start streaming AI response
   */
  const startStream = useCallback(
    async (request: {
      message: string;
      history?: Array<{ role: string; content: string }>;
      sessionId?: string;
      workspaceId?: string;
      projectId?: string;
      currentOrganizationId?: string;
    }) => {
      // Reset state
      setState({
        text: '',
        isStreaming: true,
        error: null,
        isComplete: false,
      });
      fullTextRef.current = '';

      // Stop any existing stream
      stopStream();

      try {
        const apiEndpoint =
          options.apiEndpoint || process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
        const baseUrl = apiEndpoint.replace(/\/$/, '');
        const streamUrl = `${baseUrl}/ai-chat/stream`;

        // Get auth token from localStorage or cookies
        const token = localStorage.getItem('token') || getCookie('token');

        // Create abort controller for manual cancellation
        abortControllerRef.current = new AbortController();

        // Use fetch with ReadableStream for SSE
        const response = await fetch(streamUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
          },
          body: JSON.stringify(request),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
          throw new Error('Response body is null');
        }

        // Read the stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              break;
            }

            // Decode chunk
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            // Process each line
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.error) {
                    setState((prev) => ({
                      ...prev,
                      error: data.error,
                      isStreaming: false,
                      isComplete: true,
                    }));
                    options.onError?.(data.error);
                    return;
                  }

                  if (data.done) {
                    setState((prev) => ({
                      ...prev,
                      isStreaming: false,
                      isComplete: true,
                    }));
                    options.onComplete?.(fullTextRef.current);
                    return;
                  }

                  if (data.content) {
                    fullTextRef.current += data.content;
                    setState((prev) => ({
                      ...prev,
                      text: fullTextRef.current,
                    }));
                    options.onChunk?.(data.content);
                  }
                } catch (parseError) {
                  console.warn('Failed to parse SSE data:', line, parseError);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isStreaming: false,
          isComplete: true,
        }));
        options.onError?.(errorMessage);
      }
    },
    [options],
  );

  /**
   * Stop streaming
   */
  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isStreaming: false,
    }));
  }, []);

  /**
   * Reset stream state
   */
  const reset = useCallback(() => {
    stopStream();
    setState({
      text: '',
      isStreaming: false,
      error: null,
      isComplete: false,
    });
    fullTextRef.current = '';
  }, [stopStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return {
    ...state,
    startStream,
    stopStream,
    reset,
  };
}

/**
 * Alternative implementation using EventSource (simpler but less flexible)
 * 
 * Note: EventSource doesn't support POST requests natively,
 * so this is a fallback for GET endpoints or when using a proxy.
 */
export function useAIStreamEventSource(options: AIStreamOptions = {}) {
  const [state, setState] = useState<AIStreamState>({
    text: '',
    isStreaming: false,
    error: null,
    isComplete: false,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const fullTextRef = useRef<string>('');

  const startStream = useCallback(
    (request: {
      message: string;
      history?: Array<{ role: string; content: string }>;
      sessionId?: string;
    }) => {
      // Reset state
      setState({
        text: '',
        isStreaming: true,
        error: null,
        isComplete: false,
      });
      fullTextRef.current = '';

      // Stop any existing stream
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const apiEndpoint =
        options.apiEndpoint || process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
      const baseUrl = apiEndpoint.replace(/\/$/, '');

      // Note: EventSource only supports GET, so you'd need a proxy or different endpoint
      // This is a placeholder for when you have a GET-based SSE endpoint
      const streamUrl = `${baseUrl}/ai-chat/stream-sse?message=${encodeURIComponent(request.message)}`;

      const eventSource = new EventSource(streamUrl);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.error) {
            setState((prev) => ({
              ...prev,
              error: data.error,
              isStreaming: false,
              isComplete: true,
            }));
            options.onError?.(data.error);
            eventSource.close();
            return;
          }

          if (data.done) {
            setState((prev) => ({
              ...prev,
              isStreaming: false,
              isComplete: true,
            }));
            options.onComplete?.(fullTextRef.current);
            eventSource.close();
            return;
          }

          if (data.content) {
            fullTextRef.current += data.content;
            setState((prev) => ({
              ...prev,
              text: fullTextRef.current,
            }));
            options.onChunk?.(data.content);
          }
        } catch (parseError) {
          console.warn('Failed to parse SSE data:', event.data, parseError);
        }
      };

      eventSource.onerror = (error) => {
        setState((prev) => ({
          ...prev,
          error: 'Connection error',
          isStreaming: false,
          isComplete: true,
        }));
        options.onError?.('Connection error');
        eventSource.close();
      };
    },
    [options],
  );

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isStreaming: false,
    }));
  }, []);

  const reset = useCallback(() => {
    stopStream();
    setState({
      text: '',
      isStreaming: false,
      error: null,
      isComplete: false,
    });
    fullTextRef.current = '';
  }, [stopStream]);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return {
    ...state,
    startStream,
    stopStream,
    reset,
  };
}

/**
 * Helper function to get cookie value
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}


