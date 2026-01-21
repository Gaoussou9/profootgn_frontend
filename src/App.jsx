import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import Home from "./pages/Home";
import Standings from "./pages/Standings";
import TopScorers from "./pages/TopScorers";
import AssistsLeaders from "./pages/AssistsLeaders";
import Clubs from "./pages/Clubs";
import ClubDetail from "./pages/ClubDetail";   // club global
import ClubPage from "./pages/ClubPage";       // club par compétition
import MatchDetail from "./pages/MatchDetail";
import CompetitionPage from "./pages/CompetitionPage";
import CompetitionsList from "./pages/CompetitionsList";

import BottomNav from "./components/layout/BottomNav";
import CompetitionNav from "./components/layout/CompetitionNav";
import { ClubSheetHost } from "./components/ClubSheet";
import { StaffSheetHost } from "./components/StaffSheet";

import CompetitionStandings from "./pages/CompetitionStandings";
import CompetitionScorers from "./pages/CompetitionScorers";
import CompetitionClubs from "./pages/CompetitionClubs";

function Layout() {
  const location = useLocation();

  // 👉 détecte si on est dans une compétition
  const isCompetitionPage = location.pathname.startsWith("/competitions/");

  return (
    <>
      <main className="px-4 sm:px-6 md:px-8 py-4 max-w-6xl mx-auto pb-28">
        <Routes>
          {/* Redirect racine */}
          <Route path="/" element={<Navigate to="/journees" replace />} />

          {/* ===== GLOBAL ===== */}
          <Route path="/journees" element={<Home />} />
          <Route path="/classement" element={<Standings />} />
          <Route path="/buteurs" element={<TopScorers />} />
          <Route path="/passeurs" element={<AssistsLeaders />} />
          <Route path="/clubs" element={<Clubs />} />
          <Route path="/clubs/:id" element={<ClubDetail />} />
          <Route path="/match/:id" element={<MatchDetail />} />

          {/* ===== COMPÉTITIONS ===== */}
          <Route path="/competitions" element={<CompetitionsList />} />
          <Route path="/competitions/:id" element={<CompetitionPage />} />
          <Route path="/competitions/:id/classement" element={<CompetitionStandings />} />
          <Route path="/competitions/:id/buteurs" element={<CompetitionScorers />} />
          <Route path="/competitions/:id/clubs" element={<CompetitionClubs />} />

          {/* ===== CLUB DANS UNE COMPÉTITION ===== */}
          <Route
            path="/competitions/:competitionId/clubs/:clubId"
            element={<ClubPage />}
          />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/journees" replace />} />
        </Routes>
      </main>

      {/* Hosts globaux */}
      <ClubSheetHost />
      <StaffSheetHost />

      {/* Navigation */}
      {!isCompetitionPage && <BottomNav />}
      {isCompetitionPage && <CompetitionNav />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
