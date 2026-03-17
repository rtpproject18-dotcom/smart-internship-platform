import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { getUserProfile, seedInitialData } from './services/db';
import { UserProfile } from './types';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import CodingChallenges from './pages/CodingChallenges';
import Leaderboard from './pages/Leaderboard';
import Internships from './pages/Internships';
import Onboarding from './pages/Onboarding';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seedInitialData();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30">
        <Navbar user={user} />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
            <Route path="/onboarding" element={user ? <Onboarding user={user} setUser={setUser} /> : <Navigate to="/login" />} />
            <Route path="/dashboard" element={user ? (user.role ? <Dashboard user={user} /> : <Navigate to="/onboarding" />) : <Navigate to="/login" />} />
            <Route path="/profile/:uid" element={<Profile currentUser={user} />} />
            <Route path="/challenges" element={<CodingChallenges user={user} />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/internships" element={<Internships user={user} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
