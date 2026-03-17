import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { createUserProfile, getUserProfile } from '../services/db';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserCircle, Briefcase, Mail, Lock, ArrowRight } from 'lucide-react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'candidate' | 'recruiter'>('candidate');
  const navigate = useNavigate();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let user;
      if (isSignUp) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        user = result.user;
        await createUserProfile({
          uid: user.uid,
          email: user.email!,
          displayName: email.split('@')[0],
          role: role,
        });
        navigate('/onboarding');
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        user = result.user;
        const profile = await getUserProfile(user.uid);
        if (!profile?.role) {
          navigate('/onboarding');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (selectedRole: 'candidate' | 'recruiter') => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const existingProfile = await getUserProfile(user.uid);
      if (!existingProfile || !existingProfile.role) {
        await createUserProfile({
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName || 'Anonymous',
          photoURL: user.photoURL || undefined,
          role: selectedRole,
        });
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-8 md:p-10 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-xl space-y-8"
      >
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
          <p className="text-slate-400">
            {isSignUp ? 'Join the smart internship revolution' : 'Sign in to your account to continue'}
          </p>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {isSignUp && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setRole('candidate')}
                className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                  role === 'candidate' ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                Candidate
              </button>
              <button
                type="button"
                onClick={() => setRole('recruiter')}
                className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                  role === 'recruiter' ? 'bg-cyan-500 border-cyan-500 text-slate-950' : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                Recruiter
              </button>
            </div>
          )}
          
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="email"
              required
              placeholder="Email Address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-emerald-500 outline-none transition-all"
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-emerald-500 outline-none transition-all"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" /> : (
              <>
                {isSignUp ? 'Sign Up' : 'Sign In'}
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#0f172a] px-2 text-slate-500">Or continue with</span>
          </div>
        </div>

        <div className="grid gap-4">
          <button
            onClick={() => handleGoogleLogin('candidate')}
            disabled={loading}
            className="flex items-center justify-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            <span className="text-sm font-medium">Google (Candidate)</span>
          </button>
          <button
            onClick={() => handleGoogleLogin('recruiter')}
            disabled={loading}
            className="flex items-center justify-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            <span className="text-sm font-medium">Google (Recruiter)</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
