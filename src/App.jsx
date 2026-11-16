import React, { useState, useEffect } from 'react';
import { Check, Sparkles, FileText, ShieldCheck, ArrowRight, Download, Copy, CheckCircle2, Loader2 } from 'lucide-react';

const TIERS = [
  {
    id: 'starter',
    name: 'Starter Mint',
    price: 24,
    tagline: 'Beat automated ATS screeners fast',
    features: ['Full ATS-optimized resume rewrite', 'Before & After ATS match score', 'Missing keyword injection report', 'Instant TXT & Print-PDF export']
  },
  {
    id: 'pro',
    name: 'Pro Mint',
    price: 49,
    popular: true,
    tagline: 'Complete application & LinkedIn overhaul',
    features: ['Everything in Starter Mint', 'Tailored role-specific Cover Letter', 'LinkedIn Headline & About rewrite', 'Recruiter readability formatting']
  },
  {
    id: 'executive',
    name: 'Executive Mint',
    price: 89,
    tagline: 'Senior leadership & high-stakes positioning',
    features: ['Everything in Pro Mint', '30-60-90 Day Leadership Pitch', 'Direct Hiring Manager outreach scripts', 'Executive boardroom impact framing']
  }
];

export default function App() {
  const [selectedTier, setSelectedTier] = useState('pro');
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('resume');
  const [copied, setCopied] = useState(false);

  // Check if returning from Stripe Checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const tier = params.get('tier');
    const savedDraft = sessionStorage.getItem('resumint_draft');

    if (sessionId && savedDraft) {
      const draft = JSON.parse(savedDraft);
      setResumeText(draft.resumeText);
      setTargetRole(draft.targetRole);
      setJobDescription(draft.jobDescription);
      if (tier) setSelectedTier(tier);
      runGeneration(sessionId, tier || draft.tier, draft.resumeText, draft.targetRole, draft.jobDescription);
      window.history.replaceState({}, document.title, '/');
    }
  }, []);

  const handleCheckout = async () => {
    if (!resumeText.trim()) {
      alert('Please paste or upload your existing resume first.');
      return;
    }
    setLoading(true);
    setStatusMsg('Redirecting to secure Stripe Checkout...');
    sessionStorage.setItem('resumint_draft', JSON.stringify({
      tier: selectedTier,
      resumeText,
      targetRole,
      jobDescription
    }));

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId: selectedTier })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Checkout failed');
      }
    } catch (err) {
      alert(err.message);
      setLoading(false);
    }
  };

  const runGeneration = async (sessionId, tierId, text, role, jd) => {
    setLoading(true);
    setStatusMsg('Payment confirmed! ResuMint AI is optimizing your deliverables...');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, tierId, resumeText: text, targetRole: role, jobDescription: jd })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setResult(data);
      sessionStorage.removeItem('resumint_draft');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setResumeText(String(ev.target?.result || ''));
    reader.readAsText(file);
  };

  const copyContent = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTxt = (filename, text) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
              R
            </div>
            <span className="text-xl font-bold tracking-tight">Resu<span className="text-emerald-400">Mint</span></span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Instant AI Delivery</span>
            <span className="hidden sm:inline">support@resumint.com</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Engineered by Executive Recruiters &amp; AI
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Turn Your Resume Into an <span className="text-emerald-400">Interview Magnet</span> in 30 Seconds.
          </h1>
          <p className="text-slate-400 text-lg">
            Select your package, paste your current resume, and receive an ATS-calibrated rewrite, cover letter, and executive positioning suite automatically.
          </p>
        </div>

        {/* Pricing Tiers */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {TIERS.map((tier) => {
            const active = selectedTier === tier.id;
            return (
              <div
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={`cursor-pointer rounded-2xl p-6 border transition-all ${
                  active
                    ? 'bg-slate-900 border-emerald-400 ring-2 ring-emerald-400/20'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg">{tier.name}</h3>
                  {tier.popular && (
                    <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                      Most Popular
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-4">{tier.tagline}</p>
                <div className="text-3xl font-extrabold mb-5">
                  ${tier.price} <span className="text-xs font-normal text-slate-400">one-time</span>
                </div>
                <ul className="space-y-2.5 text-sm text-slate-300">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Workspace / Results */}
        {loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">{statusMsg}</h3>
            <p className="text-slate-400 text-sm">Please keep this tab open while your documents are generated.</p>
          </div>
        ) : result ? (
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Optimization Complete</span>
                <h2 className="text-2xl font-bold mt-1">Your ResuMint Deliverables</h2>
              </div>
              <div className="flex items-center gap-4 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
                <div>
                  <div className="text-[11px] text-slate-400">Before ATS</div>
                  <div className="text-lg font-bold text-rose-400">{result.atsBeforeScore}%</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600" />
                <div>
                  <div className="text-[11px] text-slate-400">After ResuMint</div>
                  <div className="text-lg font-bold text-emerald-400">{result.atsAfterScore}%</div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 my-6">
              {[
                { id: 'resume', label: 'Optimized Resume' },
                { id: 'audit', label: 'ATS Keyword Audit' },
                ...(result.coverLetter ? [{ id: 'cover', label: 'Cover Letter' }] : []),
                ...(result.linkedinAboutAndHeadline ? [{ id: 'linkedin', label: 'LinkedIn Rewrite' }] : []),
                ...(result.thirtySixtyNinetyPitch ? [{ id: 'pitch', label: '30-60-90 Day Pitch' }] : [])
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === t.id ? 'bg-emerald-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Active Deliverable Content */}
            {activeTab === 'audit' ? (
              <div className="space-y-4">
                <p className="text-slate-300 text-sm leading-relaxed">{result.recruiterSummary}</p>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Injected ATS Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.missingKeywordsAdded?.map((kw, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs">
                        + {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-end gap-2 mb-3">
                  <button
                    onClick={() => copyContent(
                      activeTab === 'resume' ? result.rewrittenResume :
                      activeTab === 'cover' ? result.coverLetter :
                      activeTab === 'linkedin' ? result.linkedinAboutAndHeadline :
                      `${result.thirtySixtyNinetyPitch}\n\n---\n\n${result.recruiterOutreachTemplates || ''}`
                    )}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium"
                  >
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy Text'}
                  </button>
                  <button
                    onClick={() => downloadTxt(`ResuMint-${activeTab}.txt`,
                      activeTab === 'resume' ? result.rewrittenResume :
                      activeTab === 'cover' ? result.coverLetter :
                      activeTab === 'linkedin' ? result.linkedinAboutAndHeadline :
                      `${result.thirtySixtyNinetyPitch}\n\n---\n\n${result.recruiterOutreachTemplates || ''}`
                    )}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-medium"
                  >
                    <Download className="w-3.5 h-3.5" /> Download .TXT
                  </button>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-sm text-slate-200 bg-slate-950 p-6 rounded-xl border border-slate-800 leading-relaxed">
                  {activeTab === 'resume' && result.rewrittenResume}
                  {activeTab === 'cover' && result.coverLetter}
                  {activeTab === 'linkedin' && result.linkedinAboutAndHeadline}
                  {activeTab === 'pitch' && `${result.thirtySixtyNinetyPitch}\n\n---\n\n${result.recruiterOutreachTemplates || ''}`}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Target Job Title
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g., Director of Operations, Senior Financial Analyst"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Upload .TXT Resume (Optional)
                </label>
                <input
                  type="file"
                  accept=".txt,.md"
                  onChange={handleFileUpload}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-500/20 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-emerald-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Paste Your Current Resume *
              </label>
              <textarea
                rows={8}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your current resume text here..."
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Target Job Description (Recommended for 90%+ ATS Alignment)
              </label>
              <textarea
                rows={4}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job posting requirements so our AI mirrors exact keywords..."
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>

            <button
              onClick={handleCheckout}
              className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText className="w-5 h-5" />
              Continue to Checkout — {TIERS.find((t) => t.id === selectedTier)?.name} (${TIERS.find((t) => t.id === selectedTier)?.price})
            </button>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-900 mt-16 py-8 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} ResuMint. All rights reserved. Digital deliverables are generated instantly upon order confirmation.
      </footer>
    </div>
  );
}
