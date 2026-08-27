import { Outlet, Link, NavLink } from "react-router-dom";
import { DEMO_EVENT_ID } from "../api/demo.js";
import "./Layout.css";

export default function Layout() {
  const navigationLink = ({ isActive }) =>
    `app-nav-link${isActive ? " is-active" : ""}`;

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="app-brand">
          PAY-ON
        </Link>
        <nav className="app-nav" aria-label="Navigation principale">
          {DEMO_EVENT_ID && (
            <>
              <NavLink
                className={navigationLink}
                to={`/events/${DEMO_EVENT_ID}/tiers`}
              >
                Billetterie
              </NavLink>
              <NavLink
                className={navigationLink}
                to={`/events/${DEMO_EVENT_ID}/vendeurs`}
              >
                Boutique
              </NavLink>
              <NavLink
                className={navigationLink}
                to={`/events/${DEMO_EVENT_ID}/organisateur`}
              >
                Dashboard
              </NavLink>
            </>
          )}
          <NavLink className={navigationLink} to="/events/nouveau">
            Créer un événement
          </NavLink>
          <NavLink className={navigationLink} to="/scan">
            Contrôle d'accès
          </NavLink>
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <footer className="app-footer">
        <small>PAY-ON · Billetterie et accès événementiels</small>
      </footer>
    </div>
  );
}
