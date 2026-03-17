import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Rocket, 
  ShieldCheck, 
  Code, 
  Users, 
  ArrowRight,
  Sparkles,
  Award
} from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-32 pb-20">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 flex flex-col items-center text-center">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6 max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
            <Sparkles size={16} />
            <span>AI-Powered Career Launchpad</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-[1.1]">
            The Future of <br />
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Smart Internships
            </span>
          </h1>
          
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Connect with top recruiters through skill-based challenges, 
            AI-verified resumes, and blockchain-secured achievements.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-8">
            <Link 
              to="/login" 
              className="px-8 py-4 bg-emerald-500 text-slate-950 font-bold rounded-2xl hover:bg-emerald-400 hover:scale-105 transition-all flex items-center gap-2 shadow-xl shadow-emerald-500/20"
            >
              Get Started Now
              <ArrowRight size={20} />
            </Link>
            <Link 
              to="/leaderboard" 
              className="px-8 py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-all border border-white/10"
            >
              View Top Coders
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="grid md:grid-cols-3 gap-8">
        {[
          {
            icon: <Code className="text-emerald-400" />,
            title: "Gamified Challenges",
            desc: "Solve algorithm problems to build your coding reputation and get noticed by recruiters."
          },
          {
            icon: <ShieldCheck className="text-cyan-400" />,
            title: "Blockchain Verified",
            desc: "Your certificates and achievements are stored as immutable records for total trust."
          },
          {
            icon: <Rocket className="text-purple-400" />,
            title: "AI Resume Analysis",
            desc: "Get instant ATS scores and feedback on your resume using advanced Gemini AI."
          }
        ].map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all group"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              {feature.icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
            <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* Stats Section */}
      <section className="py-20 rounded-[40px] bg-gradient-to-b from-emerald-500/5 to-transparent border border-emerald-500/10 px-8 text-center">
        <div className="grid md:grid-cols-4 gap-12">
          {[
            { label: "Active Students", value: "10K+" },
            { label: "Partner Companies", value: "500+" },
            { label: "Challenges Solved", value: "50K+" },
            { label: "Internships Secured", value: "2K+" }
          ].map((stat, i) => (
            <div key={i} className="space-y-2">
              <div className="text-4xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-slate-500 uppercase tracking-widest font-semibold">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
