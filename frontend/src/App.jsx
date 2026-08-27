import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import TierSelection from './pages/TierSelection/TierSelection.jsx';
import OrderSummary from './pages/OrderSummary/OrderSummary.jsx';
import Payment from './pages/Payment/Payment.jsx';
import Confirmation from './pages/Confirmation/Confirmation.jsx';
import OrganizerDashboard from './pages/OrganizerDashboard/OrganizerDashboard.jsx';
import VendorCatalog from './pages/VendorCatalog/VendorCatalog.jsx';
import Vote from './pages/Vote/Vote.jsx';
import EventCreation from './pages/EventCreation/EventCreation.jsx';
import Scan from './pages/Scan/Scan.jsx';
import NotFound from './pages/NotFound/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/events/demo/tiers" replace />} />
        <Route path="events">
          <Route path=":eventId/tiers" element={<TierSelection />} />
          <Route path=":eventId/commande/recap" element={<OrderSummary />} />
          <Route path=":eventId/commande/paiement" element={<Payment />} />
          <Route path=":eventId/billets/:billetId/confirmation" element={<Confirmation />} />
          <Route path=":eventId/organisateur" element={<OrganizerDashboard />} />
          <Route path=":eventId/vendeurs" element={<VendorCatalog />} />
          <Route path=":eventId/vote" element={<Vote />} />
          <Route path="nouveau" element={<EventCreation />} />
        </Route>
        <Route path="scan" element={<Scan />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
