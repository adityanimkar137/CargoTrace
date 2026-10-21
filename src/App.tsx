/**
 * CargoTrace Root Frontend Wrapper
 * Re-exports the client/src/App component for the root preview container.
 */
import ClientApp from '../client/src/App.jsx';

export default function App() {
  return <ClientApp />;
}
