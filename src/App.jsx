// src/App.jsx
import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
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

const Nav = () => (
  <nav className="px-4 py-3 border-b bg-white sticky top-0 z-10 flex gap-4">
    <NavLink end to="/journees" className={({ isActive }) => (isActive ? "font-semibold" : "")}>
      Accueil
    </NavLink>
    <NavLink to="/standings" className={({ isActive }) => (isActive ? "font-semibold" : "")}>
      Classement
    </NavLink>
    <NavLink to="/top-scorers" className={({ isActive }) => (isActive ? "font-semibold" : "")}>
      Buteurs
    </NavLink>
    <NavLink to="/assists" className={({ isActive }) => (isActive ? "font-semibold" : "")}>
      Passeurs
    </NavLink>
    <NavLink to="/clubs" className={({ isActive }) => (isActive ? "font-semibold" : "")}>
      Clubs
    </NavLink>
  </nav>
);

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <main className="p-6 max-w-6xl mx-auto">
        <Routes>
          {/* Accueil -> /journees */}
          <Route path="/" element={<Navigate to="/journees" replace />} />

          {/* Pages */}
          <Route path="/journees" element={<Home />} />
          <Route path="/standings" element={<Standings />} />
          <Route path="/top-scorers" element={<TopScorers />} />
          <Route path="/assists" element={<AssistsLeaders />} />
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
    </BrowserRouter>
  );
}
