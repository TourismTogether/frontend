"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { COLORS, GRADIENTS } from "../../constants/colors";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
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
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className={`min-h-screen ${COLORS.BACKGROUND.DEFAULT} flex items-center justify-center p-4`}
        >
          <div
            className={`max-w-2xl w-full ${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-xl shadow-lg p-8 text-center`}
          >
            <div
              className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 mb-6`}
            >
              <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>

            <h1
              className={`text-3xl font-bold ${COLORS.TEXT.DEFAULT} mb-4`}
            >
              Oops! Something went wrong
            </h1>

            <p className={`${COLORS.TEXT.MUTED} mb-6`}>
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>

            {this.state.error && (
              <details
                className={`mb-6 text-left ${COLORS.BACKGROUND.MUTED} rounded-lg p-4`}
              >
                <summary
                  className={`cursor-pointer font-semibold ${COLORS.TEXT.DEFAULT} mb-2`}
                >
                  Error Details
                </summary>
                <pre
                  className={`text-xs ${COLORS.TEXT.MUTED} overflow-auto max-h-40`}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className={`flex items-center justify-center gap-2 ${GRADIENTS.PRIMARY} text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity`}
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>

              <Link
                href="/dashboard"
                className={`flex items-center justify-center gap-2 ${COLORS.BACKGROUND.MUTED} ${COLORS.BORDER.DEFAULT} border ${COLORS.TEXT.DEFAULT} px-6 py-3 rounded-lg font-semibold hover:${COLORS.BACKGROUND.SECONDARY} transition-colors`}
              >
                <Home className="w-5 h-5" />
                Go Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
