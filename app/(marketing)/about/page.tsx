import MarketingPageIntro from "@/app/components/marketing/MarketingPageIntro";

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <MarketingPageIntro
        eyebrow="About Us"
        title="About Eagle Gymnastics Academy"
        description="We are a child-focused gymnastics academy where confidence, safety, and steady progress come first. Our coaches create a positive environment that helps gymnasts build strong foundations at their own pace."
      />

      <section className="mt-12 space-y-3">
        <h2>A Clear Pathway for Every Gymnast</h2>
        <p className="text-sm text-[#2E2A33]/70">
          Every gymnast begins in our recreational classes, where fundamentals
          and confidence are built in a supportive setting. As skills develop,
          gymnasts progress through clear stages that match their readiness.
          Over time, coaches identify athletes who may be ready for advanced
          training and discuss that pathway with families.
        </p>
      </section>

      <section className="mt-12">
        <div className="space-y-2">
          <h2>Recreational Programme and Competition Squad Training</h2>
          <p className="text-sm text-[#2E2A33]/70">
            Recreational is open to all. Squad training is by
            invitation/assessment.
          </p>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-black/5 bg-[#faf7fb] p-6 shadow-sm">
            <h3>Recreational Classes (Open to All)</h3>
            <p className="mt-2 text-sm text-[#2E2A33]/70">
              For beginners through improvers who want to learn and progress in
              a fun, supportive environment.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[#2E2A33]/70">
              <li>Fundamentals, strength, flexibility, and coordination</li>
              <li>Confidence building and safe technique</li>
              <li>Clear progression with positive coaching</li>
            </ul>
            <a
              href="/book?type=recreational"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-[#143271] px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white"
            >
              Book Recreational Classes
            </a>
          </div>
          <div className="rounded-3xl border border-black/5 bg-[#111827] p-6 text-white shadow-sm">
            <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
              Entry is by coach invitation/assessment
            </div>
            <h3 className="mt-4">Competition Squad Training (Invite/Assessment Only)</h3>
            <p className="mt-2 text-sm text-white/70">
              Squad training is for gymnasts who demonstrate readiness,
              commitment, and safe technique over time.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li>Advanced skills, routines, and conditioning</li>
              <li>Performance focus and long-term development</li>
              <li>Discussed with parents when the time is right</li>
            </ul>
            <a
              href="#squad-faq"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#111827]"
            >
              How Squad Selection Works
            </a>
          </div>
        </div>
      </section>

      <section id="squad-faq" className="mt-12">
        <h2>How Squad Invitation Works</h2>
        <div className="mt-4 space-y-4">
          <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <h3>Can my child join the competition squad?</h3>
            <p className="mt-2 text-sm text-[#2E2A33]/70">
              Not directly. Coaches invite or assess gymnasts when they show the
              right readiness over time.
            </p>
          </div>
          <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <h3>What do coaches look for?</h3>
            <p className="mt-2 text-sm text-[#2E2A33]/70">
              Consistent fundamentals, safe technique, focus, enjoyment,
              attitude, and regular attendance.
            </p>
          </div>
          <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <h3>When could a gymnast be considered?</h3>
            <p className="mt-2 text-sm text-[#2E2A33]/70">
              It varies by gymnast. Coaches discuss the pathway with families
              when appropriate.
            </p>
          </div>
          <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <h3>Does every child need to compete?</h3>
            <p className="mt-2 text-sm text-[#2E2A33]/70">
              No. Recreational progression is valuable on its own and is the
              right path for many gymnasts.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2>Ready to get started?</h2>
            <p className="mt-2 text-sm text-[#2E2A33]/70">
              Not sure where to start? Book recreational and we will guide
              progression.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="/book?type=recreational"
              className="inline-flex items-center justify-center rounded-full bg-[#143271] px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white"
            >
              Book Recreational Classes
            </a>
            <a
              href="/contact"
              className="inline-flex items-center justify-center rounded-full border border-[#143271]/20 bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#143271]"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
