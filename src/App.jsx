// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Standings from "./pages/Standings.jsx";
import TopScorers from "./pages/TopScorers.jsx";
import MatchDetail from "./pages/MatchDetail.jsx";
import MatchEventsEditor from "./pages/MatchEventsEditor.jsx";
import Home from "./pages/Home.jsx";
import Clubs from "./pages/Clubs.jsx";
import ClubDetail from "./pages/ClubDetail.jsx";
import AssistsLeaders from "./pages/AssistsLeaders.jsx";
import { ClubSheetHost } from "./components/ClubSheet";
import { StaffSheetHost } from "./components/StaffSheet";
import BottomNav from "./components/layout/BottomNav.jsx"; // Navigation bas uniquement

export default function App() {
  return (
    <BrowserRouter>
      <main className="px-4 sm:px-6 md:px-8 py-4 max-w-6xl mx-auto pb-28">
        <Routes>
          {/* Redirection par défaut vers la page des matchs */}
          <Route path="/" element={<Navigate to="/journees" replace />} />

          {/* Pages principales */}
          <Route path="/journees" element={<Home />} />
          <Route path="/classement" element={<Standings />} />
          <Route path="/buteurs" element={<TopScorers />} />
          <Route path="/passeurs" element={<AssistsLeaders />} />
          <Route path="/clubs" element={<Clubs />} />
          <Route path="/clubs/:id" element={<ClubDetail />} />
          <Route path="/match/:id" element={<MatchDetail />} />

          {/* Admin */}
          <Route path="/admin/match/:id/events" element={<MatchEventsEditor />} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/journees" replace />} />
        </Routes>
      </main>

      {/* Hôtes globaux */}
      <ClubSheetHost />
      <StaffSheetHost />

      {/* Barre de navigation du bas */}
      <BottomNav />
    </BrowserRouter>
  );
}
