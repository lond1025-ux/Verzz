import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import React from 'react'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: '#ff6b6b', background: '#111', minHeight: '100vh', fontFamily: 'monospace', fontSize: '14px', zIndex: 9999, position: 'relative' }}>
          <h2 style={{ color: 'white', marginBottom: '10px' }}>App Crashed!</h2>
          <div style={{ marginBottom: '20px', background: '#000', padding: '15px', borderRadius: '8px' }}>
            <strong>{this.state.error && this.state.error.toString()}</strong>
          </div>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#aaa' }}>
            {this.state.error && this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children; 
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
