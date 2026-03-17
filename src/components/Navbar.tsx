import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { UserProfile } from '../types';
import { 
  LayoutDashboard, 
  Code2, 
  Trophy, 
  Briefcase, 
  User, 
  LogOut,
  Zap
} from 'lucide-react';

interface NavbarProps {
  user: UserProfile | null;
}

export default function Navbar({ user }: NavbarProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
            <Zap className="text-slate-950 fill-slate-950" size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            InternSmart
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link to="/internships" className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
            <Briefcase size={18} />
            Internships
          </Link>
          <Link to="/challenges" className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
            <Code2 size={18} />
            Challenges
          </Link>
          <Link to="/leaderboard" className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
            <Trophy size={18} />
            Leaderboard
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                <LayoutDashboard size={20} />
              </Link>
              <Link to={`/profile/${user.uid}`} className="w-9 h-9 rounded-full overflow-hidden border border-white/10 hover:border-emerald-500/50 transition-colors">
                <img 
                  src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </Link>
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="px-5 py-2 bg-white text-slate-950 text-sm font-semibold rounded-full hover:bg-emerald-400 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
