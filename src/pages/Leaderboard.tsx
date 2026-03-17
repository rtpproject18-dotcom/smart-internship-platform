import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserProfile } from '../types';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Trophy, Medal, Crown, User, ArrowUpRight, Search, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

import { handleFirestoreError, OperationType } from '../services/db';

export default function Leaderboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'users'), 
      orderBy('codingScore', 'desc'),
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });
    return unsubscribe;
  }, []);

  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-bold">
          <Trophy size={16} />
          <span>Global Rankings</span>
        </div>
        <h1 className="text-5xl font-bold tracking-tight">Top Coders</h1>
        <p className="text-slate-400 text-lg">The most talented candidates on the platform, ranked by skill.</p>
      </header>

      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
        <input 
          type="text"
          placeholder="Search coders..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-emerald-500 outline-none transition-all"
        />
      </div>

      <div className="space-y-4">
        {filteredUsers.map((user, i) => (
          <Link
            key={user.uid}
            to={`/profile/${user.uid}`}
            className="block"
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-6 rounded-3xl border flex items-center justify-between group transition-all ${
                i === 0 ? 'bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/30' :
                i === 1 ? 'bg-gradient-to-r from-slate-300/10 to-transparent border-slate-300/30' :
                i === 2 ? 'bg-gradient-to-r from-orange-500/10 to-transparent border-orange-500/30' :
                'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-6">
                <div className="w-10 text-center font-mono text-xl font-bold text-slate-500">
                  {i === 0 ? <Crown className="text-amber-500 mx-auto" /> : 
                   i === 1 ? <Medal className="text-slate-300 mx-auto" /> :
                   i === 2 ? <Medal className="text-orange-500 mx-auto" /> :
                   `#${i + 1}`}
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10">
                    <img 
                      src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                      alt={user.displayName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <div className="font-bold text-lg group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                      {user.displayName}
                      <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex gap-2">
                      {user.skills?.slice(0, 3).map(skill => (
                        <span key={skill} className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{skill}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-12">
                <div className="text-center hidden md:block">
                  <div className="text-lg font-bold text-slate-300">{user.challengesSolved || 0}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Solved</div>
                </div>
                <div className="text-right min-w-[100px]">
                  <div className="flex items-center justify-end gap-1 text-emerald-400 text-[10px] font-bold mb-1">
                    <Zap size={10} fill="currentColor" />
                    +{Math.floor(Math.random() * 50) + 10}
                  </div>
                  <div className="text-2xl font-bold text-white">{user.codingScore}</div>
                  <div className="text-xs text-slate-500 uppercase font-bold tracking-widest">Score</div>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
