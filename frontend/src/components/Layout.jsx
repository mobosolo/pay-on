import { Outlet, Link } from 'react-router-dom';
import './Layout.css';

export default function Layout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="app-brand">PAY-ON</Link>
        <nav className="app-nav">
          <Link to="/events/demo/tiers">Billetterie</Link>
          <Link to="/events/demo/vendeurs">Vendeurs</Link>
          <Link to="/events/demo/organisateur">Organisateur</Link>
          <Link to="/events/nouveau">Créer event</Link>
          <Link to="/scan">Scan</Link>
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <footer className="app-footer">
        <small>PAY-ON — squelette front-end</small>
      </footer>
    </div>
  );
}
