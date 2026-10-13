import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

import { FitLogo } from "@/components/FitLogo"
import { APP_VERSION } from "@/lib/version"

const OWNER = "Adnan Siddiqui"
const OWNER_EMAIL = "hello@adn-memos.com"
const EFFECTIVE = "13 October 2026"

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground [&_h3]:mt-2 [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:ml-4 [&_li]:list-disc">
        {children}
      </div>
    </section>
  )
}

/**
 * Ownership notice, Terms of Use and Privacy Policy. Not linked from anywhere
 * in the app — reachable only by typing the URL (#/legal).
 */
export default function LegalPage() {
  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-10">
        <header className="flex flex-col gap-4">
          <Link to="/" className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" /> Back to app
          </Link>
          <div className="flex items-center gap-3">
            <FitLogo size={32} />
            <div>
              <h1 className="text-xl font-semibold">Legal</h1>
              <p className="text-xs text-muted-foreground">
                FIT — Frontline Internal Tools · {APP_VERSION} · Effective {EFFECTIVE}
              </p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-4 text-sm">
            <a href="#/legal" onClick={(e) => { e.preventDefault(); document.getElementById("ownership")?.scrollIntoView() }} className="text-primary hover:underline">Ownership</a>
            <a href="#/legal" onClick={(e) => { e.preventDefault(); document.getElementById("terms")?.scrollIntoView() }} className="text-primary hover:underline">Terms of Use</a>
            <a href="#/legal" onClick={(e) => { e.preventDefault(); document.getElementById("privacy")?.scrollIntoView() }} className="text-primary hover:underline">Privacy Policy</a>
          </nav>
        </header>

        <Section id="ownership" title="Ownership & Intellectual Property">
          <p>
            FIT (Frontline Internal Tools, also referred to as “Frontline Tracker”), including its source code,
            database design, user interface, visual design, documentation and all associated materials (the
            “Software”), was designed and developed by <strong className="text-foreground">{OWNER}</strong> and is
            the sole intellectual property of {OWNER}.
          </p>
          <p>© 2026 {OWNER}. All rights reserved.</p>
          <p>
            The Software is made available to Frontline and its authorised personnel (the “Licensee”) under a
            non-exclusive, non-transferable, revocable licence to use it for the Licensee's internal business
            operations. No ownership of the Software is transferred by this licence, by its use, or by its hosting
            on any infrastructure.
          </p>
          <p>Without the prior written consent of {OWNER}, no person or organisation may:</p>
          <ul>
            <li>copy, modify, adapt, translate or create derivative works of the Software;</li>
            <li>sell, sublicense, rent, distribute or otherwise make the Software available to third parties;</li>
            <li>reverse-engineer, decompile or extract the source code or database design, except as permitted by law;</li>
            <li>remove or alter any ownership, copyright or attribution notice.</li>
          </ul>
          <p>
            Business data entered into the Software by the Licensee (project records, documents, delivery notes,
            visit reports and similar) belongs to the Licensee. The Software that stores and processes that data
            remains the property of {OWNER}.
          </p>
          <p>
            Licensing, ownership and permission enquiries: <span className="text-foreground">{OWNER_EMAIL}</span>
          </p>
        </Section>

        <Section id="terms" title="Terms of Use">
          <p>By signing in to or using the Software you agree to these terms.</p>
          <h3>1. Authorised use</h3>
          <p>
            Access is limited to people issued an account by an administrator. Accounts are personal — do not share
            your credentials. You must use the Software only for legitimate work purposes of the Licensee.
          </p>
          <h3>2. Your responsibilities</h3>
          <ul>
            <li>Keep the information you enter accurate and up to date.</li>
            <li>Upload only files you are entitled to share, and never malware or unlawful content.</li>
            <li>Do not attempt to access data, pages or functions beyond the permissions granted to you.</li>
            <li>Do not probe, overload or interfere with the Software or its hosting infrastructure.</li>
          </ul>
          <h3>3. Accounts and access</h3>
          <p>
            Administrators may grant, change, suspend or remove access at any time, including when a person leaves
            the organisation or breaches these terms.
          </p>
          <h3>4. Records and audit trail</h3>
          <p>
            The Software keeps an edit history of changes (who changed what, and when) to protect against data loss
            and to support accountability. These records are part of normal operation.
          </p>
          <h3>5. Availability and warranty</h3>
          <p>
            The Software is provided “as is” and “as available”, without warranties of any kind, express or implied,
            including fitness for a particular purpose. Users remain responsible for keeping official copies of
            contractual documents. To the maximum extent permitted by law, {OWNER} is not liable for indirect,
            incidental or consequential losses, or for loss of data or profits, arising from use of the Software.
          </p>
          <h3>6. Changes</h3>
          <p>
            These terms may be updated. The effective date above changes when they are; continued use after an
            update means you accept the revised terms.
          </p>
          <h3>7. Governing law</h3>
          <p>These terms are governed by the laws of the Kingdom of Saudi Arabia.</p>
        </Section>

        <Section id="privacy" title="Privacy Policy">
          <p>
            This policy explains what personal data the Software processes and why. The Licensee is responsible for
            the personal data its staff enter; {OWNER} operates the Software on the Licensee's behalf.
          </p>
          <h3>What we collect</h3>
          <ul>
            <li><strong className="text-foreground">Account data</strong> — username, name, role, team, page and project access.</li>
            <li><strong className="text-foreground">Profile details</strong> you or an administrator add — job title, department, phone, contact email, employee ID, location, photo.</li>
            <li><strong className="text-foreground">Activity records</strong> — the edit history of records you change, and when you were last active.</li>
            <li><strong className="text-foreground">Workforce records</strong> entered by managers — e.g. technician names, phone numbers, nationality and residency (Iqama) details used for scheduling and compliance.</li>
            <li><strong className="text-foreground">Files</strong> you upload — documents, signed delivery notes and visit reports, which may contain names and signatures.</li>
          </ul>
          <h3>Why</h3>
          <p>
            Solely to operate the Software for the Licensee's internal work: procurement, delivery, documentation,
            technician scheduling, SLA visits and support. Data is not sold, used for advertising or profiling, or
            shared with third parties except the hosting providers below.
          </p>
          <h3>Where it is stored</h3>
          <ul>
            <li>Database, authentication and files: Supabase (EU — Frankfurt region).</li>
            <li>Web application: GitHub Pages.</li>
            <li>Web fonts are loaded from Google Fonts, which receives your IP address when fonts load.</li>
          </ul>
          <p>
            Your browser stores a sign-in session and a few interface preferences (such as theme and sidebar state)
            in local storage. No advertising or analytics trackers are used.
          </p>
          <h3>Retention</h3>
          <p>
            Data is kept while it is needed for the Licensee's operations and records. Deleting an account stops
            access; records that account created or edited may be kept for audit purposes.
          </p>
          <h3>Your rights</h3>
          <p>
            Subject to applicable law, including the Saudi Personal Data Protection Law (PDPL), you may ask to
            access, correct or delete your personal data. Ask your administrator, or contact{" "}
            <span className="text-foreground">{OWNER_EMAIL}</span>.
          </p>
          <h3>Security</h3>
          <p>
            Access is restricted by account, role, project membership and database row-level security. Files are
            stored privately and served through short-lived signed links.
          </p>
        </Section>

        <footer className="border-t pt-6 text-xs text-muted-foreground">
          © 2026 {OWNER} · {OWNER_EMAIL}
        </footer>
      </div>
    </div>
  )
}
