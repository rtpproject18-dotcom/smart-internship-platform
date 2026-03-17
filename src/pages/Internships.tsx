import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserProfile, Internship } from '../types';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { applyForInternship, handleFirestoreError, OperationType } from '../services/db';
import { 
  Search, 
  Hash, 
  MapPin, 
  Clock, 
  DollarSign, 
  Briefcase,
  Filter,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

interface InternshipsProps {
  user: UserProfile | null;
}

export default function Internships({ user }: InternshipsProps) {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const q = query(collection(db, 'internships'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setInternships(snap.docs.map(d => ({ id: d.id, ...d.data() } as Internship)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'internships');
    });
    return unsubscribe;
  }, []);

  const handleApply = async (internship: Internship) => {
    if (!user || user.role !== 'candidate') return;
    setApplyingId(internship.id);
    try {
      await applyForInternship({
        internshipId: internship.id,
        candidateId: user.uid,
        recruiterId: internship.recruiterId,
        companyName: internship.companyName,
        internshipTitle: internship.title
      });
      setAppliedIds(prev => new Set(prev).add(internship.id));
    } catch (error) {
      console.error('Application failed:', error);
    } finally {
      setApplyingId(null);
    }
  };

  const filteredInternships = internships.filter(i => {
    const matchesSearch = i.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          i.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || i.hashtags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const allTags = Array.from(new Set(internships.flatMap(i => i.hashtags)));

  return (
    <div className="space-y-10">
      <header className="space-y-6">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold mb-2">Discover Opportunities</h1>
          <p className="text-slate-400 text-lg">Find the perfect internship to kickstart your career.</p>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input 
              type="text"
              placeholder="Search by role, company, or skills..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-emerald-500 outline-none transition-all"
            />
          </div>
          <button className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2 hover:bg-white/10 transition-all">
            <Filter size={20} />
            Filters
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setSelectedTag(null)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              !selectedTag ? 'bg-emerald-500 text-slate-950' : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            All
          </button>
          {allTags.map(tag => (
            <button 
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1 ${
                selectedTag === tag ? 'bg-emerald-500 text-slate-950' : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              <Hash size={14} />
              {tag}
            </button>
          ))}
        </div>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        {filteredInternships.map((internship, i) => (
          <motion.div
            key={internship.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-8 rounded-[32px] bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors" />
            
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <h3 className="text-xl font-bold group-hover:text-emerald-400 transition-colors">{internship.title}</h3>
                <p className="text-slate-400 font-medium">{internship.companyName}</p>
              </div>
              <div className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-bold">
                {internship.stipend}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock size={16} />
                {internship.duration}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Briefcase size={16} />
                Internship
              </div>
            </div>

            <p className="text-slate-400 text-sm line-clamp-2 mb-6 leading-relaxed">
              {internship.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-8">
              {internship.requiredSkills.map(skill => (
                <span key={skill} className="text-[10px] px-2 py-1 rounded-md bg-white/5 text-slate-500 border border-white/5">
                  {skill}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-white/5">
              <div className="flex flex-wrap gap-2">
                {internship.hashtags.map(tag => (
                  <span key={tag} className="text-xs text-emerald-500/60 font-medium">#{tag}</span>
                ))}
              </div>
              
              {user?.role === 'candidate' && (
                <button 
                  onClick={() => handleApply(internship)}
                  disabled={applyingId === internship.id || appliedIds.has(internship.id)}
                  className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
                    appliedIds.has(internship.id) 
                      ? 'bg-emerald-500/10 text-emerald-500 cursor-default'
                      : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                  }`}
                >
                  {applyingId === internship.id ? (
                    <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  ) : appliedIds.has(internship.id) ? (
                    <>
                      <CheckCircle2 size={18} />
                      Applied
                    </>
                  ) : (
                    <>
                      Apply Now
                      <ChevronRight size={18} />
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
