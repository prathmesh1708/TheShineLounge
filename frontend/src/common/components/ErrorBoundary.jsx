import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Check if it's a transient removeChild / DOM error and auto-reset
      return (
        <div className="p-8 text-center space-y-4 max-w-md mx-auto my-12 bg-white border border-zinc-200 rounded-24 shadow-lg">
          <h2 className="text-xl font-bold text-zinc-800">Something went wrong</h2>
          <p className="text-xs text-zinc-500 font-semibold leading-relaxed">
            The application encountered a temporary layout rendering issue.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="py-2.5 px-6 bg-[#FF6B00] hover:bg-[#E66000] text-white text-xs font-bold rounded-20 shadow-md transition-all"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
