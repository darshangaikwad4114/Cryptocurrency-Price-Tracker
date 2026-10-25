import { Component } from 'react';
import Icon from '../ui/Icon';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error', error, info?.componentStack);
  }

  handleReset() {
    this.setState({ error: null });
    window.location.assign('/');
  }

  render() {
    if (this.state.error) {
      return (
        <div className="route-error container" role="alert">
          <span className="route-error__icon">
            <Icon name="alert" size={28} />
          </span>
          <h1>Something went wrong</h1>
          <p>The page hit an unexpected error. Your saved watchlist and portfolio are untouched.</p>
          <div className="route-error__actions">
            <button type="button" className="button button--primary" onClick={this.handleReset}>
              Reload dashboard
            </button>
            <button type="button" className="button button--ghost" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
