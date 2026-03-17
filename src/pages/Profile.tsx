import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserProfile, Certificate } from '../types';
import { getUserProfile, addCertificate, createUserProfile, getApplicationsForCandidate, updateUserProfile } from '../services/db';
import { analyzeResume } from '../services/gemini';
import { 
  Github, 
  Globe, 
  Award, 
  FileText, 
  Plus, 
  ShieldCheck, 
  ExternalLink,
  Code,
  CheckCircle2,
  Upload,
  Sparkles,
  Briefcase,
  Calendar,
  Edit2,
  Save,
  X
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Application } from '../types';

interface ProfileProps {
  currentUser: UserProfile | null;
}

export default function Profile({ currentUser }: ProfileProps) {
  const { uid } = useParams<{ uid: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isAddingCert, setIsAddingCert] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newCert, setNewCert] = useState({ title: '', issuer: '', url: '' });
  const [editData, setEditData] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    if (uid) {
      getUserProfile(uid).then(p => {
        setProfile(p);
        setEditData(p || {});
      });
      
      const certsQ = query(collection(db, 'certificates'), where('candidateId', '==', uid));
      const unsubscribeCerts = onSnapshot(certsQ, (snap) => {
        setCertificates(snap.docs.map(d => ({ id: d.id, ...d.data() } as Certificate)));
      });

      getApplicationsForCandidate(uid).then(setApplications);

      return () => {
        unsubscribeCerts();
      };
    }
  }, [uid]);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile || profile.uid !== currentUser?.uid) return;
    
    setIsUploadingResume(true);
    try {
      // Simulation: In a real app, we'd upload to Firebase Storage
      // Here we'll just simulate the analysis and store a mock URL
      const mockUrl = `https://storage.example.com/resumes/${profile.uid}/${file.name}`;
      
      // We'll still use the text analysis simulation but with mock data
      const analysis = await analyzeResume("Simulated resume content from " + file.name);
      
      const updatedProfile = {
        ...profile,
        resumeUrl: mockUrl,
        resumeData: analysis,
        atsScore: analysis.atsScore,
        skills: Array.from(new Set([...(profile.skills || []), ...analysis.skills])),
      };
      await updateUserProfile(profile.uid, updatedProfile);
      setProfile(updatedProfile as UserProfile);
    } catch (error) {
      console.error('Resume upload failed:', error);
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewCert({ ...newCert, url: `https://storage.example.com/certs/${file.name}` });
  };

  const handleAddCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || profile.uid !== currentUser?.uid) return;
    
    // Simulation: Blockchain hash generation
    const verifiedHash = btoa(newCert.title + newCert.issuer + Date.now()).slice(0, 16);
    
    await addCertificate({
      candidateId: profile.uid,
      title: newCert.title,
      issuer: newCert.issuer,
      url: newCert.url,
      verifiedHash
    });
    setIsAddingCert(false);
    setNewCert({ title: '', issuer: '', url: '' });
  };

  const handleSaveProfile = async () => {
    if (!profile || !currentUser || profile.uid !== currentUser.uid) return;
    try {
      await updateUserProfile(profile.uid, editData);
      setProfile({ ...profile, ...editData } as UserProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (!profile) return <div className="p-20 text-center">Loading profile...</div>;

  const isOwnProfile = currentUser?.uid === profile.uid;

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Header Card */}
      <section className="relative p-10 rounded-[40px] bg-white/5 border border-white/10 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -mr-32 -mt-32" />
        
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="relative">
            <div className="w-40 h-40 rounded-[32px] overflow-hidden border-4 border-white/5 shadow-2xl">
              <img 
                src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.uid}`} 
                alt={profile.displayName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg">
              <Award size={24} />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="flex items-center justify-center md:justify-between">
              <div className="space-y-1">
                <h1 className="text-4xl font-bold">{profile.displayName}</h1>
                <p className="text-emerald-400 font-medium">{profile.role.toUpperCase()} • {profile.specialization || 'Generalist'}</p>
              </div>
              {isOwnProfile && (
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-sm font-bold"
                >
                  {isEditing ? <><X size={16} /> Cancel</> : <><Edit2 size={16} /> Edit Profile</>}
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <textarea 
                  value={editData.bio || ''}
                  onChange={e => setEditData({...editData, bio: e.target.value})}
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 focus:border-emerald-500 outline-none resize-none h-24"
                  placeholder="Tell us about yourself..."
                />
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="text"
                    value={editData.specialization || ''}
                    onChange={e => setEditData({...editData, specialization: e.target.value})}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 focus:border-emerald-500 outline-none"
                    placeholder="Specialization (e.g. Frontend)"
                  />
                  <input 
                    type="text"
                    value={editData.github || ''}
                    onChange={e => setEditData({...editData, github: e.target.value})}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 focus:border-emerald-500 outline-none"
                    placeholder="GitHub URL"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="text"
                    value={editData.skills?.join(', ') || ''}
                    onChange={e => setEditData({...editData, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 focus:border-emerald-500 outline-none"
                    placeholder="Skills (comma separated)"
                  />
                  <input 
                    type="text"
                    value={editData.interests?.join(', ') || ''}
                    onChange={e => setEditData({...editData, interests: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 focus:border-emerald-500 outline-none"
                    placeholder="Interests (comma separated)"
                  />
                </div>
                <button 
                  onClick={handleSaveProfile}
                  className="w-full py-3 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={18} /> Save Changes
                </button>
              </div>
            ) : (
              <p className="text-slate-400 max-w-xl leading-relaxed">{profile.bio || "No bio yet."}</p>
            )}
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
              {profile.github && (
                <a href={profile.github} target="_blank" rel="noreferrer" className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-slate-400 hover:text-white">
                  <Github size={20} />
                </a>
              )}
              {profile.portfolio && (
                <a href={profile.portfolio} target="_blank" rel="noreferrer" className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-slate-400 hover:text-white">
                  <Globe size={20} />
                </a>
              )}
              <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center gap-2">
                <Code size={18} />
                {profile.codingScore} Points
              </div>
              <div className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold flex items-center gap-2">
                <CheckCircle2 size={18} />
                {profile.challengesSolved || 0} Solved
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Applied Internships Section */}
          {applications.length > 0 && (
            <section className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Briefcase className="text-orange-400" size={24} />
                Applied Internships
              </h2>
              <div className="grid gap-4">
                {applications.map(app => (
                  <div key={app.id} className="p-6 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between group hover:border-orange-500/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                        <Briefcase size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold">{app.internshipTitle}</h4>
                        <p className="text-sm text-slate-500">{app.companyName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right hidden md:block">
                        <div className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Applied On</div>
                        <div className="text-sm font-medium flex items-center gap-2 text-slate-300">
                          <Calendar size={14} />
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        app.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        app.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {app.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Sparkles className="text-emerald-400" size={24} />
                Skills & Expertise
              </h2>
              {isEditing && (
                <button 
                  onClick={() => {
                    const skill = prompt('Add a skill:');
                    if (skill) setEditData({...editData, skills: [...(editData.skills || []), skill]});
                  }}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300"
                >
                  + Add Skill
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {(isEditing ? editData.skills : profile.skills)?.map((skill, idx) => (
                <span key={skill} className="group relative px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:border-emerald-500/50 transition-all">
                  {skill}
                  {isEditing && (
                    <button 
                      onClick={() => setEditData({...editData, skills: editData.skills?.filter((_, i) => i !== idx)})}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  )}
                </span>
              ))}
            </div>
          </section>

          {/* Resume Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <FileText className="text-cyan-400" size={24} />
                Resume Analysis
              </h2>
              {isOwnProfile && (
                <button 
                  onClick={() => setIsUploadingResume(!isUploadingResume)}
                  className="text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  {isUploadingResume ? 'Cancel' : 'Update Resume'}
                </button>
              )}
            </div>

            {isUploadingResume ? (
              <div className="p-12 rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                <div className="text-emerald-400 text-sm font-bold flex items-center gap-2">
                  <Sparkles size={16} />
                  <span>Gemini is analyzing your resume...</span>
                </div>
              </div>
            ) : profile.resumeData || profile.resumeUrl ? (
              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-sm text-slate-500 uppercase tracking-widest font-bold">ATS Score</div>
                    <div className="text-4xl font-bold text-emerald-400">{profile.atsScore || 0}%</div>
                  </div>
                  <div className="w-24 h-24 rounded-full border-8 border-emerald-500/20 border-t-emerald-500 flex items-center justify-center font-bold">
                    {profile.atsScore || 0}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                  <div>
                    <h4 className="font-bold mb-2 text-slate-300">Extracted Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {(profile.resumeData?.skills || []).slice(0, 8).map((s: string) => (
                        <span key={s} className="text-xs px-2 py-1 rounded bg-white/5 text-slate-400">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-300">Resume Document</h4>
                    <div className="flex flex-col gap-2">
                      <a 
                        href={profile.resumeUrl || "#"} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all text-sm font-bold"
                      >
                        <FileText size={16} />
                        View Uploaded Resume
                      </a>
                      {isOwnProfile && (
                        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-all text-sm font-bold">
                          <Upload size={16} />
                          Replace PDF
                          <input type="file" accept=".pdf" className="hidden" onChange={handleResumeUpload} />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 rounded-3xl border border-dashed border-white/10 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-slate-500">
                  <Upload size={32} />
                </div>
                <p className="text-slate-500">Upload your professional resume (PDF) for AI analysis.</p>
                {isOwnProfile && (
                  <label className="cursor-pointer inline-block px-8 py-3 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 transition-all">
                    Upload PDF Resume
                    <input type="file" accept=".pdf" className="hidden" onChange={handleResumeUpload} />
                  </label>
                )}
              </div>
            )}
          </section>

          {/* Certificates Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Award className="text-purple-400" size={24} />
                Verified Certificates
              </h2>
              {isOwnProfile && (
                <button 
                  onClick={() => setIsAddingCert(true)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-slate-400 hover:text-white"
                >
                  <Plus size={20} />
                </button>
              )}
            </div>

            {isAddingCert && (
              <motion.form 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleAddCert}
                className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4"
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <input 
                    required
                    placeholder="Certificate Title"
                    value={newCert.title}
                    onChange={e => setNewCert({...newCert, title: e.target.value})}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 focus:border-emerald-500 outline-none"
                  />
                  <input 
                    required
                    placeholder="Issuer (e.g. Google, Coursera)"
                    value={newCert.issuer}
                    onChange={e => setNewCert({...newCert, issuer: e.target.value})}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex-1 cursor-pointer p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2 text-slate-400">
                    <Upload size={18} />
                    {newCert.url ? 'PDF Selected' : 'Upload Certificate PDF'}
                    <input type="file" accept=".pdf" className="hidden" onChange={handleCertUpload} />
                  </label>
                  <input 
                    placeholder="Or paste URL"
                    value={newCert.url}
                    onChange={e => setNewCert({...newCert, url: e.target.value})}
                    className="flex-1 p-3 rounded-xl bg-white/5 border border-white/10 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 py-3 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 transition-all">
                    Add Certificate
                  </button>
                  <button type="button" onClick={() => setIsAddingCert(false)} className="px-6 py-3 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-all">
                    Cancel
                  </button>
                </div>
              </motion.form>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {certificates.map(cert => (
                <div key={cert.id} className="p-6 rounded-2xl bg-white/5 border border-white/10 group hover:border-emerald-500/30 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                      <Award size={20} />
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                      <ShieldCheck size={12} />
                      VERIFIED
                    </div>
                  </div>
                  <h4 className="font-bold mb-1">{cert.title}</h4>
                  <p className="text-sm text-slate-500 mb-4">{cert.issuer}</p>
                  <div className="flex items-center justify-between">
                    <a href={cert.url} target="_blank" rel="noreferrer" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors font-bold">
                      <FileText size={12} />
                      View PDF Certificate <ExternalLink size={12} />
                    </a>
                    <div className="text-[10px] font-mono text-slate-600">HASH: {cert.verifiedHash}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-10">
          <section className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Interests & Specialization</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">Specialization</div>
                <div className="text-emerald-400 font-bold">{profile.specialization || 'Not specified'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">Interests</div>
                <div className="flex flex-wrap gap-2">
                  {(isEditing ? editData.interests : profile.interests)?.map((interest, idx) => (
                    <span key={interest} className="group relative px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-bold">
                      {interest}
                      {isEditing && (
                        <button 
                          onClick={() => setEditData({...editData, interests: editData.interests?.filter((_, i) => i !== idx)})}
                          className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={8} />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="p-8 rounded-3xl bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20 space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="text-cyan-400" size={20} />
              Achievements
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500">
                  <Award size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold">Top 10% Coder</div>
                  <div className="text-xs text-slate-500">Based on challenge score</div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold">Resume Verified</div>
                  <div className="text-xs text-slate-500">AI Analysis complete</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
