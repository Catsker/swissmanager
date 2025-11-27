import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from "./pages/HomePage";
import TournamentPage from "./pages/TournamentPage";
import Header from "@/components/Header";
import NotFoundPage from "@/pages/NotFoundPage"
import './app.scss'

function App() {
  return (
    <Router>
      <div className="app">
        <Header/>
        <main className="main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/tournament/:tournamentId" element={<TournamentPage role="spectator"/>} />
            <Route path="/tournament/:tournamentId/edit" element={<TournamentPage role="editor"/>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App