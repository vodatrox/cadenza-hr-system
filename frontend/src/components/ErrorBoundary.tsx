'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);

    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-4xl w-full">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0">
                <svg
                  className="w-12 h-12 text-red-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-red-600 mb-2">
                  Application Error Detected
                </h1>
                <p className="text-gray-600 mb-4">
                  The application encountered an error. See details below:
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Error Message */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Error Message:
                </h2>
                <div className="bg-red-100 border border-red-300 rounded p-4">
                  <code className="text-red-800 text-sm break-words">
                    {this.state.error?.toString()}
                  </code>
                </div>
              </div>

              {/* Error Stack */}
              {this.state.error?.stack && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Stack Trace:
                  </h2>
                  <div className="bg-gray-100 border border-gray-300 rounded p-4 max-h-64 overflow-auto">
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono">
                      {this.state.error.stack}
                    </pre>
                  </div>
                </div>
              )}

              {/* Component Stack */}
              {this.state.errorInfo?.componentStack && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Component Stack:
                  </h2>
                  <div className="bg-gray-100 border border-gray-300 rounded p-4 max-h-64 overflow-auto">
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Reload Page
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                >
                  Go Home
                </button>
                <button
                  onClick={() => {
                    console.log('Error Details:', {
                      error: this.state.error,
                      errorInfo: this.state.errorInfo,
                    });
                    alert('Error details logged to console');
                  }}
                  className="px-6 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
                >
                  Log to Console
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
