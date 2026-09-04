import { Component, type ErrorInfo, type ReactNode } from 'react';

interface RuntimeErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface RuntimeErrorBoundaryState {
  failed: boolean;
}

export default class RuntimeErrorBoundary extends Component<RuntimeErrorBoundaryProps, RuntimeErrorBoundaryState> {
  state: RuntimeErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): RuntimeErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
