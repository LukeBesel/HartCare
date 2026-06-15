import Link from "next/link";
import {
  Apple,
  Bot,
  Dumbbell,
  HeartPulse,
  Moon,
  PawPrint,
  Pill,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

const features = [
  { icon: Bot, title: "AI Health Coach", desc: "Personalized workout & meal plans, grocery lists and trend analysis — never a diagnosis." },
  { icon: Dumbbell, title: "Fitness", desc: "Build workouts with sets, reps, rest, videos and PR tracking for every level." },
  { icon: Apple, title: "Nutrition", desc: "Track macros, plan meals, save recipes and auto-generate grocery lists." },
  { icon: HeartPulse, title: "Health Records", desc: "Weight, blood pressure, labs, allergies, conditions — visualized over time." },
  { icon: Pill, title: "Medications", desc: "Dosages, refill reminders and notifications for the whole family — and pets." },
  { icon: Moon, title: "Sleep & Wellness", desc: "Sleep quality, mood, gratitude and meditation streaks in one calm place." },
  { icon: PawPrint, title: "Pet Care", desc: "Vaccines, feeding, vet visits and weight history for dogs and cats." },
  { icon: Users, title: "Family Mode", desc: "Profiles for parents, kids, grandparents and guests with shared plans." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface text-text">
      <header className="sticky top-0 z-30 backdrop-blur bg-surface/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid place-items-center h-9 w-9 rounded-xl bg-brand-600 text-white">
              <HeartPulse size={20} />
            </span>
            <span className="font-bold text-lg">HartCare</span>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-text-muted">
            <a href="#features" className="hover:text-text">Features</a>
            <a href="#coach" className="hover:text-text">AI Coach</a>
            <a href="#pricing" className="hover:text-text">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost">Sign in</Link>
            <Link href="/signup" className="btn-primary">Get started</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-[40rem] rounded-full bg-brand-200/40 blur-3xl dark:bg-brand-500/10" />
        <div className="relative max-w-5xl mx-auto px-5 pt-20 pb-16 text-center">
          <span className="chip bg-mint-50 text-mint-700 dark:bg-mint-500/15 dark:text-mint-300 mb-5">
            <Sparkles size={14} /> Now with the HartCare AI Coach
          </span>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05]">
            Healthy living,
            <span className="text-brand-600"> together.</span>
          </h1>
          <p className="mt-5 text-lg text-text-muted max-w-2xl mx-auto">
            One calm, beautiful place for your family&apos;s fitness, nutrition, sleep, medications,
            appointments and pet care — simple enough for kids and grandparents, powerful enough
            for everyone.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/signup" className="btn-primary px-6 py-3 text-base">Start free</Link>
            <Link href="/dashboard" className="btn-outline px-6 py-3 text-base">View live demo</Link>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-text-muted">
            <ShieldCheck size={16} className="text-mint-600" /> Private by design · Never a medical diagnosis
          </div>
        </div>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-5 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold">Everything your family&apos;s health needs</h2>
          <p className="text-text-muted mt-2">Apple Health + MyFitnessPal + Whoop — reimagined for households.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div key={f.title} className="card card-pad">
              <span className="grid place-items-center h-11 w-11 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 mb-3">
                <f.icon size={22} />
              </span>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-text-muted mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="coach" className="max-w-6xl mx-auto px-5 py-16">
        <div className="card card-pad lg:p-12 bg-gradient-to-br from-brand-600 to-brand-700 text-white">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <span className="chip bg-white/15 text-white mb-3"><Bot size={14} /> AI Health Coach</span>
              <h2 className="text-3xl font-bold">A coach in your pocket for the whole family</h2>
              <p className="mt-3 text-brand-100">
                Build workout and meal plans, get healthy substitutions, generate grocery lists,
                analyze trends and plan recovery days — all in plain language.
              </p>
              <Link href="/coach" className="mt-6 inline-flex btn bg-white text-brand-700 hover:bg-brand-50">
                Try the coach
              </Link>
            </div>
            <div className="space-y-3">
              {["Build me a 3-day beginner strength plan", "Create a high-protein dinner under 500 calories", "Turn this week's meals into a grocery list"].map((q) => (
                <div key={q} className="rounded-2xl bg-white/10 px-4 py-3 text-sm">{q}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="max-w-5xl mx-auto px-5 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold">Simple, family-friendly pricing</h2>
          <p className="text-text-muted mt-2">Start free. Upgrade for the AI coach and HartHome sync.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { name: "Free", price: "$0", tagline: "For getting started", feats: ["1 profile", "Activity, water & sleep", "Basic goals"], cta: "Start free", highlight: false },
            { name: "Premium", price: "$9", tagline: "For health-conscious adults", feats: ["AI Health Coach", "Full nutrition & fitness", "Health records & analytics"], highlight: true, cta: "Go Premium" },
            { name: "Family", price: "$15", tagline: "For the whole household", feats: ["Up to 6 profiles + pets", "Family mode & sharing", "HartHome integration"], cta: "Choose Family", highlight: false },
          ].map((p) => (
            <div key={p.name} className={`card card-pad relative ${p.highlight ? "ring-2 ring-brand-500" : ""}`}>
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 chip bg-brand-600 text-white">Most popular</span>
              )}
              <h3 className="font-semibold text-lg">{p.name}</h3>
              <p className="text-sm text-text-muted">{p.tagline}</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold">{p.price}</span>
                <span className="text-text-muted text-sm">/mo</span>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {p.feats.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-mint-500" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className={`mt-6 w-full ${p.highlight ? "btn-primary" : "btn-outline"}`}>{p.cta}</Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-text-muted">
          <div className="flex items-center gap-2">
            <HeartPulse size={18} className="text-brand-600" />
            <span className="font-semibold text-text">HartCare</span>
            <span>· Healthy living, together.</span>
          </div>
          <p>HartCare provides wellness information, not medical advice. © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
