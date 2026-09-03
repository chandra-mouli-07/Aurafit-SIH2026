import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Optional: uncomment if you add a reportWebVitals.js file
// import reportWebVitals from './reportWebVitals';

// Simple ErrorBoundary for global error handling (extract to its own file if preferred)
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    // Log to an error reporting service here
    // console.error('Uncaught error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" style={{ padding: 20 }}>
          <h1>Something went wrong.</h1>
          <p>Please refresh the page or contact support.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const container = document.getElementById('root');
if (!container) {
  // Fail fast so developers notice misconfigured HTML
  throw new Error("Root element '#root' not found. Make sure index.html contains <div id=\"root\"></div>.");
}

const app = (
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// If the HTML was server-rendered, hydrate; otherwise create a client root.
// This is safe for apps that may be server-side rendered later.
if (container.hasChildNodes()) {
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}

// Optional: measure performance — create reportWebVitals.js and uncomment the import above.
// reportWebVitals(console.log);

// HMR support for Vite (import.meta.hot) and webpack (module.hot)
if (typeof import.meta !== 'undefined' && import.meta.hot) {
  import.meta.hot.accept();
} else if (typeof module !== 'undefined' && module.hot) {
  module.hot.accept();
}
