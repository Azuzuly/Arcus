'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    // Log to console in dev, could be sent to a reporting service in prod
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>;

      return (
        <div style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#05060c',
          zIndex: 9999,
          padding: '24px',
          fontFamily: "var(--font-geist, 'Geist'), -apple-system, sans-serif",
        }}>
          {/* Ambient glow */}
          <div style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '300px',
            background: 'radial-gradient(ellipse, rgba(239, 68, 68, 0.08) 0%, transparent 70%)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }} />

          <div style={{
            maxWidth: '520px',
            width: '100%',
            background: 'rgba(14, 16, 24, 0.82)',
            backdropFilter: 'blur(32px) saturate(180%)',
            WebkitBackdropFilter: 'blur(32px) saturate(180%)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '28px',
            padding: '40px',
            boxShadow: '0 32px 96px rgba(0,0,0,0.7), 0 0 60px rgba(239,68,68,0.06)',
            animation: 'modalIn 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
            position: 'relative',
          }}>
            {/* Icon */}
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              fontSize: '24px',
            }}>
              ⚡
            </div>

            <h2 style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#F4F4F5',
              marginBottom: '8px',
              letterSpacing: '-0.02em',
            }}>
              Something went wrong
            </h2>

            <p style={{
              fontSize: '14px',
              color: '#A1A1AA',
              lineHeight: 1.6,
              marginBottom: '24px',
            }}>
              Arcus hit an unexpected error. Your conversations are safe — this component failed to render.
            </p>

            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <details style={{ marginBottom: '24px' }}>
                <summary style={{
                  fontSize: '12px',
                  color: '#52525B',
                  cursor: 'pointer',
                  userSelect: 'none',
                  marginBottom: '8px',
                }}>
                  Error details
                </summary>
                <div style={{
                  background: 'rgba(239, 68, 68, 0.06)',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  borderRadius: '10px',
                  padding: '12px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: '#FDA4AF',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {this.state.error.message}
                </div>
              </details>
            )}

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '10px 24px',
                  background: '#3B82F6',
                  border: 'none',
                  borderRadius: '999px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 120ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(59,130,246,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 24px',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '999px',
                  color: '#A1A1AA',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 120ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.11)'; e.currentTarget.style.color = '#F4F4F5'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#A1A1AA'; }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Lightweight inline error display for non-critical component failures.
 */
export function InlineError({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '12px 16px',
      background: 'rgba(239, 68, 68, 0.08)',
      border: '1px solid rgba(239, 68, 68, 0.2)',
      borderRadius: '12px',
      fontSize: '13px',
      color: '#FCA5A5',
    }}>
      <span>⚠</span>
      <span style={{ flex: 1 }}>{message || 'An error occurred.'}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '8px',
            padding: '4px 10px',
            color: '#FCA5A5',
            fontSize: '12px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}

export default ErrorBoundary;
