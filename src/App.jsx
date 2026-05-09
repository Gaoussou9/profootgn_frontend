import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";

import Home from "./pages/Home";
import Standings from "./pages/Standings";
import TopScorers from "./pages/TopScorers";
import AssistsLeaders from "./pages/AssistsLeaders";
import Clubs from "./pages/Clubs";
import ClubDetail from "./pages/ClubDetail";
import ClubPage from "./pages/ClubPage";
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
import CompetitionMatchDetail from "./pages/CompetitionMatchDetail";
import CompetitionPlayerDetail from "./pages/CompetitionPlayerDetail";

import { LiveProvider } from "./context/LiveContext";
import CompetitionMatchLineups from "./pages/CompetitionMatchLineups";

function Layout() {
  const location = useLocation();
  const isCompetitionPage = location.pathname.startsWith("/competitions/");

  return (
    <>
      <main className="px-4 py-4 max-w-6xl mx-auto pb-28">
        <Outlet /> {/* 🔥 IMPORTANT */}
      </main>

      <ClubSheetHost />
      <StaffSheetHost />

      {!isCompetitionPage && <BottomNav />}
      {isCompetitionPage && <CompetitionNav />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LiveProvider>
        <Routes>

          <Route element={<Layout />}>

            {/* GLOBAL */}
            <Route path="/" element={<Home />} />
            <Route path="/journees" element={<Home />} />
            <Route path="/classement" element={<Standings />} />
            <Route path="/buteurs" element={<TopScorers />} />
            <Route path="/passeurs" element={<AssistsLeaders />} />
            <Route path="/clubs" element={<Clubs />} />
            <Route path="/clubs/:id" element={<ClubDetail />} />
            <Route path="/match/:id" element={<MatchDetail />} />

            {/* COMPÉTITIONS */}
            <Route path="/competitions" element={<CompetitionsList />} />

            <Route path="/competitions/:competitionId/match/:matchId" element={<CompetitionMatchDetail />} />
            <Route path="/competitions/:competitionId/clubs/:clubId" element={<ClubPage />} />
            <Route path="/competitions/:competitionId/classement" element={<CompetitionStandings />} />
            <Route path="/competitions/:competitionId/buteurs" element={<CompetitionScorers />} />
            <Route path="/competitions/:competitionId/clubs" element={<CompetitionClubs />} />
            <Route path="/competitions/:competitionId/clubs/:clubId/players/:playerId" element={<CompetitionPlayerDetail />} />
            <Route path="/competitions/:competitionId" element={<CompetitionPage />} />
            <Route
  path="/competitions/:competitionId/matches/:matchId/lineups"
  element={<CompetitionMatchLineups />}
/>

            {/* 404 */}
            <Route path="*" element={<Navigate to="/journees" replace />} />

          </Route>

        </Routes>
      </LiveProvider>
    </BrowserRouter>
  );
}