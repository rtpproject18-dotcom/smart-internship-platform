import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../types';
import { createUserProfile } from '../services/db';
import { Check, ChevronRight, Sparkles } from 'lucide-react';

interface OnboardingProps {
  user: UserProfile;
  setUser: (user: UserProfile) => void;
}

const DOMAINS = [
  "Web Development",
  "Artificial Intelligence",
  "Data Science",
  "Cloud Computing",
  "UI/UX Design",
  "Mobile Development",
  "Cybersecurity",
  "Blockchain"
];

const SKILLS = [
  "React", "Node.js", "Python", "Java", "C++", "TypeScript", 
  "Figma", "AWS", "Docker", "TensorFlow", "SQL", "Go"
];

export default function Onboarding({ user, setUser }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const navigate = useNavigate();

  const handleComplete = async () => {
    const updatedProfile = {
      ...user,
      domainInterests: selectedDomains,
      skills: selectedSkills,
      bio: bio,
    };
    await createUserProfile(updatedProfile);
    setUser(updatedProfile as UserProfile);
    navigate('/dashboard');
  };

  const toggleItem = (item: string, list: string[], setList: (l: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        <div className="text-center space-y-4">
          <div className="inline-block px-4 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest">
            Step {step} of 3
          </div>
          <h2 className="text-4xl font-bold">Let's personalize your experience</h2>
          <p className="text-slate-400">Tell us about your interests to help us find the perfect internships.</p>
        </div>

        {step === 1 && (
          <div className="space-y-8">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Sparkles className="text-emerald-400" size={20} />
              What domains are you interested in?
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {DOMAINS.map(domain => (
                <button
                  key={domain}
                  onClick={() => toggleItem(domain, selectedDomains, setSelectedDomains)}
                  className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between ${
                    selectedDomains.includes(domain)
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  {domain}
                  {selectedDomains.includes(domain) && <Check size={18} />}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Sparkles className="text-emerald-400" size={20} />
              What are your top skills?
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {SKILLS.map(skill => (
                <button
                  key={skill}
                  onClick={() => toggleItem(skill, selectedSkills, setSelectedSkills)}
                  className={`p-3 rounded-xl border transition-all text-center ${
                    selectedSkills.includes(skill)
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Sparkles className="text-emerald-400" size={20} />
              Tell us a bit about yourself
            </h3>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Your career goals, achievements, or what you're looking for..."
              className="w-full h-40 p-6 rounded-3xl bg-white/5 border border-white/10 focus:border-emerald-500 outline-none transition-all resize-none text-lg"
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-8">
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              step === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-400 hover:text-white'
            }`}
          >
            Back
          </button>
          <button
            onClick={() => step === 3 ? handleComplete() : setStep(s => s + 1)}
            className="px-8 py-3 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 transition-all flex items-center gap-2"
          >
            {step === 3 ? 'Complete Setup' : 'Next Step'}
            <ChevronRight size={20} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
