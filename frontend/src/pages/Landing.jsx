import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';

const Landing = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-24 text-center lg:flex-row lg:items-center lg:gap-12 lg:text-left">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex-1"
        >
          <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            Student Project Finance Tracker
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
            Manage project budgets, scholarships, and loans in one place.
          </h1>
          <p className="mt-4 text-lg text-muted">
            Stay on top of income from grants, monitor expenses, apply for scholarships, and track loan repayments
            effortlessly with real-time dashboards.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
            <Link
              to="/auth/register"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Create free account
            </Link>
            <Link
              to="/auth/login"
              className="inline-flex items-center justify-center rounded-xl border border-primary px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              I already have an account
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          className="flex-1"
        >
          <div className="relative mx-auto max-w-xl rounded-3xl border border-primary/20 bg-white/80 p-6 shadow-soft backdrop-blur">
            <div className="rounded-2xl bg-background p-6">
              <p className="text-sm font-semibold text-primary">At-a-glance insights</p>
              <dl className="mt-4 grid gap-6 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted">Balance</dt>
                  <dd className="mt-1 text-2xl font-bold text-slate-900">₦450,000</dd>
                  <p className="mt-1 text-xs text-emerald-500">+₦50k vs last month</p>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted">Upcoming repayments</dt>
                  <dd className="mt-1 text-2xl font-bold text-slate-900">₦120,000</dd>
                  <p className="mt-1 text-xs text-muted">Due in 10 days</p>
                </div>
              </dl>
              <div className="mt-6 rounded-2xl border border-dashed border-primary/40 px-4 py-5 text-left">
                <p className="text-sm font-semibold text-slate-900">Keep every project funded</p>
                <p className="mt-2 text-xs text-muted">
                  Track multi-source finances, manage bursary applications, and collaborate with teammates seamlessly.
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute -left-10 -top-10 hidden h-24 w-24 rounded-full bg-accent/10 lg:block" />
            <div className="pointer-events-none absolute -bottom-12 -right-12 hidden h-32 w-32 rounded-full bg-primary/10 lg:block" />
          </div>
        </motion.div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="text-center text-2xl font-semibold text-slate-900">Why students love it</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[{
            title: 'Unified dashboard',
            body: 'Pull income, spending, loans, and scholarships into a single view with actionable metrics.'
          }, {
            title: 'Automated reminders',
            body: 'Never miss due dates with intelligent alerts for repayments and scholarship deadlines.'
          }, {
            title: 'Secure & compliant',
            body: 'Enterprise-grade security with granular permissions and audit-ready exports.'
          }].map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Landing;
