import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserProfile, Internship, Application } from '../types';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Plus, 
  Users, 
  Briefcase, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ExternalLink,
  Search,
  Hash,
  Sparkles,
  Code2,
  Trophy,
  User,
  ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { postInternship, updateApplicationStatus, handleFirestoreError, OperationType } from '../services/db';

interface DashboardProps {
  user: UserProfile;
}

export default function Dashboard({ user }: DashboardProps) {
  if (user.role === 'recruiter') {
    return <RecruiterDashboard user={user} />;
  }
  return <CandidateDashboard user={user} />;
}

function CandidateDashboard({ user }: DashboardProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [recommendedInternships, setRecommendedInternships] = useState<Internship[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'applications'), where('candidateId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Application)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'applications');
    });
    return unsubscribe;
  }, [user.uid]);

  useEffect(() => {
    // Simple recommendation based on first domain interest
    if (user.domainInterests && user.domainInterests.length > 0) {
      const q = query(
        collection(db, 'internships'), 
        where('hashtags', 'array-contains', user.domainInterests[0].replace(' ', ''))
      );
      getDocs(q).then(snap => {
        setRecommendedInternships(snap.docs.map(d => ({ id: d.id, ...d.data() } as Internship)));
      });
    }
  }, [user.domainInterests]);

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user.displayName}!</h1>
          <p className="text-slate-400">Track your applications and discover new opportunities.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/profile" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all font-bold flex items-center gap-2">
            <User size={18} />
            My Profile
          </Link>
          <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
            {user.points} Points
          </div>
          <div className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold">
            Score: {user.codingScore}
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Clock className="text-emerald-400" size={20} />
                Applied Internships
              </h2>
              <Link to="/internships" className="text-sm text-emerald-400 font-bold hover:underline">Browse More</Link>
            </div>
            <div className="grid gap-4">
              {applications.length > 0 ? applications.map(app => (
                <div key={app.id} className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group hover:border-white/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <Briefcase size={24} />
                    </div>
                    <div>
                      <div className="font-bold">{app.internshipTitle || `Application #${app.id.slice(0, 6)}`}</div>
                      <div className="text-sm text-slate-400">{app.companyName || 'Company'} • Applied on {new Date(app.appliedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    app.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    app.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {app.status}
                  </div>
                </div>
              )) : (
                <div className="p-12 rounded-3xl border border-dashed border-white/10 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-slate-500">
                    <Briefcase size={32} />
                  </div>
                  <p className="text-slate-500">No applications yet. Start applying to internships!</p>
                  <Link to="/internships" className="inline-block px-6 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 transition-all">
                    Find Internships
                  </Link>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="text-cyan-400" size={20} />
              Recommended for You
            </h2>
            <div className="grid gap-4">
              {recommendedInternships.map(internship => (
                <Link 
                  key={internship.id} 
                  to="/internships" 
                  className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all block"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{internship.title}</h3>
                    <span className="text-emerald-400 font-bold">{internship.stipend}</span>
                  </div>
                  <p className="text-sm text-slate-400 mb-4">{internship.companyName} • {internship.duration}</p>
                  <div className="flex flex-wrap gap-2">
                    {internship.hashtags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-1 rounded-md bg-white/5 text-slate-400">#{tag}</span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="p-8 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
            <h3 className="text-lg font-bold mb-4">Profile Strength</h3>
            <div className="space-y-4">
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${user.atsScore || 0}%` }} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">ATS Score</span>
                <span className="text-emerald-400 font-bold">{user.atsScore || 0}%</span>
              </div>
              <Link to={`/profile/${user.uid}`} className="block w-full py-3 text-center bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition-all">
                Improve Profile
              </Link>
            </div>
          </section>

          <section className="p-8 rounded-3xl bg-white/5 border border-white/10">
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <div className="grid gap-3">
              <Link to="/challenges" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Code2 size={20} />
                </div>
                <span className="font-medium">Solve Challenges</span>
              </Link>
              <Link to="/leaderboard" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Trophy size={20} />
                </div>
                <span className="font-medium">Leaderboard</span>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function RecruiterDashboard({ user }: DashboardProps) {
  const [myInternships, setMyInternships] = useState<Internship[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [newInternship, setNewInternship] = useState({
    title: '',
    description: '',
    duration: '',
    stipend: '',
    requiredSkills: '',
    hashtags: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'internships'), where('recruiterId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      setMyInternships(snap.docs.map(d => ({ id: d.id, ...d.data() } as Internship)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'internships');
    });
    return unsubscribe;
  }, [user.uid]);

  useEffect(() => {
    const q = query(collection(db, 'applications'), where('recruiterId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Application)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'applications');
    });
    return unsubscribe;
  }, [user.uid]);

  const handlePostInternship = async (e: React.FormEvent) => {
    e.preventDefault();
    await postInternship({
      recruiterId: user.uid,
      companyName: user.displayName,
      title: newInternship.title,
      description: newInternship.description,
      duration: newInternship.duration,
      stipend: newInternship.stipend,
      requiredSkills: newInternship.requiredSkills.split(',').map(s => s.trim()),
      hashtags: newInternship.hashtags.split(',').map(s => s.trim().replace('#', ''))
    });
    setIsPosting(false);
    setNewInternship({ title: '', description: '', duration: '', stipend: '', requiredSkills: '', hashtags: '' });
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Recruiter Dashboard</h1>
          <p className="text-slate-400">Manage your listings and review candidates.</p>
        </div>
        <button 
          onClick={() => setIsPosting(true)}
          className="px-6 py-3 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          Post Internship
        </button>
      </header>

      {isPosting && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-3xl bg-white/5 border border-white/10"
        >
          <form onSubmit={handlePostInternship} className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <input 
                required
                placeholder="Internship Title"
                value={newInternship.title}
                onChange={e => setNewInternship({...newInternship, title: e.target.value})}
                className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:border-emerald-500 outline-none"
              />
              <textarea 
                required
                placeholder="Description"
                value={newInternship.description}
                onChange={e => setNewInternship({...newInternship, description: e.target.value})}
                className="w-full h-32 p-4 rounded-xl bg-white/5 border border-white/10 focus:border-emerald-500 outline-none resize-none"
              />
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input 
                  placeholder="Duration (e.g. 3 Months)"
                  value={newInternship.duration}
                  onChange={e => setNewInternship({...newInternship, duration: e.target.value})}
                  className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:border-emerald-500 outline-none"
                />
                <input 
                  placeholder="Stipend (e.g. $500/mo)"
                  value={newInternship.stipend}
                  onChange={e => setNewInternship({...newInternship, stipend: e.target.value})}
                  className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:border-emerald-500 outline-none"
                />
              </div>
              <input 
                placeholder="Required Skills (comma separated)"
                value={newInternship.requiredSkills}
                onChange={e => setNewInternship({...newInternship, requiredSkills: e.target.value})}
                className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:border-emerald-500 outline-none"
              />
              <input 
                placeholder="Hashtags (comma separated)"
                value={newInternship.hashtags}
                onChange={e => setNewInternship({...newInternship, hashtags: e.target.value})}
                className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:border-emerald-500 outline-none"
              />
              <div className="flex gap-4">
                <button type="submit" className="flex-1 py-4 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 transition-all">
                  Publish Listing
                </button>
                <button type="button" onClick={() => setIsPosting(false)} className="px-6 py-4 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="text-emerald-400" size={20} />
              Candidate Applications
            </h2>
            <div className="grid gap-4">
              {applications.map(app => (
                <div key={app.id} className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${app.candidateId}`} alt="Avatar" />
                    </div>
                    <div>
                      <Link to={`/profile/${app.candidateId}`} className="font-bold hover:text-emerald-400 transition-colors flex items-center gap-1">
                        View Candidate Profile
                        <ExternalLink size={14} />
                      </Link>
                      <div className="text-sm text-slate-400">Applied for: {myInternships.find(i => i.id === app.internshipId)?.title}</div>
                    </div>
                  </div>
                  {app.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => updateApplicationStatus(app.id, 'accepted')}
                        className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-all"
                      >
                        <CheckCircle2 size={20} />
                      </button>
                      <button 
                        onClick={() => updateApplicationStatus(app.id, 'rejected')}
                        className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                      >
                        <XCircle size={20} />
                      </button>
                    </div>
                  ) : (
                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      app.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {app.status}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="p-8 rounded-3xl bg-white/5 border border-white/10">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Briefcase className="text-cyan-400" size={20} />
              Active Listings
            </h3>
            <div className="grid gap-4">
              {myInternships.map(internship => (
                <div key={internship.id} className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="font-bold">{internship.title}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {applications.filter(a => a.internshipId === internship.id).length} Applicants
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
