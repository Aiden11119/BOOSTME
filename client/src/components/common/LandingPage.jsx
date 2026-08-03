import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Activity, Users, ArrowRight, CheckCircle, Award, Sparkles, LogIn, ChevronRight } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Activity,
      title: "ML Grade Predictor",
      desc: "Instantly analyze your current performance indicators and get grade forecasts supported by LIME Explainable AI diagnostics.",
      color: "blue",
      badge: "Machine Learning"
    },
    {
      icon: Bot,
      title: "24/7 AI Counselor",
      desc: "Talk to our empathetic chatbot anytime to receive personal counseling, academic guidance, or support when feeling stressed.",
      color: "indigo",
      badge: "AI Powered"
    },
    {
      icon: Users,
      title: "P2P Mentoring",
      desc: "Connect and schedule 1-on-1 counseling sessions with verified campus lecturers and experienced student mentors.",
      color: "purple",
      badge: "Human Touch"
    }
  ];

  const stats = [
    { value: "80+%", label: "Accuracy Rate" },
    { value: "50+", label: "Verified Mentors" },
    { value: "10k+", label: "Support Chats" },
    { value: "3+", label: "Targeted Roles" }
  ];

  const roles = [
    {
      role: "student",
      title: "For Students",
      benefits: ["Predict final grades early", "AI diagnostics & actionable advice", "Book peer counseling", "24/7 emotional support chatbot"],
      gradient: "from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20",
      btnClass: "bg-blue-600 hover:bg-blue-700 text-white"
    },
    {
      role: "lecturer",
      title: "For Lecturers",
      benefits: ["Monitor at-risk students", "Batch upload grades via Excel/CSV", "Proactively contact students", "Track historical class distributions"],
      gradient: "from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20",
      btnClass: "bg-green-600 hover:bg-green-700 text-white"
    },
    {
      role: "mentor",
      title: "For Mentors",
      benefits: ["Offer session availability", "Confirm & manage appointment slots", "Interactive schedules", "Communicate with students in need"],
      gradient: "from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20",
      btnClass: "bg-purple-600 hover:bg-purple-700 text-white"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* ─── HEADER / NAVBAR ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl p-0.5 flex items-center justify-center overflow-hidden shadow-md">
              <img src="/logo-192.png" alt="Logo" className="w-full h-full object-cover rounded-xl bg-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-wide">
              BoostMe
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600 dark:text-slate-300">
            <a href="#features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</a>
            <a href="#roles" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Who is it for?</a>
            <a href="#stats" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Impact</a>
          </nav>

          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            Sign In <LogIn className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ─── HERO SECTION ────────────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-20 md:py-28 overflow-hidden px-6">
        {/* Colorful backgrounds blobs */}
        <div className="absolute top-[-10%] left-[-15%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-pulse"></div>
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-pulse animation-delay-2000"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-xs font-bold text-blue-700 dark:text-blue-400">
              <Sparkles className="w-3.5 h-3.5" /> Empowering UTAR Students
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 dark:text-white leading-[1.1] tracking-tight">
              Predict. Connect.<br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Excel.</span>
            </h1>

            <p className="text-gray-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
              Unlock academic foresight. BoostMe integrates high-accuracy machine learning predictions with certified counseling networks and empathetic AI assistance to secure your academic path.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto px-8 py-3.5 font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Get Started Free <ArrowRight className="w-5 h-5" />
              </button>
              <a
                href="#features"
                className="w-full sm:w-auto px-8 py-3.5 font-bold bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl transition-all text-center"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Right Mockup Preview */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-lg bg-white/70 dark:bg-slate-800/50 border border-white/20 dark:border-slate-700/50 rounded-3xl p-6 shadow-2xl backdrop-blur-md relative transform lg:rotate-2 hover:rotate-0 transition-transform duration-500">

              {/* Mock Predict Header */}
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <span className="text-xs font-semibold text-gray-400">Preview Dashboard</span>
              </div>

              {/* Mock Interface Content */}
              <div className="space-y-4 pt-4">
                <div className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Active Course</span>
                    <span className="text-blue-500 font-bold">100% Loaded</span>
                  </div>
                  <p className="font-bold text-gray-800 dark:text-slate-100 text-sm">Object Oriented Systems Analysis & Design</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100/50 dark:border-blue-900/30 text-center">
                    <span className="text-[10px] text-blue-500 dark:text-blue-400 font-bold uppercase">Attendance</span>
                    <p className="text-lg font-black text-blue-700 dark:text-blue-300">92%</p>
                  </div>
                  <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-100/50 dark:border-purple-900/30 text-center">
                    <span className="text-[10px] text-purple-500 dark:text-purple-400 font-bold uppercase">Midterm</span>
                    <p className="text-lg font-black text-purple-700 dark:text-purple-300">85 / 100</p>
                  </div>
                </div>

                {/* AI Result Mockup */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl flex items-center justify-between shadow-inner">
                  <div>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">ML Forecast</span>
                    <p className="font-black text-xl text-gray-900 dark:text-white mt-0.5">Grade A</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                    A
                  </div>
                </div>

                {/* Diagnostic bubble */}
                <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 rounded-xl text-[11px] text-green-800 dark:text-green-300 font-medium leading-relaxed">
                  ⚡ <strong>AI Guide:</strong> Great job! Attendance & Midterms act as key Grade Boosters. Watch quiz avg to maintain A bracket.
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS SECTION ───────────────────────────────────────────────────── */}
      <section id="stats" className="bg-white dark:bg-slate-800/50 border-y border-gray-100 dark:border-slate-800 py-12 px-6 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, idx) => (
              <div key={idx} className="space-y-1">
                <p className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES SECTION ────────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto space-y-3 mb-16">
          <h2 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Platform capabilities</h2>
          <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight sm:text-4xl">
            Everything you need to boost your academic outcome
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div key={idx} className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 bg-${f.color}-50 dark:bg-${f.color}-500/10 text-${f.color}-600 dark:text-${f.color}-400`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{f.badge}</span>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1.5 mb-3">{f.title}</h3>
                  <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                </div>

                <button
                  onClick={() => navigate('/register')}
                  className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors group cursor-pointer"
                >
                  Explore <ChevronRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── ROLES SECTION ───────────────────────────────────────────────────── */}
      <section id="roles" className="py-20 px-6 bg-gray-100/50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-800 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto space-y-3 mb-16">
            <h2 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">Tailored Experience</h2>
            <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight sm:text-4xl">
              Who utilizes BoostMe?
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {roles.map((r, idx) => (
              <div key={idx} className={`bg-gradient-to-b ${r.gradient} border border-gray-200/50 dark:border-slate-800/40 rounded-3xl p-8 shadow-sm flex flex-col justify-between`}>
                <div className="space-y-6">
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white">{r.title}</h3>
                  <ul className="space-y-3.5">
                    {r.benefits.map((b, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-slate-300">
                        <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => navigate('/register')}
                  className={`w-full mt-8 py-3 rounded-xl font-bold text-sm shadow transition-all ${r.btnClass} cursor-pointer`}
                >
                  Join as {r.role.charAt(0).toUpperCase() + r.role.slice(1)}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CALL TO ACTION SECTION ──────────────────────────────────────────── */}
      <section className="py-20 px-6 text-center max-w-4xl mx-auto relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full filter blur-3xl pointer-events-none"></div>

        <div className="space-y-8 relative z-10">
          <Award className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto" />
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
            Take Control of Your Academic Performance Today
          </h2>
          <p className="text-gray-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Create an account using your UTAR email to get instant access to predictions, counseling, and mentorship resources.
          </p>
          <button
            onClick={() => navigate('/register')}
            className="px-10 py-4 font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            Create Your Account Now <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 dark:border-slate-800 py-10 text-center text-xs text-gray-400 bg-white dark:bg-slate-900 transition-all duration-300">
        <p className="font-semibold text-gray-500 dark:text-slate-400 mb-1">© {new Date().getFullYear()} BoostMe Platform. All rights reserved.</p>
        <p>Built for enhanced academic advising and student mental wellness.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
