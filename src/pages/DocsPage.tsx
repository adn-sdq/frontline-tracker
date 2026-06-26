import { useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowLeft,
  ChevronRight,
  Wifi,
  Cable,
  Volume2,
  Monitor,
  Radio,
  Wrench,
  Zap,
  Calculator,
  Cpu,
  SlidersHorizontal,
  Mic,
  Video,
  Building2,
  FileText,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FitLogo } from "@/components/FitLogo"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

// ── Content primitives ────────────────────────────────────────────────────────

function Heading({ children }: { children: React.ReactNode }) {
  return <h1 className="font-display text-3xl leading-tight tracking-tight text-foreground mb-2">{children}</h1>
}

function Lead({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground text-base mb-6 leading-relaxed">{children}</p>
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-xl tracking-tight mt-10 mb-3 pt-6 border-t">{children}</h2>
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold mt-6 mb-2">{children}</h3>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed mb-3 text-foreground/90">{children}</p>
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
      {children}
    </code>
  )
}

function Pre({ children }: { children: React.ReactNode }) {
  return (
    <pre className="my-4 overflow-x-auto rounded-lg border bg-muted p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap">
      {children}
    </pre>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 rounded-lg border-l-4 border-blue-500 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:bg-blue-950/40 dark:text-blue-200 leading-relaxed">
      {children}
    </div>
  )
}

function Warn({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 rounded-lg border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200 leading-relaxed">
      {children}
    </div>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 rounded-lg border-l-4 border-emerald-500 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 leading-relaxed">
      {children}
    </div>
  )
}

function Ul({ items }: { items: (string | React.ReactNode)[] }) {
  return (
    <ul className="my-3 space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm">
          <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" />
          <span className="text-foreground/90">{item}</span>
        </li>
      ))}
    </ul>
  )
}

function KV({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <div className="my-4 overflow-hidden rounded-lg border divide-y text-sm">
      {rows.map(([key, val]) => (
        <div key={key} className="flex gap-4 px-4 py-2.5">
          <span className="w-44 shrink-0 font-semibold">{key}</span>
          <span className="text-muted-foreground">{val}</span>
        </div>
      ))}
    </div>
  )
}

function Table({
  headers,
  rows,
}: {
  headers: string[]
  rows: (string | React.ReactNode)[][]
}) {
  return (
    <div className="my-4 overflow-x-auto rounded-lg border text-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-muted text-left">
            {headers.map((h) => (
              <th key={h} className="px-4 py-2.5 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-muted/40 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-muted-foreground">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Visual primitives (shadcn) ────────────────────────────────────────────────

/** Grid of headline numbers, each in its own card. */
function StatGrid({
  stats,
}: {
  stats: { value: string; label: string; sub?: string }[]
}) {
  return (
    <div className="my-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {stats.map((s) => (
        <Card key={s.label} className="gap-0 py-0">
          <CardContent className="px-4 py-3">
            <div className="font-display text-2xl tracking-tight text-primary tabular-nums">{s.value}</div>
            <div className="mt-0.5 text-xs font-medium">{s.label}</div>
            {s.sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{s.sub}</div>}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/** A boxed formula with optional explanation underneath. */
function Formula({
  expr,
  caption,
}: {
  expr: string
  caption?: React.ReactNode
}) {
  return (
    <Card className="my-4 gap-0 border-dashed py-0">
      <CardContent className="px-5 py-4">
        <div className="text-center font-mono text-base font-semibold tracking-tight">{expr}</div>
        {caption && (
          <div className="mt-2 text-center text-xs text-muted-foreground">{caption}</div>
        )}
      </CardContent>
    </Card>
  )
}

/** A labelled horizontal bar for visual comparisons (0–100 scale). */
function Bar({
  label,
  value,
  display,
}: {
  label: string
  value: number
  display?: string
}) {
  return (
    <div className="my-2.5">
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-mono text-xs text-muted-foreground">{display ?? `${value}%`}</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  )
}

/** A shadcn Alert callout. tone: note | warn | tip */
function Callout({
  tone = "note",
  title,
  children,
}: {
  tone?: "note" | "warn" | "tip"
  title?: string
  children: React.ReactNode
}) {
  const styles = {
    note: "border-blue-500/50 bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-500/40 [&>svg]:text-blue-600",
    warn: "border-amber-500/50 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-500/40 [&>svg]:text-amber-600",
    tip: "border-emerald-500/50 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-500/40 [&>svg]:text-emerald-600",
  }
  const labels = { note: "Note", warn: "Warning", tip: "Tip" }
  return (
    <Alert className={cn("my-4", styles[tone])}>
      <AlertTitle>{title ?? labels[tone]}</AlertTitle>
      <AlertDescription className="text-current/90">{children}</AlertDescription>
    </Alert>
  )
}

// ── Doc structure ─────────────────────────────────────────────────────────────

interface DocSection {
  id: string
  label: string
  icon: typeof Volume2
  pages: DocPage[]
}

interface DocPage {
  id: string
  label: string
  badge?: string
  content: React.ReactNode
}

const DOCS: DocSection[] = [
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "quick-reference",
    label: "Quick Reference",
    icon: Calculator,
    pages: [
      {
        id: "key-numbers",
        label: "Numbers worth memorising",
        badge: "Cheat sheet",
        content: (
          <>
            <Heading>Numbers worth memorising</Heading>
            <Lead>
              The figures every AV engineer should be able to recall on site without reaching
              for a datasheet. Skim this before a commissioning visit.
            </Lead>

            <H2>The headline numbers</H2>
            <StatGrid
              stats={[
                { value: "100 m", label: "Max Cat cable run", sub: "Ethernet & HDBaseT" },
                { value: "+4 dBu", label: "Pro line level", sub: "≈ 1.23 V RMS" },
                { value: "1U", label: "Rack unit", sub: "44.45 mm" },
                { value: "0.45", label: "Min STI-PA", sub: "EN 54 voice alarm" },
                { value: "≥ 10×", label: "Impedance bridging", sub: "load ÷ source" },
                { value: "−18 dBFS", label: "Digital headroom target", sub: "speech peaks" },
              ]}
            />

            <H2>Decibel rules of thumb</H2>
            <Table
              headers={["Change", "Power ratio", "Voltage ratio", "Perceived"]}
              rows={[
                ["+3 dB", "×2", "×1.41", "Just noticeable louder"],
                ["+6 dB", "×4", "×2", "Clearly louder"],
                ["+10 dB", "×10", "×3.16", "Roughly twice as loud"],
                ["−6 dB", "÷4", "÷2", "Distance doubled (free field)"],
              ]}
            />
            <Callout tone="tip">
              <strong>+3 dB doubles power, +6 dB doubles voltage.</strong> Mixing these two up
              is the single most common dB mistake on site. Power for amplifiers, voltage for
              signal levels.
            </Callout>

            <H2>Distance &amp; level</H2>
            <Formula
              expr="SPL₂ = SPL₁ − 20·log₁₀(d₂ / d₁)"
              caption="Inverse-square law — every doubling of distance loses 6 dB in a free field"
            />
            <Formula
              expr="Headroom = 0 dBFS − nominal operating level"
              caption="Target 18–20 dB of digital headroom above your nominal signal"
            />

            <H2>Codec efficiency (HD at equal quality)</H2>
            <P>
              Newer codecs hit the same picture quality at a lower bitrate — longer bar means
              more bandwidth needed for the same result.
            </P>
            <Bar label="MPEG-2" value={100} display="~10 Mbps" />
            <Bar label="H.264 / AVC" value={50} display="~5 Mbps" />
            <Bar label="H.265 / HEVC" value={28} display="~2.8 Mbps" />
            <Bar label="AV1" value={18} display="~1.8 Mbps" />

            <H2>Quick conversions</H2>
            <KV rows={[
              ["0 dBu", "0.775 V RMS"],
              ["0 dBV", "1.0 V RMS (= +2.2 dBu)"],
              ["+4 dBu", "1.23 V RMS (pro line level)"],
              ["−10 dBV", "0.316 V RMS (consumer line level)"],
              ["1 inch", "25.4 mm"],
              ["1U", "44.45 mm (1.75 in)"],
              ["19\" rack width", "482.6 mm (mounting 465 mm)"],
            ]} />
          </>
        ),
      },
      {
        id: "formulas",
        label: "Formulas & electrical math",
        content: (
          <>
            <Heading>Formulas &amp; electrical math</Heading>
            <Lead>
              The handful of equations that come up again and again in AV power, speaker, and
              level calculations.
            </Lead>

            <H2>Ohm's law</H2>
            <Formula expr="V = I × R" caption="Voltage = Current × Resistance" />
            <Formula expr="P = V × I = V² / R = I² × R" caption="Power, three equivalent forms" />
            <P>
              The power triangle is the workhorse for amplifier and cable calculations. If you
              know any two of voltage, current and resistance, you can find the rest — and from
              there, power.
            </P>

            <H2>Worked example — 100 V line current</H2>
            <Pre>{`Amplifier: 500 W on a 100 V line
I = P / V = 500 / 100 = 5 A

Cable: 100 m of 1.5 mm² (1.34 Ω one-way → 2.68 Ω loop)
Voltage drop = I × R = 5 × 2.68 = 13.4 V
% loss = 13.4 / 100 = 13.4%   ← too high, use thicker cable`}</Pre>
            <Callout tone="warn">
              Keep 100 V line cable loss under 10% (ideally under 5%). Over 10% and speakers at
              the far end of the run are audibly quieter than those near the amplifier.
            </Callout>

            <H2>Speaker power &amp; SPL</H2>
            <Formula
              expr="SPL = sensitivity + 10·log₁₀(P)"
              caption="Max SPL at 1 m = speaker sensitivity (dB @ 1W/1m) + 10·log₁₀(power in watts)"
            />
            <Pre>{`Speaker: 90 dB sensitivity, 100 W rated
Max SPL @ 1m = 90 + 10·log₁₀(100)
             = 90 + 20 = 110 dB SPL @ 1m

At the listener 4 m away:
110 − 20·log₁₀(4/1) = 110 − 12 = 98 dB SPL`}</Pre>

            <H2>dB from a ratio</H2>
            <Formula expr="dB = 20·log₁₀(V₂ / V₁)   (voltage)" />
            <Formula expr="dB = 10·log₁₀(P₂ / P₁)   (power)" />
          </>
        ),
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "av-fundamentals",
    label: "AV Fundamentals",
    icon: Volume2,
    pages: [
      {
        id: "signal-types",
        label: "Signal types & levels",
        content: (
          <>
            <Heading>Signal types & levels</Heading>
            <Lead>
              Understanding signal types is the foundation of any AV system. Getting
              levels wrong causes hum, distortion, or silence.
            </Lead>

            <H2>Analog vs Digital</H2>
            <P>
              Analog audio is a continuous voltage waveform. Digital audio is a series of
              samples (a snapshot of the voltage at a fixed interval). Most modern AV
              systems are hybrid — analog at the microphone and speaker, digital in between.
            </P>

            <H2>Balanced vs Unbalanced</H2>
            <P>
              A <strong>balanced</strong> signal carries the audio on two conductors (+ and −)
              plus a shield. The receiving device subtracts the two signals, which cancels any
              noise picked up along the cable (Common Mode Rejection). This is why professional
              audio uses XLR and TRS connectors.
            </P>
            <P>
              An <strong>unbalanced</strong> signal uses one conductor plus shield. Noise has
              nowhere to go — it adds directly to the signal. Limited to short runs (under ~3m)
              in noisy environments. RCA and TS (mono jack) connectors are unbalanced.
            </P>
            <Warn>
              Never run unbalanced audio alongside mains power cables. Even a short parallel
              run can induce 50 Hz hum that is very difficult to trace after the fact.
            </Warn>

            <H2>Signal level reference points</H2>
            <Table
              headers={["Level", "Typical use", "Nominal voltage", "Connector"]}
              rows={[
                ["Mic level", "Microphone output", "−60 to −40 dBu", "XLR (balanced)"],
                ["Line level (consumer)", "Home audio, phones", "−10 dBV (~316 mV)", "RCA, 3.5 mm"],
                ["Line level (pro)", "Mixing desks, DSPs, amplifier inputs", "+4 dBu (~1.23 V)", "XLR, TRS"],
                ["Speaker level", "Amplifier output to loudspeaker", "Volts to tens of volts", "Bare wire, Speakon"],
                ["100 V line", "PAVA distributed speaker systems", "Up to 100 V RMS", "Bare wire"],
              ]}
            />

            <H2>dBu vs dBV vs dBSPL vs dBFS</H2>
            <KV rows={[
              ["dBu", "Voltage relative to 0.775 V RMS. Standard for professional audio equipment. 0 dBu = 0.775 V."],
              ["dBV", "Voltage relative to 1 V RMS. Used in consumer equipment. 0 dBV = 1 V. Note: 0 dBV = +2.2 dBu."],
              ["dBSPL", "Sound pressure level in air. 0 dBSPL is the threshold of human hearing (~20 µPa). Normal speech ≈ 60–70 dBSPL."],
              ["dBFS", "Decibels relative to Full Scale — used in digital audio. 0 dBFS is the maximum digital level. Always negative in practice. Peak programme meters target −12 to −6 dBFS."],
            ]} />

            <H2>Impedance matching</H2>
            <P>
              In professional audio, <strong>bridging</strong> is the norm — the source
              impedance is much lower than the load impedance (typically 10:1 or more). This
              maximises voltage transfer. A microphone at 150 Ω drives a preamp input at 1500–
              3000 Ω. Mismatching causes level loss and frequency response changes.
            </P>
            <Note>
              The golden rule: output impedance should be at least 10× lower than input
              impedance. If a DSP output is 100 Ω, connect it to an amp input of ≥ 1000 Ω.
            </Note>
          </>
        ),
      },
      {
        id: "audio-basics",
        label: "Audio system basics",
        content: (
          <>
            <Heading>Audio system basics</Heading>
            <Lead>
              The signal chain from microphone to loudspeaker — and where things go wrong.
            </Lead>

            <H2>Typical signal chain</H2>
            <Pre>{`Microphone
  → Preamplifier (gain stage)
  → Mixing console / DSP
  → Amplifier
  → Loudspeaker`}</Pre>
            <P>
              In modern systems the mixing console and DSP are often combined (e.g. Biamp
              Tesira, QSC Q-SYS). The DSP handles: EQ, compression, limiting, delay alignment,
              crossover, feedback suppression, and zone routing.
            </P>

            <H2>Gain structure</H2>
            <P>
              Gain structure means setting the gain at each stage so the signal is always
              well above the noise floor but never clips. Each stage has a headroom window.
            </P>
            <Ul items={[
              "Set mic preamp gain so speech peaks hit around −18 dBFS on the channel meter",
              "Set the mix bus so programme material peaks around −12 to −6 dBFS",
              "Set the amplifier sensitivity so the DSP output at 0 dBu drives the amplifier to full rated power — don't rely on the amp's volume knob",
              "A clipping amplifier will destroy tweeters almost instantly",
            ]} />
            <Warn>
              More gain earlier is not better — it amplifies noise too. The preamp is the
              most critical gain stage; everything after is downstream.
            </Warn>

            <H2>Amplifier ratings</H2>
            <P>
              Amplifier power is specified in Watts into a load impedance. A 500 W / 8 Ω
              amplifier does not deliver 500 W into 4 Ω — it may deliver more (if the
              power supply can handle it) but may also overheat. Always check the
              amplifier's power table across impedances.
            </P>
            <KV rows={[
              ["RMS power", "Continuous power the amplifier can sustain — the only meaningful spec"],
              ["Peak power", "Marketing number — ignore it"],
              ["THD+N", "Total Harmonic Distortion + Noise at rated power. < 0.1% is good for speech; < 0.05% for music"],
              ["SNR", "Signal-to-noise ratio. > 100 dB is excellent; < 90 dB will be audible in quiet rooms"],
              ["Damping factor", "Output impedance relative to load. Higher = better speaker control. > 100 is adequate"],
            ]} />

            <H2>Loudspeaker sensitivity</H2>
            <P>
              Speaker sensitivity is measured as dBSPL at 1 metre with 1 W input (1 W / 1 m).
              A speaker rated 90 dBSPL / 1W / 1m will produce 90 dBSPL at 1 metre when driven
              with 1 watt. Every doubling of power adds 3 dB. Every doubling of distance
              subtracts 6 dB (inverse square law in free field).
            </P>
            <Pre>{`90 dBSPL at 1m with 1W
93 dBSPL at 1m with 2W
96 dBSPL at 1m with 4W
...
90 dBSPL at 2m with 4W  (6 dB loss × distance doubling)`}</Pre>

            <H2>Feedback</H2>
            <P>
              Acoustic feedback (the howl) occurs when the microphone picks up the speaker
              output and the loop gain exceeds 1 (0 dB) at any frequency. Prevention:
            </P>
            <Ul items={[
              "Physical: point microphones away from speakers; use directional (cardioid) mics",
              "Acoustic: reduce speaker SPL or mic sensitivity",
              "Electronic: use a parametric or graphic EQ to notch the feedback frequencies; or use an automatic feedback suppressor (e.g. Shure FeedbackExterminator, Biamp AFS)",
              "The 'ring-down' method: raise the master gain until feedback begins, note the frequency on an RTA, cut it 3–6 dB with a narrow parametric — repeat until the system is stable at the required gain",
            ]} />
          </>
        ),
      },
      {
        id: "video-basics",
        label: "Video & display basics",
        content: (
          <>
            <Heading>Video & display basics</Heading>
            <Lead>Resolution, refresh rate, signal formats, and how to move video around a building.</Lead>

            <H2>Resolution reference</H2>
            <Table
              headers={["Name", "Resolution", "Pixel count", "Common use"]}
              rows={[
                ["HD / 1080p", "1920 × 1080", "2.1 MP", "Presentation, IPTV, standard displays"],
                ["4K UHD", "3840 × 2160", "8.3 MP", "Large displays, LED walls, executive rooms"],
                ["4K DCI", "4096 × 2160", "8.8 MP", "Cinema projection"],
                ["8K", "7680 × 4320", "33 MP", "Specialist large-format only"],
              ]}
            />

            <H2>Refresh rate</H2>
            <P>
              Refresh rate (Hz) is how many frames per second the display redraws. 60 Hz is
              the standard for AV. 50 Hz is used in PAL regions (Europe, Middle East). Mixing
              50 Hz and 60 Hz content on the same display causes judder. Lock all sources to
              the same rate for a given region.
            </P>

            <H2>Video connector types</H2>
            <KV rows={[
              ["HDMI 1.4", "Up to 4K @ 30 Hz. Audio return channel (ARC). Most common legacy connector."],
              ["HDMI 2.0", "Up to 4K @ 60 Hz, 18 Gbps bandwidth. Current standard for most AV systems."],
              ["HDMI 2.1", "Up to 8K @ 60 Hz, 48 Gbps. Required for gaming at 4K 120 Hz."],
              ["DisplayPort 1.4", "Up to 8K @ 60 Hz. Common on PC graphics cards and professional monitors."],
              ["USB-C / Thunderbolt 4", "Carries DP 1.4 + USB + power on one cable. Common on laptops."],
              ["SDI (BNC)", "Serial Digital Interface. Broadcast standard — very robust over long coax runs. 3G-SDI = 1080p; 12G-SDI = 4K."],
              ["VGA / DVI", "Legacy. No new installations. VGA is analogue; DVI can be digital or analogue."],
            ]} />

            <H2>HDBaseT</H2>
            <P>
              HDBaseT extends HDMI up to 100 m over a single Cat 6A cable. It also carries
              power (PoE), RS-232 control, IR, and USB on the same cable. This makes it the
              standard for boardroom and classroom AV distribution over copper.
            </P>
            <Ul items={[
              "Maximum cable run: 100 m on Cat 6A (slightly less on Cat 6 due to higher attenuation)",
              "No active extenders needed within 100 m — the HDBaseT chipset handles it",
              "Use shielded Cat 6A (S/FTP) for best results, especially in electrically noisy environments",
              "HDCP (copy protection) must be supported end-to-end — the weakest link sets the limit",
            ]} />

            <H2>AV over IP vs matrix switcher</H2>
            <P>
              Traditional AV uses a <strong>matrix switcher</strong> — a physical box where
              any input can be routed to any output. Scaling it means buying a bigger box.
            </P>
            <P>
              <strong>AV over IP</strong> encodes video as IP packets and sends them over a
              managed network switch. Any encoder can reach any decoder. Common systems:
              Crestron DM NVX (the system used at MiSK Ilmi), Extron NAV, ZeeVee, SDVoE.
            </P>
            <KV rows={[
              ["Encoder", "Accepts HDMI/DP input, compresses video, sends UDP packets over the network"],
              ["Decoder", "Receives packets, decompresses, outputs HDMI to a display"],
              ["Multicast", "One encoder stream delivered to many decoders simultaneously — essential for video walls and duplicate displays"],
              ["Unicast", "One encoder → one decoder only. Use when source content differs per room."],
              ["Latency", "Typically 0–1 frame (16–33 ms at 60 Hz). Zero-latency systems use lossless compression at higher bandwidth."],
            ]} />
            <Note>
              AV over IP requires a properly configured network: dedicated VLAN, IGMP snooping
              enabled on the switch, sufficient bandwidth (1 Gbps per HD stream for lossless;
              100–200 Mbps for compressed). Never put AV-over-IP traffic on the general data
              network without VLAN isolation.
            </Note>
          </>
        ),
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "networking",
    label: "Networking",
    icon: Wifi,
    pages: [
      {
        id: "ip-basics",
        label: "IP addressing & subnets",
        content: (
          <>
            <Heading>IP addressing & subnets</Heading>
            <Lead>
              Modern AV systems are IP systems. You must be able to read and assign
              addresses without relying on IT every time.
            </Lead>

            <H2>IPv4 address structure</H2>
            <P>
              An IPv4 address is 32 bits written as four octets: <Code>192.168.1.100</Code>.
              Every device on a network needs a unique IP address within its subnet.
            </P>

            <H2>Subnet mask & CIDR</H2>
            <P>
              The subnet mask determines which part of the address is the network and which
              is the host. CIDR notation (e.g. <Code>/24</Code>) is a shorthand for the
              number of network bits.
            </P>
            <Table
              headers={["CIDR", "Subnet mask", "Hosts per subnet", "Typical use"]}
              rows={[
                ["/24", "255.255.255.0", "254", "Standard office subnet — up to 254 devices"],
                ["/25", "255.255.255.128", "126", "Split a /24 into two — separate AV from data"],
                ["/16", "255.255.0.0", "65 534", "Large campus — rare in practice for a single VLAN"],
                ["/30", "255.255.255.252", "2", "Point-to-point link between two routers"],
              ]}
            />
            <P>
              To find the network address: AND the IP with the mask. For <Code>192.168.1.100/24</Code>:
              network is <Code>192.168.1.0</Code>, broadcast is <Code>192.168.1.255</Code>,
              usable hosts are <Code>192.168.1.1</Code> – <Code>192.168.1.254</Code>.
            </P>

            <H2>Private address ranges</H2>
            <KV rows={[
              ["10.0.0.0/8", "Class A private — 16 million hosts. Common in large enterprises."],
              ["172.16.0.0/12", "Class B private — 1 million hosts. Less common."],
              ["192.168.0.0/16", "Class C private — 65 534 hosts. Common in smaller networks and home use."],
              ["169.254.0.0/16", "APIPA — auto-assigned when DHCP fails. If a device shows 169.254.x.x, DHCP is not working."],
            ]} />

            <H2>Static vs DHCP</H2>
            <P>
              AV devices should almost always have <strong>static IPs</strong> — or at
              minimum a DHCP reservation (fixed IP assigned by MAC address on the DHCP
              server). Dynamic IPs change and will break control system presets.
            </P>
            <Tip>
              Agree an IP addressing plan before site installation. Reserve a range for AV
              (e.g. <Code>10.10.20.50–10.10.20.200</Code>) and document every device.
              This is the single most time-saving thing you can do during commissioning.
            </Tip>

            <H2>Default gateway & DNS</H2>
            <P>
              The <strong>default gateway</strong> is the router's IP — the device sends traffic
              here when the destination is outside the local subnet. AV devices often need a
              gateway only if they need to reach the internet (firmware updates, cloud services).
              Otherwise they can work with just an IP and mask.
            </P>
            <P>
              <strong>DNS</strong> translates domain names to IPs. Required only if devices
              are addressed by hostname. Most AV control is done by IP — DNS is rarely needed
              on the AV VLAN itself.
            </P>
          </>
        ),
      },
      {
        id: "vlans-switching",
        label: "VLANs & switching",
        content: (
          <>
            <Heading>VLANs & switching</Heading>
            <Lead>
              VLANs logically separate traffic on the same physical switch — critical for
              AV over IP and IPTV systems.
            </Lead>

            <H2>What a VLAN does</H2>
            <P>
              A VLAN (Virtual LAN) tags each Ethernet frame with a VLAN ID (1–4094). The
              switch only forwards frames to ports in the same VLAN. This gives you separate
              broadcast domains without separate physical switches.
            </P>
            <Ul items={[
              "AV traffic (multicast video streams) is kept off the data network",
              "IPTV multicast stays within the IPTV VLAN and does not flood the rest of the network",
              "Security: AV encoders and decoders cannot reach the corporate file servers",
              "QoS can be applied per-VLAN to prioritise audio/video over file transfers",
            ]} />

            <H2>Access vs trunk ports</H2>
            <KV rows={[
              ["Access port", "Carries traffic for one VLAN only. End device (encoder, decoder, IP camera) connects here. The device itself does not need to know about VLANs."],
              ["Trunk port", "Carries multiple VLANs tagged with 802.1Q headers. Used between switches, and between switches and routers. The native VLAN (usually VLAN 1) is sent untagged."],
            ]} />

            <H2>IGMP snooping</H2>
            <P>
              Multicast streams (used in IPTV and AV over IP) are sent to a multicast group
              address (224.0.0.0 – 239.255.255.255). Without IGMP snooping, the switch floods
              multicast to every port on the VLAN — saturating links that don't need the stream.
            </P>
            <P>
              With <strong>IGMP snooping</strong> enabled, the switch listens to IGMP join/leave
              messages from decoders and only forwards the multicast stream to ports that have
              devices subscribed to it.
            </P>
            <Warn>
              IGMP snooping must be enabled on every switch in the path. One switch without it
              will flood all multicast to all ports on that switch, causing bandwidth problems.
              Verify this with the network/IT team before commissioning.
            </Warn>

            <H2>Bandwidth planning</H2>
            <Table
              headers={["Stream type", "Bitrate per stream", "Notes"]}
              rows={[
                ["IPTV (H.264 HD)", "4–8 Mbps", "Typical broadcast IPTV at 1080p"],
                ["IPTV (H.265 HD)", "2–4 Mbps", "Better compression, same quality"],
                ["AV over IP (compressed)", "100–500 Mbps", "Crestron DM NVX, Extron NAV"],
                ["AV over IP (lossless)", "Up to 10 Gbps", "SDVoE — requires 10G switching"],
                ["Dante audio", "< 1 Mbps", "Negligible even with many channels"],
                ["AES67 audio (64ch)", "~100 Mbps", "Broadcast audio-over-IP"],
              ]}
            />
            <Note>
              A 1 Gbps switch port can handle approximately 5–10 compressed 4K streams or
              ~100 HD IPTV streams. The switch's backplane (switching capacity) must be
              non-blocking — check that the total backplane capacity exceeds the sum of all
              port speeds.
            </Note>
          </>
        ),
      },
      {
        id: "poe",
        label: "Power over Ethernet (PoE)",
        content: (
          <>
            <Heading>Power over Ethernet (PoE)</Heading>
            <Lead>
              PoE delivers DC power over Cat cable alongside data — eliminating the need for
              a separate power supply for endpoints.
            </Lead>

            <H2>PoE standards</H2>
            <Table
              headers={["Standard", "IEEE", "Max power at device", "Common use"]}
              rows={[
                ["PoE", "802.3af", "12.95 W", "IP phones, basic cameras"],
                ["PoE+", "802.3at", "25.5 W", "PTZ cameras, AV over IP encoders/decoders, access points"],
                ["PoE++  (Type 3)", "802.3bt", "51 W", "High-power APs, video conferencing cameras, thin clients"],
                ["PoE++  (Type 4)", "802.3bt", "71.3 W", "Digital signage players, outdoor cameras with heaters"],
                ["HDBaseT PoH", "HDBaseT", "Up to 100 W", "Proprietary — powers displays over HDBaseT cable"],
              ]}
            />

            <H2>PoE budget</H2>
            <P>
              A PoE switch has a total power budget (e.g. 370 W for a 24-port switch). This
              is shared across all powered ports. At 25.5 W per port you can only fully power
              ~14 devices on a 370 W switch even if it has 24 ports.
            </P>
            <Tip>
              Add up the power draw of every PoE device before specifying the switch. Add 20%
              headroom. Note that devices rarely draw their full rated maximum — check the
              actual typical power draw in the datasheet.
            </Tip>

            <H2>Cable requirements for PoE</H2>
            <Ul items={[
              "Cat 5e minimum — but Cat 6A is strongly recommended for PoE++ to manage heat and resistance",
              "Longer cable runs increase resistance and voltage drop — at 100 m on Cat 5e, you lose ~3–5 W compared to a 10 m run",
              "Use shielded cable (S/FTP) in bundled runs — heat dissipation in bundles is a real concern for PoE",
              "Patch panels can introduce resistance — avoid cheap unrated keystone jacks on PoE++ circuits",
            ]} />
          </>
        ),
      },
      {
        id: "av-over-ip",
        label: "Audio over IP (Dante / AES67)",
        content: (
          <>
            <Heading>Audio over IP — Dante & AES67</Heading>
            <Lead>
              Dante is the dominant audio networking protocol in professional AV. AES67 is
              the interoperability standard. Understanding both is essential on modern systems.
            </Lead>

            <H2>What Dante does</H2>
            <P>
              Dante (by Audinate) replaces multicore analogue snake cables with a standard
              Ethernet network. Each Dante device appears on the network with a name and
              advertises its available audio channels. Routing is done in software (Dante
              Controller) — drag transmit channels to receive channels.
            </P>
            <Ul items={[
              "Up to 512 channels per device (hardware-dependent)",
              "Latency as low as 150 µs on a dedicated gigabit switch — imperceptible",
              "Clock synchronisation via PTPv2 (IEEE 1588) — all devices lock to a single master clock",
              "Supports redundant networks — secondary NIC provides failover in < 1 ms",
            ]} />

            <H2>Dante network requirements</H2>
            <Ul items={[
              "Dedicated gigabit switch — or a VLAN with gigabit uplinks",
              "IGMP snooping enabled",
              "No QoS required on a dedicated Dante network (it's the only traffic)",
              "If sharing with data: enable QoS with DSCP EF (46) for Dante audio and PTP traffic",
              "No NAT — all Dante devices must be on the same Layer 2 broadcast domain",
              "PTP (IEEE 1588) multicast must not be blocked — 224.0.1.129",
            ]} />

            <H2>AES67</H2>
            <P>
              AES67 is an IETF/AES standard for high-performance audio-over-IP
              interoperability. Dante devices can be put into AES67 mode to communicate with
              non-Dante devices (Ravenna, Livewire+, SILK). Biamp Tesira, QSC Q-SYS, and
              Yamaha ProVisionaire all support AES67.
            </P>
            <Note>
              When Dante is in AES67 mode it cannot discover other Dante devices via mDNS —
              routing must be configured manually using SAP or static multicast addresses.
              Most integrators avoid this unless cross-manufacturer interop is explicitly required.
            </Note>

            <H2>Common Dante architecture at MiSK Ilmi scale</H2>
            <Pre>{`Shure MXA910 (ceiling array mic)  →  Dante
Biamp TesiraFORTÉ (DSP)           →  Dante
QSC CX-Q (amplifier)              →  Dante
Shure ULXD (wireless receiver)    →  Dante
Crestron DM-NVX (encoder)         →  Dante (audio embedding into HDMI)

All connected to a dedicated Dante VLAN on the AV switch.
Routing configured in Dante Controller software.`}</Pre>
          </>
        ),
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "cabling",
    label: "Cabling",
    icon: Cable,
    pages: [
      {
        id: "structured-cabling",
        label: "Structured cabling",
        content: (
          <>
            <Heading>Structured cabling</Heading>
            <Lead>
              The physical infrastructure that carries data, AV, and power. Getting this
              right during construction prevents years of problems.
            </Lead>

            <H2>Cat cable categories</H2>
            <Table
              headers={["Category", "Max bandwidth", "Max distance", "Use in AV"]}
              rows={[
                ["Cat 5e", "1 Gbps", "100 m", "Legacy — avoid for new installs"],
                ["Cat 6", "1 Gbps (10G up to 55 m)", "100 m", "Acceptable for PoE+; not ideal for PoE++"],
                ["Cat 6A", "10 Gbps", "100 m", "Recommended — handles PoE++, HDBaseT, AV over IP"],
                ["Cat 7", "10 Gbps", "100 m", "Shielded — not an officially recognised TIA standard; use Cat 6A instead"],
                ["Cat 8", "25/40 Gbps", "30 m", "Data centre only — too stiff for in-wall runs"],
              ]}
            />

            <H2>UTP vs STP vs S/FTP</H2>
            <KV rows={[
              ["UTP (Unshielded)", "No shielding. Fine for data. Susceptible to EMI in noisy environments (near motors, lighting dimmers, transformers)."],
              ["STP (Shielded)", "Overall foil or braid shield. Better EMI immunity. Requires proper grounding at one end — grounding both ends creates a ground loop."],
              ["S/FTP (Screened, Foil each pair)", "Each pair individually shielded plus overall shield. Best EMI immunity. Mandatory near high-power electrical infrastructure."],
              ["F/UTP", "Overall foil, unshielded pairs. Common compromise for Cat 6A — good enough for most AV installations."],
            ]} />
            <Warn>
              Shielded cable grounded at both ends creates a ground loop — an antenna for
              mains-frequency noise. Always ground the shield at one end only (typically the
              equipment room end).
            </Warn>

            <H2>Cable bend radius & pulling tension</H2>
            <Ul items={[
              "Minimum bend radius: 4× the cable outer diameter (OD) during installation; 8× at rest",
              "Cat 6A OD ≈ 7–8 mm → minimum bend radius ≈ 56–64 mm during pulling",
              "Maximum pull tension for Cat 6A: 110 N (25 lbf). Exceeding this stretches the pairs and permanently degrades performance",
              "Never staple cable — use proper P-clips. Staples deform the jacket and crush pairs",
              "Leave a service loop at each end: 1 m at the outlet, 3–5 m in the equipment room",
            ]} />

            <H2>Testing</H2>
            <P>
              All structured cabling should be tested with a certified cable tester (Fluke
              DSX, Ideal Signaltek) and the results saved. At minimum test for:
            </P>
            <Ul items={[
              "Wire map (correct pinout, no opens, shorts, or crossed pairs)",
              "Length (must not exceed 100 m channel length including patch cables)",
              "NEXT (Near End Crosstalk) — noise from adjacent pairs",
              "Insertion loss — signal attenuation along the cable",
              "Return loss — reflections from impedance discontinuities",
              "For Cat 6A: alien crosstalk (ANEXT) — noise from adjacent cables in the same bundle",
            ]} />
            <Tip>
              Always test before ceiling tiles go in. Discovering a failed run after finish
              works means a full remediation programme — cutting ceilings, pulling new cable,
              repatching, re-testing. The test takes 30 seconds per run. Do it.
            </Tip>
          </>
        ),
      },
      {
        id: "speaker-cable",
        label: "Speaker cable",
        content: (
          <>
            <Heading>Speaker cable</Heading>
            <Lead>
              Speaker cable carries high-current, low-impedance (4–16 Ω) or high-voltage
              (70 V / 100 V) signals. Wire gauge matters.
            </Lead>

            <H2>Low-impedance (direct drive) systems</H2>
            <P>
              Direct-drive systems connect a loudspeaker directly to an amplifier at its
              nominal impedance (4, 8, or 16 Ω). Common in boardrooms and auditoriums with
              a small number of high-quality speakers.
            </P>
            <P>
              Cable resistance adds in series with the speaker — this reduces power delivery
              and changes the damping factor, affecting bass control. The resistance of the
              cable should be less than 5% of the speaker impedance.
            </P>
            <Table
              headers={["AWG", "Ω per 100 m (1 way)", "Max run @ 8 Ω (5% rule)", "Max run @ 4 Ω"]}
              rows={[
                ["12 AWG (4 mm²)", "0.53 Ω", "75 m", "37 m"],
                ["14 AWG (2.5 mm²)", "0.84 Ω", "47 m", "23 m"],
                ["16 AWG (1.5 mm²)", "1.34 Ω", "29 m", "14 m"],
                ["18 AWG (0.75 mm²)", "2.14 Ω", "18 m", "9 m"],
              ]}
            />
            <Note>
              Resistance is per conductor, so the total loop resistance is doubled (out + return).
              The table above shows one-way distance — halve it for return loop calculations
              if using the 5% rule.
            </Note>

            <H2>100 V line (distributed audio)</H2>
            <P>
              100 V line (also called 70 V in the US) is used in PAVA and background music
              systems where many speakers must be distributed over long cable runs. The
              amplifier steps the voltage up to 100 V RMS; each speaker has a transformer
              that steps it back down to drive the loudspeaker element.
            </P>
            <P>
              <strong>The key benefit:</strong> high voltage = low current = low cable losses
              over long distances with thin cable. Ohm's law: <Code>P = V²/R</Code>, so for
              a fixed power, higher voltage means lower current.
            </P>
            <H3>Tapping</H3>
            <P>
              Each speaker transformer has multiple winding taps (e.g. 1 W, 2 W, 4 W, 8 W).
              The tap sets how much power that speaker takes from the 100 V line. The sum of
              all speaker tap powers must not exceed the amplifier's rated output.
            </P>
            <Pre>{`Example:
Amplifier: 240 W / 100 V
Speakers: 40 × ceiling speakers each tapped at 4 W
Total load: 40 × 4 W = 160 W ← within 240 W limit ✓

Cable loss calculation:
I = P / V = 240 W / 100 V = 2.4 A
Cable resistance (e.g. 100 m of 1.5 mm²) = 1.34 Ω × 2 = 2.68 Ω
Voltage drop = I × R = 2.4 × 2.68 = 6.4 V
% loss = 6.4 / 100 = 6.4% → acceptable (< 10%)`}</Pre>
            <Warn>
              Never exceed 100% of the amplifier's rated load on a 100 V line. Overloading
              causes clipping, which is a square wave — full of harmonics that destroy
              speaker transformers.
            </Warn>
          </>
        ),
      },
      {
        id: "av-cables",
        label: "AV signal cables",
        content: (
          <>
            <Heading>AV signal cables</Heading>
            <Lead>Microphone, line-level, video, and fibre — types, specifications, and when to use each.</Lead>

            <H2>Microphone cable (XLR)</H2>
            <P>
              Standard XLR is a 3-pin balanced connector: Pin 1 = ground/shield,
              Pin 2 = positive (hot), Pin 3 = negative (cold). The balanced line rejects
              common-mode interference.
            </P>
            <Ul items={[
              "Standard professional mic cable: 2 conductors + shield, typically 22–24 AWG",
              "Low capacitance cable (< 100 pF/m) preserves high-frequency response over long runs",
              "Maximum practical run for a low-output dynamic mic: 50–100 m. Condenser mics with active electronics can go further",
              "Always use a star quad cable (4 conductors wound together, pairs cross-connected) for critical long runs — provides 20–30 dB more CMRR than standard 2-conductor mic cable",
            ]} />

            <H2>HDMI</H2>
            <P>
              HDMI cables are rated by bandwidth, not version. Look for Premium High Speed
              HDMI (18 Gbps, supports 4K@60 Hz) or Ultra High Speed HDMI (48 Gbps, supports
              8K). Cable quality matters — cheap cables may pass 1080p fine but fail at 4K.
            </P>
            <Ul items={[
              "Maximum passive cable length: ~10–15 m for 4K@60 Hz (dependent on cable quality)",
              "Beyond 15 m: use active HDMI cable, HDMI extender over fibre, or switch to HDBaseT",
              "Never exceed the rated length for a passive cable and expect it to work reliably",
              "Test cables with actual signal at 4K@60 Hz 4:4:4 — some cables will pass 4:2:0 but fail at 4:4:4",
            ]} />

            <H2>Fibre optic</H2>
            <P>
              Fibre carries light instead of electricity — immune to EMI, no ground loops,
              very long runs. Used for backbone data runs and video extension (HDMI over fibre
              extenders, SDI over fibre).
            </P>
            <Table
              headers={["Type", "Core", "Bandwidth", "Max distance", "Use"]}
              rows={[
                ["OM3 Multimode", "50 µm", "10 Gbps", "300 m", "Short data centre runs"],
                ["OM4 Multimode", "50 µm", "10 Gbps", "400 m", "Building backbone"],
                ["OS2 Singlemode", "9 µm", "100 Gbps+", "10+ km", "Campus backbone, inter-building"],
              ]}
            />
            <Warn>
              Multimode and singlemode fibre are physically incompatible — the transceivers
              are different. Mixing them gives no signal. Check the SFP (transceiver) spec
              matches the fibre type before ordering.
            </Warn>

            <H2>Coaxial cable</H2>
            <P>
              Coaxial cable (coax) has a centre conductor surrounded by a dielectric and a
              braided or foil shield. Used for SDI video (BNC connector), RF antenna feeds,
              and satellite.
            </P>
            <KV rows={[
              ["RG-6", "75 Ω. Standard for IPTV/satellite distribution and CCTV. Up to ~100 m for HD-SDI."],
              ["RG-59", "75 Ω. Thinner than RG-6 — higher loss. Legacy CCTV. Avoid for new installs."],
              ["RG-58", "50 Ω. Older data networks (10BASE2). Not used in AV."],
              ["LMR-400", "50 Ω. Low-loss. Used for long antenna feeder runs on wireless microphone systems."],
            ]} />
            <Tip>
              BNC connectors must be correctly terminated — a poorly crimped BNC causes
              signal reflections that appear as sparkling artefacts on SDI video. Use a
              proper crimp tool and verify with a cable tester or signal analyser.
            </Tip>
          </>
        ),
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "pava",
    label: "PAVA Systems",
    icon: Radio,
    pages: [
      {
        id: "pava-basics",
        label: "PAVA fundamentals",
        content: (
          <>
            <Heading>PAVA fundamentals</Heading>
            <Lead>
              Public Address & Voice Alarm (PAVA) systems provide background music,
              announcements, and — critically — emergency voice evacuation. The life-safety
              requirement drives the entire design.
            </Lead>

            <H2>EN54 — the life safety standard</H2>
            <P>
              In Saudi Arabia and most international projects, PAVA systems for life safety
              must comply with <strong>EN 54-16</strong> (voice alarm control and indicating
              equipment) and <strong>EN 54-24</strong> (loudspeakers for voice alarm systems).
              Non-compliant equipment cannot be used for the evacuation function.
            </P>
            <Ul items={[
              "EN 54-16: covers the controller — fault monitoring, priority, battery backup (72 hr standby + 30 min full alarm)",
              "EN 54-24: covers the loudspeakers — intelligibility (Speech Transmission Index ≥ 0.45 STI-PA), power handling, and fire resistance",
              "The system must generate an audible fault indication within 100 seconds of a fault occurring",
              "Evacuation signal must take priority over all other audio — the controller enforces this in hardware",
            ]} />

            <H2>System architecture</H2>
            <Pre>{`PRAESENSA / Bosch controller (EN54-16 certified)
  ├── Zone amplifiers
  │   ├── Zone 1: Basement Parking   (ceiling speakers, weatherproof)
  │   ├── Zone 2: Level 1 Corridor   (ceiling speakers)
  │   ├── Zone 3: Level 1 Offices    (low-profile ceiling speakers)
  │   └── Zone 4: Outdoor Terrace    (IP-rated outdoor speakers)
  ├── Emergency microphone panel
  ├── Background music input
  └── Fire alarm interface (dry contact → trigger evacuation)`}</Pre>

            <H2>Zones</H2>
            <P>
              A zone is a group of speakers that can be addressed independently. Zones are
              defined by physical location and function: a car park is one zone; a floor of
              offices may be split into multiple zones for staged evacuation.
            </P>
            <Ul items={[
              "Zone wiring is typically a supervised loop — the controller monitors for open and short circuits",
              "A fault in one zone must not affect other zones",
              "Zone amplifiers may be centralised (all in the main equipment room) or distributed (one per floor)",
              "Document the zone matrix (which speakers are in which zone) and get it signed off before commissioning",
            ]} />

            <H2>Speech intelligibility (STI)</H2>
            <P>
              For a voice alarm to be effective, speech must be intelligible. STI
              (Speech Transmission Index) is measured on a scale of 0–1:
            </P>
            <Table
              headers={["STI value", "Intelligibility", "Application"]}
              rows={[
                ["0.75–1.0", "Excellent", "Boardroom, conference, control room"],
                ["0.60–0.75", "Good", "Typical office, retail — BGM + PA"],
                ["0.45–0.60", "Fair", "Minimum for EN 54 voice alarm"],
                ["< 0.45", "Poor", "Fails EN 54 — system must be redesigned"],
              ]}
            />
            <P>
              STI is affected by reverberation, background noise, and frequency response.
              Highly reverberant spaces (marble floors, glass walls) are the most challenging.
              Directional speakers, electronic delay, and bass roll-off all help.
            </P>
            <Tip>
              Model STI in simulation software (EASE, ODEON) before installation. On large
              projects, installing speakers and then discovering the STI fails is extremely
              expensive to rectify.
            </Tip>
          </>
        ),
      },
      {
        id: "pava-wiring",
        label: "Wiring & fault monitoring",
        content: (
          <>
            <Heading>PAVA wiring & fault monitoring</Heading>
            <Lead>
              EN54 requires the wiring to be supervised — every open circuit and short circuit
              must be detected and reported within 100 seconds.
            </Lead>

            <H2>End-of-line resistor (EOLR)</H2>
            <P>
              A resistor is placed at the far end of each speaker circuit. The controller
              passes a small monitoring current through the circuit and measures the return
              resistance. An open circuit (broken cable) removes the EOLR from the circuit;
              a short circuit bypasses it. Both conditions change the measured resistance and
              trigger a fault.
            </P>
            <Pre>{`Controller → Cable → Speaker 1 → Speaker 2 → Speaker 3 → [EOLR] → return`}</Pre>

            <H2>Short-circuit isolators</H2>
            <P>
              On Class A (loop) wiring, short-circuit isolators (SCI) are placed between
              every speaker or every group of speakers. If a cable short occurs, the SCIs
              on either side isolate the fault, allowing the rest of the loop to continue
              operating. This is required for evacuation systems in large buildings.
            </P>

            <H2>Fire-resistant cabling</H2>
            <P>
              EN54 requires speaker circuits to maintain circuit integrity during a fire.
              This means using fire-resistant cable (FP200 or equivalent, typically rated to
              maintain function for 60–120 minutes at 830°C). Standard PVC cable is not
              acceptable for the speaker wiring in an EN54 system.
            </P>
            <Warn>
              Fire-resistant cable is stiffer and harder to install. Factor this into the
              installation programme. Also note that fire-resistant cable must be supported
              at reduced intervals to prevent sagging — check the manufacturer's fixing
              specifications.
            </Warn>
          </>
        ),
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "iptv",
    label: "IPTV",
    icon: Monitor,
    pages: [
      {
        id: "iptv-basics",
        label: "IPTV architecture",
        content: (
          <>
            <Heading>IPTV architecture</Heading>
            <Lead>
              IPTV delivers television channels over an IP network rather than RF coax.
              Every TV set is an IP endpoint — flexible, scalable, and manageable remotely.
            </Lead>

            <H2>System components</H2>
            <KV rows={[
              ["Headend encoder", "Takes a video source (satellite receiver, camera, PC) and encodes it into an IP stream. E.g. Exterity b4210, ZeeVee HDb2420."],
              ["Middleware / IPTV server", "Manages the channel list, EPG, user authentication, and stream delivery. E.g. Exterity AvediaServer, Room Agent."],
              ["IP network (VLAN)", "Carries multicast video streams between encoders and decoders. Requires IGMP snooping."],
              ["Decoder / Set-top box", "Receives the IP stream and outputs HDMI to the display. E.g. Exterity b4210, Triax CDX-8."],
              ["Display", "Any commercial display with HDMI input. IPTV-integrated displays (smart TVs with built-in decoder) also exist."],
            ]} />

            <H2>Multicast delivery</H2>
            <P>
              Each channel is sent as a multicast stream to a multicast group address
              (e.g. <Code>239.1.1.1</Code> for Channel 1). Decoders subscribe to the
              group address for the channel they want to display. The switch uses IGMP
              snooping to forward the stream only to subscribed ports.
            </P>
            <P>
              This is the key efficiency of IPTV — the encoder sends one stream regardless
              of how many decoders are watching. 100 TVs showing the same channel use
              the same bandwidth as 1 TV.
            </P>

            <H2>Video encoding</H2>
            <Table
              headers={["Codec", "Compression", "Bitrate (HD)", "Latency", "Notes"]}
              rows={[
                ["MPEG-2", "Moderate", "6–15 Mbps", "Very low", "Legacy — DVD standard, broadcast SD/HD. Still used in satellite and cable headends."],
                ["H.264 (AVC)", "Good", "2–8 Mbps", "Low", "Current standard for IPTV. Excellent quality at 4–6 Mbps for HD."],
                ["H.265 (HEVC)", "Excellent", "1–4 Mbps", "Medium", "Half the bitrate of H.264 at same quality. Required for 4K IPTV."],
                ["AV1", "Best", "0.5–3 Mbps", "High", "Open standard, best compression. High encoder complexity — mostly streaming, not live broadcast."],
              ]}
            />

            <H2>RF to IP (existing coax infrastructure)</H2>
            <P>
              On sites where satellite or terrestrial RF distribution exists (coaxial cable
              to each room), an RF-to-IP gateway (e.g. Triax CDX-8, Triax TDX 400) converts
              the RF channels to IP multicast streams and injects them into the network.
              This avoids re-cabling when migrating an existing building to IPTV.
            </P>
            <Tip>
              On new builds, always specify IPTV over Cat 6A rather than coax distribution.
              It is more flexible, easier to manage, and every network port can be an IPTV
              outlet — no need to run a separate coax to each TV location.
            </Tip>
          </>
        ),
      },
      {
        id: "iptv-network",
        label: "IPTV network design",
        content: (
          <>
            <Heading>IPTV network design</Heading>
            <Lead>A poorly designed network is the most common cause of IPTV issues — pixellation, freezing, and black screens.</Lead>

            <H2>VLAN design</H2>
            <P>
              IPTV must be on its own VLAN, isolated from the corporate data network. This
              prevents AV multicast from flooding the data switches and prevents data traffic
              bursts from causing IPTV packet loss.
            </P>
            <Pre>{`VLAN 10  — Corporate data
VLAN 20  — IPTV (encoders, decoders, AvediaServer)
VLAN 30  — AV over IP (Crestron DM NVX encoders/decoders)
VLAN 40  — Control (Crestron processors, AMX controllers)
VLAN 50  — VoIP (if applicable)

All VLANs trunked to the core switch.
Inter-VLAN routing controlled by the firewall/router.`}</Pre>

            <H2>Bandwidth calculation</H2>
            <Pre>{`Number of channels: 40
Bitrate per channel (H.264 HD): 6 Mbps
Total multicast bandwidth: 40 × 6 = 240 Mbps

This flows on the backbone (uplinks between switches).
Each decoder only receives one channel at a time: 6 Mbps per port.

Access switch uplink requirement: 240 Mbps per switch
→ Use 1 Gbps uplink (over-provisioned — fine)
→ Core switch backplane must handle all 40 streams simultaneously`}</Pre>

            <H2>Common problems and fixes</H2>
            <Table
              headers={["Symptom", "Likely cause", "Fix"]}
              rows={[
                ["Pixellation / macroblocking", "Packet loss on the network", "Check switch for errors, verify IGMP snooping, check cable quality"],
                ["Black screen / no video", "Decoder not subscribed to multicast group, or IGMP snooping blocking the stream", "Check IGMP snooping config, verify multicast group address"],
                ["Video freezes then recovers", "Network congestion — buffer overflow", "Increase QoS priority for IPTV VLAN, check uplink utilisation"],
                ["Delay between channels when switching", "Decoder waiting for next I-frame (keyframe)", "Reduce encoder keyframe interval to 1–2 seconds"],
                ["One decoder fails, others work", "Decoder fault, or unicast loop — decoder sending join but not receiving", "Reboot decoder, verify port VLAN, check switch port for errors"],
              ]}
            />
          </>
        ),
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "displays-led",
    label: "Displays & LED",
    icon: Zap,
    pages: [
      {
        id: "display-specs",
        label: "Display specifications",
        content: (
          <>
            <Heading>Display specifications</Heading>
            <Lead>
              Choosing the wrong display for an environment is a common and expensive mistake.
              Brightness, contrast ratio, and viewing angle all matter.
            </Lead>

            <H2>Brightness (nits / cd/m²)</H2>
            <P>
              Brightness is measured in nits (candelas per square metre, cd/m²). The
              required brightness depends entirely on the ambient light in the space.
            </P>
            <Table
              headers={["Environment", "Recommended brightness", "Notes"]}
              rows={[
                ["Dark boardroom / home cinema", "250–400 nits", "Too bright is uncomfortable"],
                ["Office / meeting room", "400–600 nits", "Standard commercial display"],
                ["Bright lobby / retail (indirect light)", "700–1000 nits", "High-brightness commercial display"],
                ["Semi-outdoor / direct sun on glass", "1500–2500 nits", "Samsung OH / LG XE series"],
                ["Direct outdoor sunlight", "3000–5000 nits", "Outdoor-rated display or LED"],
              ]}
            />
            <Warn>
              A consumer TV at 300 nits placed in a bright lobby will look completely washed
              out. Always specify commercial-grade displays (NEC, Samsung QM, LG UM) for
              public-facing installations.
            </Warn>

            <H2>Commercial vs consumer displays</H2>
            <KV rows={[
              ["Duty cycle", "Consumer: 8–12 hr rated. Commercial: 16 or 24 hr. Running a consumer TV 24/7 in a lobby will fail within months."],
              ["Brightness uniformity", "Commercial displays have tighter uniformity specs — critical for video walls."],
              ["IP rating", "Outdoor and wet-area displays must have an appropriate IP rating (IP54 minimum for outdoor, IP65 for direct rain)."],
              ["RS-232 / LAN control", "Commercial displays have control ports for the AV control system. Consumer TVs may not."],
              ["Bezel width", "For video walls, specify ultra-narrow bezel displays — Samsung UD55E/46E (1.7 mm gap)."],
            ]} />

            <H2>Video wall considerations</H2>
            <Ul items={[
              "Bezel gap: even a 3 mm bezel on each display = 6 mm gap between panels — very visible",
              "Calibration: each display must be colour and brightness calibrated to match its neighbours",
              "Video wall processor: required to split one source across multiple displays — e.g. Crestron DM-MD series, Datapath FX4",
              "Mounting: a precision video wall mount (Peerless DS-VW765) is essential — cheap mounts allow panels to shift, making gaps visible",
              "Power: each display needs its own fused mains outlet — do not daisy-chain displays on the same circuit",
            ]} />
          </>
        ),
      },
      {
        id: "led-walls",
        label: "LED wall basics",
        content: (
          <>
            <Heading>LED wall basics</Heading>
            <Lead>
              Direct-view LED walls (dvLED) replace LCD video walls for large-format
              applications. Understanding pixel pitch and cabinet construction is essential
              for specifying and commissioning them correctly.
            </Lead>

            <H2>Pixel pitch</H2>
            <P>
              Pixel pitch is the distance (in mm) between the centres of adjacent LEDs. A
              smaller pitch = more pixels per square metre = higher resolution = higher cost.
            </P>
            <Table
              headers={["Pixel pitch", "Typical use", "Min viewing distance"]}
              rows={[
                ["P0.9 – P1.5", "Control rooms, broadcast, premium boardrooms", "1–2 m"],
                ["P1.5 – P2.5", "Boardrooms, lobbies, indoor signage", "2–4 m"],
                ["P2.5 – P4", "Large lobbies, event halls, retail", "4–8 m"],
                ["P4 – P10", "Outdoor, large venue, scoreboards", "> 8 m"],
                ["P10+", "Outdoor large format", "> 15 m"],
              ]}
            />
            <P>
              A rough minimum viewing distance guideline: multiply the pixel pitch (mm) by
              1000 to get the minimum comfortable viewing distance in mm. So P2.5 →
              minimum 2500 mm (2.5 m).
            </P>

            <H2>Cabinet construction</H2>
            <P>
              LED walls are built from cabinets — modular panels that tile together to form
              the display. Common cabinet sizes: 500×500 mm, 500×1000 mm.
            </P>
            <Ul items={[
              "Cabinets connect to a receiving card (a small PCB inside the cabinet)",
              "Receiving cards connect to a sending card (in the controller/processor) via fibre or Cat cable",
              "One sending card typically drives 4–8 cabinets",
              "Cabinets are powered by internal PSUs — each cabinet may need its own mains feed or several cabinets share one",
              "Always verify that the structural mount can support the weight — LED cabinets are typically 8–20 kg per panel",
            ]} />

            <H2>Brightness and outdoor rating</H2>
            <P>
              Indoor LED walls typically run at 600–1000 nits. Outdoor installations require
              5000–8000 nits to be visible in direct sunlight. Outdoor cabinets are also
              rated IP65 (dust-tight, water jet resistant) and may include temperature
              management (fans, heaters).
            </P>
            <Warn>
              Running an indoor LED wall outdoors will result in a washed-out image in
              daylight and rapid degradation from moisture and temperature cycling.
              Outdoor-rated and indoor products are not interchangeable.
            </Warn>

            <H2>Commissioning an LED wall</H2>
            <Ul items={[
              "Verify all cabinets are correctly orientated — some are not symmetric and will show the wrong part of the image if rotated",
              "Run a cabinet auto-calibration using the manufacturer's software and calibration camera — this corrects LED brightness and colour variation",
              "Display a uniform white field at 50% brightness — any faulty LEDs or modules will be immediately visible",
              "Check for dead pixels (permanently off), stuck pixels (permanently on), and dim modules",
              "Verify the wall tile mapping in the processor matches the physical layout",
              "Confirm the receiving card firmware is up to date on all cabinets",
            ]} />
          </>
        ),
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "control",
    label: "Control Systems",
    icon: Cpu,
    pages: [
      {
        id: "control-basics",
        label: "Control fundamentals",
        content: (
          <>
            <Heading>Control system fundamentals</Heading>
            <Lead>
              The control system is the brain that ties every device together — one button on
              a touch panel fires dozens of commands across the room. Get this wrong and a
              technically perfect room is unusable.
            </Lead>

            <H2>What the control processor does</H2>
            <P>
              A control processor (Crestron, AMX, Q-SYS Core, Extron IPCP) runs a program that
              listens for user input and sends commands to devices. "Power on" on the touch
              panel might lower the screen, power the projector, select the laptop input, set the
              DSP to a preset, and dim the lights — a single macro firing in sequence.
            </P>

            <H2>How devices are controlled</H2>
            <KV rows={[
              ["RS-232 (serial)", "9-pin or 3-wire (Tx/Rx/Gnd). Bidirectional ASCII or hex strings. Still the most reliable display/projector control. Watch baud rate, parity and flow control."],
              ["IP / TCP / UDP", "Device control over the network. Most modern AV control is IP. Needs fixed IPs and open ports. Feedback is reliable (the device confirms state)."],
              ["IR (infrared)", "One-way 'fire and forget'. No feedback — the system can't know if the TV actually turned on. Use only when nothing better exists."],
              ["Relay / contact closure", "Dry-contact switching for screens, blinds, simple triggers. Just an open/closed circuit."],
              ["CEC (HDMI)", "Consumer Electronics Control over the HDMI cable. Convenient but flaky across brands — never rely on it for critical control."],
            ]} />
            <Callout tone="note" title="One-way vs two-way control">
              Two-way control (RS-232/IP with feedback) lets the panel show real device state —
              the actual projector lamp hours, the real volume. One-way (IR) only assumes state.
              Always specify two-way control for anything the client interacts with daily.
            </Callout>

            <H2>Touch panels &amp; user interface</H2>
            <Ul items={[
              "Keep the home page to the essentials: power, source, volume. Hide complexity behind a 'More' page",
              "The big rule: a non-technical user must be able to start a meeting in one tap",
              "Provide hard feedback — a button should visibly change state when pressed",
              "Always include a clearly labelled 'System Off' / 'End Meeting' control",
              "Test the UI with someone who has never seen it before — that is your real acceptance test",
            ]} />
          </>
        ),
      },
      {
        id: "control-platforms",
        label: "Crestron vs Q-SYS vs AMX",
        content: (
          <>
            <Heading>Control platforms compared</Heading>
            <Lead>
              The three platforms you'll meet most often. They overlap heavily — the right
              choice usually follows the rest of the ecosystem already specified on the project.
            </Lead>

            <Tabs defaultValue="crestron" className="my-6">
              <TabsList>
                <TabsTrigger value="crestron">Crestron</TabsTrigger>
                <TabsTrigger value="qsys">Q-SYS</TabsTrigger>
                <TabsTrigger value="amx">AMX</TabsTrigger>
              </TabsList>

              <TabsContent value="crestron">
                <P>
                  <strong>Crestron</strong> is the market leader for high-end corporate AV. The
                  3-Series and 4-Series processors run a closed, mature ecosystem. Programmed in
                  SIMPL / SIMPL# or C# by certified programmers. DM NVX is their AV-over-IP
                  backbone — the system used on MiSK Ilmi.
                </P>
                <KV rows={[
                  ["Processors", "CP4, CP4N, AV4, MC4 (4-Series)"],
                  ["AV-over-IP", "DM NVX (1 Gb) and DM (matrix)"],
                  ["Touch panels", "TSW & TS-series, plus XPanel mobile"],
                  ["Programming", "SIMPL Windows, SIMPL#, C# — certified dealers only"],
                  ["Strength", "Polish, scale, ecosystem breadth, lighting & shades integration"],
                  ["Watch out", "Proprietary, costly, requires certified programmer for changes"],
                ]} />
              </TabsContent>

              <TabsContent value="qsys">
                <P>
                  <strong>Q-SYS</strong> (by QSC) is a software-based platform running on a Linux
                  Core. Audio DSP, video, and control all live in one design file. It has become
                  the default for unified rooms because the DSP, AV routing and control are one
                  environment rather than three separate boxes.
                </P>
                <KV rows={[
                  ["Cores", "Core Nano, Core 8 Flex, Core 110f, Core 510i"],
                  ["AV-over-IP", "Native Q-SYS video endpoints (NV-32-H)"],
                  ["Audio", "Built-in DSP — this is its origin and biggest strength"],
                  ["Programming", "Q-SYS Designer — drag-and-drop schematic + Lua scripting"],
                  ["Strength", "One platform for audio + video + control; great for VC rooms"],
                  ["Watch out", "Video routing less mature than Crestron at very large scale"],
                ]} />
              </TabsContent>

              <TabsContent value="amx">
                <P>
                  <strong>AMX</strong> (now part of Harman) is the long-standing Crestron rival,
                  strong in education, government and large institutional estates. NetLinx
                  processors are programmed in NetLinx (Pascal-like). SVSI is their AV-over-IP
                  line.
                </P>
                <KV rows={[
                  ["Processors", "NX-series NetLinx controllers"],
                  ["AV-over-IP", "SVSI N-Series (N1000–N3000)"],
                  ["Touch panels", "Modero G5 series"],
                  ["Programming", "NetLinx Studio"],
                  ["Strength", "Robust, strong in large estates and campus deployments"],
                  ["Watch out", "Smaller installer base than Crestron in this region"],
                ]} />
              </TabsContent>
            </Tabs>

            <Callout tone="tip">
              Don't mix control platforms within one room without good reason. A Crestron room
              with a Q-SYS Core for DSP is common and fine; two competing control processors in
              one room is a maintenance headache.
            </Callout>
          </>
        ),
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "dsp",
    label: "DSP & Audio Processing",
    icon: SlidersHorizontal,
    pages: [
      {
        id: "dsp-blocks",
        label: "DSP signal blocks",
        content: (
          <>
            <Heading>DSP signal blocks</Heading>
            <Lead>
              A Digital Signal Processor is a programmable audio engine. You build a signal flow
              from blocks — EQ, dynamics, routing, delay — exactly like patching a rack of
              outboard gear, but in software.
            </Lead>

            <H2>The core blocks</H2>
            <KV rows={[
              ["Gain / fader", "Sets level. The simplest block — but gain staging across blocks is what makes or breaks the system."],
              ["Equaliser (EQ)", "Boosts or cuts specific frequencies. Parametric (freq + width + gain), graphic (fixed bands), or high/low-pass filters."],
              ["Compressor", "Reduces dynamic range — turns down loud parts so the overall level can come up. Tames a dynamic presenter."],
              ["Limiter", "A brick-wall compressor that prevents the signal exceeding a ceiling. Protects amplifiers and speakers."],
              ["Gate / expander", "Mutes or attenuates signal below a threshold — kills HVAC rumble and room noise between words."],
              ["Delay", "Time-aligns speakers or compensates for distance. 1 ms ≈ 343 mm of air."],
              ["Crossover", "Splits the signal by frequency to feed separate drivers (sub / mid / high)."],
              ["AEC", "Acoustic Echo Cancellation — removes the far-end voice from the mic feed in conferencing. Essential for VC."],
              ["Matrix mixer", "Routes any input to any output with per-crosspoint gain — the routing heart of the DSP."],
              ["AGC", "Automatic Gain Control — holds a consistent output level as the talker moves or varies."],
            ]} />

            <H2>Equaliser types</H2>
            <Tabs defaultValue="parametric" className="my-6">
              <TabsList>
                <TabsTrigger value="parametric">Parametric</TabsTrigger>
                <TabsTrigger value="graphic">Graphic</TabsTrigger>
                <TabsTrigger value="filters">Filters</TabsTrigger>
              </TabsList>
              <TabsContent value="parametric">
                <P>
                  The surgical tool. Each band has three controls: <strong>frequency</strong>
                  (where), <strong>Q</strong> (how wide), and <strong>gain</strong> (boost/cut).
                  A narrow high-Q cut is how you notch out a feedback frequency without affecting
                  the surrounding tone.
                </P>
              </TabsContent>
              <TabsContent value="graphic">
                <P>
                  Fixed bands (typically 31 at ⅓-octave) with sliders. Quick and visual for
                  broad room tuning, but blunt — you can't change the centre frequency or width
                  of a band. Mostly superseded by parametric EQ in modern DSPs.
                </P>
              </TabsContent>
              <TabsContent value="filters">
                <P>
                  <strong>High-pass (low-cut)</strong> removes rumble below speech — set around
                  80–120 Hz on voice mics. <strong>Low-pass</strong> removes hiss above the band
                  of interest. <strong>Shelving</strong> filters lift or cut everything above/below
                  a corner frequency for gentle tonal shaping.
                </P>
              </TabsContent>
            </Tabs>

            <H2>Compression in plain terms</H2>
            <KV rows={[
              ["Threshold", "The level above which compression starts acting"],
              ["Ratio", "How hard it clamps. 4:1 = 4 dB in over threshold becomes 1 dB out"],
              ["Attack", "How fast it grabs the signal once over threshold"],
              ["Release", "How fast it lets go once the signal drops back"],
              ["Makeup gain", "Brings the now-quieter signal back up to working level"],
            ]} />
            <Callout tone="note">
              For speech reinforcement, a gentle 3:1 ratio with a medium attack and release gives
              a controlled, consistent level without sounding "pumped". Heavy compression on
              voice sounds unnatural and increases feedback risk.
            </Callout>
          </>
        ),
      },
      {
        id: "dsp-delay",
        label: "Delay & time alignment",
        content: (
          <>
            <Heading>Delay &amp; time alignment</Heading>
            <Lead>
              Sound travels slowly enough that distance matters. Aligning speakers in time keeps
              speech clear and stops echo-like smearing in large rooms.
            </Lead>

            <H2>The speed of sound</H2>
            <Formula
              expr="343 m/s  ≈  1 ms per 343 mm  ≈  ~3 ms per metre"
              caption="At 20 °C. Warmer air is slightly faster"
            />
            <P>
              If a delay speaker is 10 m further from the listener than the main speaker, sound
              from the main arrives ~29 ms earlier. The brain hears that as a distinct echo. Delay
              the nearer speaker so both wavefronts arrive together.
            </P>
            <Pre>{`Distance from main to listener: 20 m
Distance from delay speaker to listener: 5 m
Difference: 15 m

Delay to apply to the near speaker:
15 m × 2.92 ms/m ≈ 44 ms
(+ a 5–15 ms 'Haas' offset so the image stays at the main)`}</Pre>

            <H2>The Haas (precedence) effect</H2>
            <P>
              If two identical sounds arrive within ~5–35 ms of each other, the listener perceives
              a single sound coming from the <strong>first</strong> arrival — even if the second is
              slightly louder. This is why we add a small extra delay to fill speakers: the audience
              localises to the stage, not the speaker above their head.
            </P>
            <Callout tone="tip">
              Add 10–15 ms on top of the pure distance delay for fill and delay speakers. It keeps
              the sound image anchored on the presenter and feels natural.
            </Callout>
          </>
        ),
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "wireless-mics",
    label: "Wireless Microphones",
    icon: Mic,
    pages: [
      {
        id: "rf-fundamentals",
        label: "RF & frequency coordination",
        content: (
          <>
            <Heading>RF &amp; frequency coordination</Heading>
            <Lead>
              Wireless microphones share the airwaves with TV broadcast, other mics, and
              interference. Coordination — choosing frequencies that don't fight each other — is
              the difference between flawless audio and dropouts mid-presentation.
            </Lead>

            <H2>The frequency bands</H2>
            <Table
              headers={["Band", "Range", "Pros", "Cons"]}
              rows={[
                ["UHF", "470–698 MHz", "Best range & penetration, most channels", "TV white space — must avoid local broadcast; regulation varies by country"],
                ["1.9 GHz (DECT)", "1880–1900 MHz", "Licence-free, clean, digital", "Shorter range, limited channel count"],
                ["2.4 GHz", "2400–2483 MHz", "Global licence-free", "Shares Wi-Fi/Bluetooth — congested"],
                ["5 GHz", "5 GHz ISM", "Lots of bandwidth", "Very short range, line-of-sight"],
              ]}
            />
            <Callout tone="warn">
              UHF spectrum rules differ by country. In Saudi Arabia, confirm permitted ranges
              with the regulator (CST) before specifying. A frequency legal in Europe may be
              reserved for broadcast or telecoms locally.
            </Callout>

            <H2>Why coordination matters</H2>
            <P>
              Two transmitters too close in frequency create intermodulation products — phantom
              signals at predictable maths-derived frequencies that cause dropouts and noise.
              Coordination software (Shure Wireless Workbench, Sennheiser WSM) calculates a set
              of compatible frequencies that avoid both local TV and each other's intermod.
            </P>
            <Ul items={[
              "Scan the RF environment on site, at the actual time of day the event runs",
              "Exclude active TV channels and any in-house systems already deployed",
              "Let the software compute an intermod-free set — never just space them evenly by eye",
              "Coordinate ALL systems in a building together, not room by room, if they can hear each other",
              "Keep a documented frequency plan as part of the as-built handover",
            ]} />

            <H2>Antennas &amp; range</H2>
            <Ul items={[
              "Keep receiver antennas in line-of-sight of the transmitters — bodies and walls absorb UHF",
              "Use antenna distribution to combine many receivers onto one antenna pair — avoids antenna 'forest' and front-end overload",
              "Remote/paddle antennas with an amplifier extend coverage in large halls",
              "Diversity receivers use two antennas and pick the stronger — standard on all pro systems, eliminates most dropouts",
            ]} />
          </>
        ),
      },
      {
        id: "shure-systems",
        label: "Shure system tiers",
        content: (
          <>
            <Heading>Shure wireless tiers</Heading>
            <Lead>
              Shure dominates professional wireless. Knowing the tiers helps you spec the right
              system for the room — and not overpay for spectrum management a small room never needs.
            </Lead>

            <H2>The range, entry to flagship</H2>
            <Table
              headers={["Series", "Type", "Best for", "Key feature"]}
              rows={[
                ["BLX", "Analog", "Small rooms, budget", "Simple, reliable, no networking"],
                ["QLX-D", "Digital", "Mid corporate / education", "AES-256 encryption, rugged"],
                ["ULX-D", "Digital", "Corporate standard", "Dante, high channel density, encryption"],
                ["Axient Digital", "Digital", "Broadcast, flagship events", "Best RF performance, ShowLink remote control, redundancy"],
                ["Microflex (MXW/MXA)", "Digital networked", "Conference & ceiling arrays", "Dante ceiling array mics for VC"],
              ]}
            />

            <H2>Microflex ceiling arrays (conference rooms)</H2>
            <P>
              The <strong>MXA920 / MXA910</strong> ceiling array is the modern answer to boardroom
              audio — a single ceiling tile-sized array with steerable pickup lobes that track
              talkers automatically, outputting Dante straight to the DSP. It removes table mics
              entirely. Pair with IntelliMix DSP for AEC and you have a complete VC capture chain.
            </P>
            <Callout tone="note">
              For a MiSK Ilmi-style boardroom: an MXA920 ceiling array + a Biamp or Q-SYS DSP with
              AEC + a couple of ULX-D handhelds for presenters covers nearly every meeting scenario
              cleanly, all on the Dante network.
            </Callout>

            <H2>Specifying checklist</H2>
            <Ul items={[
              "Count simultaneous open mics — that sets channel count and antenna distribution needs",
              "Decide handheld vs lavalier vs headset vs ceiling array per use case",
              "Confirm Dante is wanted (ULX-D and above) vs analog outputs (BLX/QLX-D)",
              "Specify rechargeable batteries (SB900) for daily-use rooms — disposables get expensive fast",
              "Account for spare channels and spectrum headroom for future expansion",
            ]} />
          </>
        ),
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "vc",
    label: "Video Conferencing",
    icon: Video,
    pages: [
      {
        id: "vc-room-design",
        label: "Conference room design",
        content: (
          <>
            <Heading>Conference room design</Heading>
            <Lead>
              A good VC room makes remote participants feel present and local participants
              forget the technology. Camera framing, audio capture, and acoustics matter more
              than the brand on the codec.
            </Lead>

            <H2>Room scale &amp; tiers</H2>
            <Table
              headers={["Room", "Seats", "Display", "Audio capture"]}
              rows={[
                ["Huddle", "2–4", "Single 55\"", "Integrated bar (mic + cam + speaker)"],
                ["Small meeting", "5–7", "Single 65–75\"", "Bar or 1 ceiling array"],
                ["Medium", "8–12", "Dual 75–86\"", "1–2 ceiling arrays + DSP"],
                ["Large / boardroom", "12–20+", "Dual 86\" or LED", "Multiple ceiling arrays + DSP + AEC"],
              ]}
            />

            <H2>The three things that make or break a VC room</H2>
            <Ul items={[
              "Audio first — bad audio ends a meeting faster than bad video. AEC and enough mic coverage are non-negotiable",
              "Camera framing — the far end should see faces, not a table of foreheads. Camera at display height, auto-framing on",
              "Acoustics — a glass-walled room sounds awful. Treat reflective surfaces or speech intelligibility collapses",
            ]} />

            <H2>Lighting &amp; acoustics</H2>
            <Ul items={[
              "Light faces from the front, never backlit by a window — backlight silhouettes everyone",
              "Aim for even, diffuse lighting at ~300–500 lux on faces",
              "Add acoustic treatment to at least one pair of opposing hard surfaces to break standing waves",
              "Target a room reverberation time (RT60) under ~0.6 s for clear speech",
            ]} />
            <Callout tone="tip">
              The cheapest, highest-impact VC upgrade is almost always acoustic treatment, not a
              better camera. Fix the room before you upgrade the kit.
            </Callout>
          </>
        ),
      },
      {
        id: "vc-platforms",
        label: "Platforms & vendors",
        content: (
          <>
            <Heading>VC platforms &amp; vendors</Heading>
            <Lead>
              Rooms are built around the platform the client lives in — Teams, Zoom, or Google
              Meet — then a hardware vendor certified for it.
            </Lead>

            <H2>Software platforms</H2>
            <KV rows={[
              ["Microsoft Teams Rooms (MTR)", "Dominant in corporate. Runs on certified Windows or Android appliances. Native calendar, one-touch join."],
              ["Zoom Rooms", "Strong in education and cross-org meetings. Wide hardware certification list."],
              ["Google Meet", "Common where the client is a Google Workspace shop. Runs on Series One / certified hardware."],
              ["BYOD / USB", "Room presents a USB camera+audio device; the user's laptop drives any platform. Most flexible, least integrated."],
            ]} />

            <H2>Hardware vendors</H2>
            <Tabs defaultValue="cisco" className="my-6">
              <TabsList>
                <TabsTrigger value="cisco">Cisco</TabsTrigger>
                <TabsTrigger value="poly">Poly</TabsTrigger>
                <TabsTrigger value="logitech">Logitech</TabsTrigger>
              </TabsList>
              <TabsContent value="cisco">
                <P>
                  <strong>Cisco</strong> (Webex / Room series) is the premium end — superb camera
                  intelligence (speaker tracking, auto-framing), tight security, and registration
                  to Webex Control Hub or Microsoft Teams. Room Bar, Room Kit, and Board series
                  cover huddle to large rooms.
                </P>
              </TabsContent>
              <TabsContent value="poly">
                <P>
                  <strong>Poly</strong> (formerly Polycom, now HP) is strong on audio heritage —
                  their microphone and echo-cancellation pedigree is excellent. Studio bars and
                  the G7500 codec are certified for Teams and Zoom.
                </P>
              </TabsContent>
              <TabsContent value="logitech">
                <P>
                  <strong>Logitech</strong> owns the value and mid-market. Rally Bar and Rally
                  Plus deliver excellent quality for the price, with simple Teams/Zoom appliance
                  modes. The default choice for rolling out many standard rooms cost-effectively.
                </P>
              </TabsContent>
            </Tabs>
            <Callout tone="note">
              Match the hardware certification to the platform. A "Teams certified" appliance gives
              the native one-touch-join experience; running an uncertified device in BYOD mode
              loses that polish. Confirm the certification before ordering.
            </Callout>
          </>
        ),
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "power",
    label: "Electrical & Power",
    icon: Zap,
    pages: [
      {
        id: "grounding",
        label: "Grounding & ground loops",
        content: (
          <>
            <Heading>Grounding &amp; ground loops</Heading>
            <Lead>
              The hum you can't trace is almost always a ground loop. Understanding grounding
              prevents the single most common — and most frustrating — AV fault.
            </Lead>

            <H2>What a ground loop is</H2>
            <P>
              When two pieces of equipment are connected both by a signal cable and by separate
              mains earths at slightly different potentials, current flows through the signal
              cable's shield. That current induces the classic 50 Hz (or 60 Hz) hum into the audio.
            </P>
            <Formula
              expr="Hum ∝ potential difference between earth points"
              caption="Eliminate the difference, or break the loop, and the hum goes"
            />

            <H2>Fixing ground loops — in order of preference</H2>
            <Ul items={[
              "Power all AV equipment in a system from the same phase and ideally the same distribution board — a 'technical earth'",
              "Use balanced connections everywhere — balanced lines reject the hum a loop induces",
              "Insert an isolation transformer (DI box with ground lift, or audio isolation transformer) to break the loop on the signal path",
              "For shielded data/AV cable, ground the shield at one end only",
              "NEVER lift the mains safety earth to fix hum — it is lethal and illegal. Lift the signal ground, never the safety ground",
            ]} />
            <Callout tone="warn" title="Safety — non-negotiable">
              Removing the mains earth pin ("cheater plug") to stop hum creates a lethal shock
              hazard and fails every electrical inspection. The fix is always on the signal side
              or the power distribution design — never the protective earth.
            </Callout>

            <H2>Star grounding</H2>
            <P>
              Best practice in a rack is a single star ground point: every chassis earth runs back
              to one common point rather than daisy-chaining. This avoids multiple earth paths at
              different potentials — the very thing that creates loops.
            </P>
          </>
        ),
      },
      {
        id: "ups-power",
        label: "UPS, power & load",
        content: (
          <>
            <Heading>UPS, power &amp; load</Heading>
            <Lead>
              AV racks need clean, sufficient, and (for critical systems) backed-up power. Sizing
              it wrong means tripped breakers on power-up or equipment that dies in a brownout.
            </Lead>

            <H2>Calculating rack load</H2>
            <Pre>{`Sum the power draw of every device (W):
  DSP            45 W
  Switch (PoE)  370 W   ← PoE budget counts as load
  NVX × 2        60 W
  Amplifier     2 × 600 W (peak) ≈ 400 W typical programme
  Control proc   30 W
  ───────────────────────
  Total ≈ 905 W typical

Add 20% headroom → ~1090 W
At 230 V: I = 1090 / 230 ≈ 4.7 A  → a 10 A circuit is fine`}</Pre>
            <Callout tone="note">
              Amplifiers draw their peak only on transients, not continuously — size to typical
              programme draw (roughly ⅓ of peak for music, less for speech), but make sure the
              circuit breaker tolerates the inrush at power-on.
            </Callout>

            <H2>UPS types</H2>
            <Table
              headers={["Type", "Transfer", "Protection", "Use"]}
              rows={[
                ["Standby (offline)", "2–10 ms", "Basic — battery only on failure", "Small/non-critical loads"],
                ["Line-interactive", "2–4 ms", "Regulates minor sags/surges (AVR)", "AV racks, network gear — the usual choice"],
                ["Online (double conversion)", "0 ms", "Full isolation, always on battery-fed inverter", "Critical/broadcast, dirty mains"],
              ]}
            />

            <H2>Sizing a UPS</H2>
            <Ul items={[
              "UPS capacity is given in VA and W — match BOTH to your load; the W rating is usually the limit",
              "Size for runtime: how long must the system survive a cut? Most AV racks want 5–15 min for graceful shutdown, not hours",
              "Don't put amplifiers at full output on a small UPS — they'll flatten the battery instantly. Often only the control, DSP and network need backing up",
              "Inrush current at power-on can be several times running current — a UPS must tolerate it",
            ]} />
            <Callout tone="tip">
              Back up the brains, not the brawn. Keeping the control processor, DSP and switch
              alive through a short outage means the room recovers gracefully; the amplifiers can
              ride out and resume. This dramatically shrinks the UPS you need.
            </Callout>
          </>
        ),
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "vendors",
    label: "Vendors & Brands",
    icon: Building2,
    pages: [
      {
        id: "vendor-directory",
        label: "Vendor directory",
        badge: "Reference",
        content: (
          <>
            <Heading>Vendor directory</Heading>
            <Lead>
              A working reference to the manufacturers you'll meet on AV, PAVA, IPTV and display
              projects — what each is known for, and where they fit. Expand any vendor for detail.
            </Lead>

            <H2>Control &amp; AV-over-IP</H2>
            <Accordion type="single" collapsible className="my-4">
              <AccordionItem value="crestron">
                <AccordionTrigger>Crestron — control &amp; DM NVX</AccordionTrigger>
                <AccordionContent>
                  <P>
                    The benchmark for premium corporate AV control and AV-over-IP. DM NVX moves
                    4K video over standard 1 Gb networks; their control processors and touch
                    panels tie entire buildings together including lighting and shades. Closed
                    ecosystem, certified programmers only — but unmatched polish and scale.
                  </P>
                  <P><strong>On MiSK Ilmi:</strong> the chosen AV-over-IP backbone (DM NVX).</P>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="qsc">
                <AccordionTrigger>QSC / Q-SYS — DSP, control &amp; amps</AccordionTrigger>
                <AccordionContent>
                  <P>
                    Q-SYS unifies audio DSP, video routing and control on one Linux Core — the
                    go-to for modern conference rooms. QSC also makes excellent networked
                    amplifiers (CX-Q) and cinema/install loudspeakers. One design file for the
                    whole room is its killer advantage.
                  </P>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="extron">
                <AccordionTrigger>Extron — switching, control &amp; signal</AccordionTrigger>
                <AccordionContent>
                  <P>
                    Reliable, no-nonsense switching, scaling, and control. NAV is their
                    AV-over-IP line. Strong in education and corporate where robust, well-supported
                    signal management matters more than flashiness.
                  </P>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <H2>Audio — DSP, mics &amp; amplifiers</H2>
            <Accordion type="single" collapsible className="my-4">
              <AccordionItem value="biamp">
                <AccordionTrigger>Biamp — Tesira DSP</AccordionTrigger>
                <AccordionContent>
                  <P>
                    Tesira is a scalable networked DSP platform (TesiraFORTÉ for rooms, Tesira
                    SERVER for buildings) carrying audio over AVB or Dante. Excellent AEC for
                    conferencing and strong Parlé beamtracking ceiling mics. A default choice for
                    serious corporate audio.
                  </P>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="shure">
                <AccordionTrigger>Shure — microphones &amp; wireless</AccordionTrigger>
                <AccordionContent>
                  <P>
                    The microphone authority. ULX-D and Axient Digital wireless lead the
                    professional market; the MXA ceiling arrays redefined conference capture with
                    steerable Dante pickup. IntelliMix DSP rounds out a complete capture chain.
                  </P>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="crown">
                <AccordionTrigger>Crown / JBL (Harman) — amps &amp; speakers</AccordionTrigger>
                <AccordionContent>
                  <P>
                    Crown DCi networked amplifiers (Dante/AES67) are an install workhorse; JBL
                    Control and AC series loudspeakers cover most commercial spaces. The Harman
                    stack (Crown + JBL + BSS + AMX) integrates tightly end to end.
                  </P>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <H2>PAVA — life safety</H2>
            <Accordion type="single" collapsible className="my-4">
              <AccordionItem value="bosch">
                <AccordionTrigger>Bosch PRAESENSA — voice alarm</AccordionTrigger>
                <AccordionContent>
                  <P>
                    PRAESENSA is Bosch's IP-based, EN 54-16 certified PAVA platform — networked
                    amplifiers with built-in spare channels, integrated supervision, and lithium
                    backup. The reference system for code-compliant voice evacuation on large
                    buildings. Its predecessor PRAESIDEO is still widely installed.
                  </P>
                  <P><strong>Standards:</strong> EN 54-16 (controller), pairs with EN 54-24 speakers.</P>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="toa">
                <AccordionTrigger>TOA — PA &amp; voice alarm</AccordionTrigger>
                <AccordionContent>
                  <P>
                    Long-established in commercial PA and voice evacuation, strong in the Middle
                    East and Asia. Comprehensive EN 54 certified ranges and a deep catalogue of
                    100 V line speakers for every environment.
                  </P>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <H2>IPTV</H2>
            <Accordion type="single" collapsible className="my-4">
              <AccordionItem value="exterity">
                <AccordionTrigger>Exterity (VITEC) — enterprise IPTV</AccordionTrigger>
                <AccordionContent>
                  <P>
                    A leading enterprise IPTV platform — AvediaStream encoders, AvediaServer
                    middleware, and AvediaPlayer receivers deliver live TV, digital signage and
                    VOD over the IP network. Strong in hospitality, corporate and government.
                  </P>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="triax">
                <AccordionTrigger>Triax — RF-to-IP gateways</AccordionTrigger>
                <AccordionContent>
                  <P>
                    Specialists in headend and RF-to-IP conversion (TDX, CDX). Where a building
                    already has satellite/terrestrial coax, Triax gateways convert those channels
                    to IP multicast without re-cabling.
                  </P>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <H2>Displays &amp; LED</H2>
            <Accordion type="single" collapsible className="my-4">
              <AccordionItem value="samsung">
                <AccordionTrigger>Samsung — commercial displays &amp; LED</AccordionTrigger>
                <AccordionContent>
                  <P>
                    The broadest commercial display range — QM/QH series for signage, high-bright
                    OH series for windows, The Wall and IF/IW series direct-view LED. MagicINFO
                    handles content management across an estate.
                  </P>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="lg">
                <AccordionTrigger>LG — displays, OLED &amp; LED</AccordionTrigger>
                <AccordionContent>
                  <P>
                    Strong in fine-pitch and creative LED, transparent OLED, and high-bright
                    window displays. webOS signage platform and a deep commercial catalogue make
                    them a frequent Samsung alternative.
                  </P>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="absen">
                <AccordionTrigger>Absen — direct-view LED</AccordionTrigger>
                <AccordionContent>
                  <P>
                    A leading dedicated LED manufacturer covering fine-pitch indoor (control rooms,
                    boardrooms) through to large outdoor displays. Cost-effective, well-supported
                    cabinets with a wide pixel-pitch range for almost any LED wall brief.
                  </P>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Callout tone="tip">
              Specifying within one ecosystem (e.g. Harman: Crown + JBL + BSS) simplifies
              integration and support, but never let brand loyalty override the right tool — a
              Shure array on a Biamp DSP feeding Crown amps is a perfectly good mixed-vendor chain.
            </Callout>
          </>
        ),
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "documentation",
    label: "Project Documentation",
    icon: FileText,
    pages: [
      {
        id: "doc-types",
        label: "Document types & terminology",
        content: (
          <>
            <Heading>Document types &amp; terminology</Heading>
            <Lead>
              Every project runs on a paper trail. Knowing exactly what each document is — and
              what it is <em>not</em> — keeps approvals moving and protects you when something is
              disputed on site. These are the same types tracked in the Documents register.
            </Lead>

            <H2>The core documents</H2>
            <KV rows={[
              ["Submittal", "A formal package sent to the consultant/client for approval before procurement or installation. Bundles datasheets, drawings, samples and compliance statements for a product or system. Nothing should be ordered until its submittal is approved."],
              ["Shop drawing", "Detailed, fabrication/installation-level drawings prepared by the contractor — rack elevations, containment routes, mounting details, single-line diagrams. More detailed than the consultant's design drawings; shows exactly what will be built."],
              ["Schematic", "A system-level diagram showing how devices connect and signal flows — block/line diagram of inputs, processing and outputs. The 'logic' of the system rather than physical layout."],
              ["O&M manual", "Operation & Maintenance manual — the handover bible. How to operate, maintain, and service the installed system, with datasheets, warranties, settings and contacts. Issued at project completion."],
              ["Training manual", "User-facing guide for operating the room/system day to day. Simpler than the O&M — aimed at the end user, not the maintenance engineer."],
              ["Method statement", "Describes HOW a work activity will be carried out safely and correctly — sequence, tools, manpower, and safety controls. Often paired with a risk assessment (RAMS)."],
              ["Commissioning report", "Documented evidence that the installed system was tested and meets the design intent — test results, measurements (STI, levels, network), and sign-offs."],
              ["As-built", "Drawings updated at completion to reflect what was ACTUALLY installed, including all site changes. The single source of truth for whoever maintains the system later."],
              ["Inspection request (IR)", "A formal request asking the consultant to inspect and approve completed work at a hold point (e.g. first-fix containment) before it is covered up."],
              ["RFI", "Request For Information — a formal question to the consultant/client to clarify a design ambiguity or resolve a clash. Creates a written, traceable answer."],
            ]} />

            <H2>Easily confused pairs</H2>
            <Table
              headers={["This", "vs This", "The difference"]}
              rows={[
                ["Design drawing", "Shop drawing", "Design = consultant's intent. Shop = contractor's buildable detail."],
                ["Schematic", "Shop drawing", "Schematic = signal logic. Shop = physical construction."],
                ["Submittal", "RFI", "Submittal seeks approval of a product. RFI seeks an answer to a question."],
                ["O&M manual", "Training manual", "O&M = for the maintainer. Training = for the everyday user."],
                ["IR", "Commissioning report", "IR = please inspect this work. Report = here is the test evidence."],
                ["As-built", "Shop drawing", "Shop = what we plan to build. As-built = what was actually built."],
              ]}
            />
            <Callout tone="note">
              In the Documents register, set the <strong>Document type</strong> on every upload.
              It's how the team filters the register, drives the approval workflow, and assembles
              the O&amp;M pack at handover — an untyped document is easy to lose.
            </Callout>
          </>
        ),
      },
      {
        id: "doc-process",
        label: "The submittal & approval process",
        content: (
          <>
            <Heading>The submittal &amp; approval process</Heading>
            <Lead>
              The approval workflow is the heartbeat of project documentation. Procurement
              shouldn't start until a submittal is approved, and a rejected submittal blocks the
              whole chain — so understanding the codes and the loop is essential.
            </Lead>

            <H2>The approval codes</H2>
            <P>
              Most consultants return submittals with a status code. The exact letters vary by
              project, but the meaning is near-universal:
            </P>
            <Table
              headers={["Code", "Meaning", "What you do next"]}
              rows={[
                ["Code A — Approved", "Approved as submitted", "Proceed to procure / install"],
                ["Code B — Approved as noted", "Approved with minor comments", "Proceed, but incorporate the noted comments; usually no resubmission needed"],
                ["Code C — Revise & resubmit", "Not approved — comments must be addressed", "Revise and submit a new revision; do NOT procure yet"],
                ["Code D — Rejected", "Does not comply", "Reselect / redesign and submit fresh"],
                ["For information", "No approval required", "Filed for the record only"],
              ]}
            />
            <Callout tone="warn">
              Never order long-lead equipment on a Code C. If the consultant later rejects the
              product, you own the cost of the wrong kit. Wait for Code A or B (approved as noted).
            </Callout>

            <H2>The workflow loop</H2>
            <Pre>{`Contractor prepares submittal
        │
        ▼
   Transmittal  ──►  Consultant / Client review
        ▲                      │
        │                      ▼
   Revise & resubmit  ◄──  Code C / D ?
        │                      │ Code A / B
        │                      ▼
        └───────────────  Approved → Procure → Install
                                       │
                                       ▼
                          Inspection Request (IR) at hold points
                                       │
                                       ▼
                          Commission → Test → Commissioning report
                                       │
                                       ▼
                          As-built drawings + O&M manual → Handover`}</Pre>

            <H2>Key terms in the flow</H2>
            <KV rows={[
              ["Transmittal", "The covering note that formally issues one or more documents, with a unique number and date. It is the record that something was sent and when — your proof of submission."],
              ["Revision", "Each reissue of a document gets a new revision (Rev A, B, C… or 0, 1, 2…). The revision history shows what changed and when. Never overwrite — always supersede."],
              ["Hold point", "A stage where work must stop for inspection/approval before continuing (e.g. before closing a ceiling). Triggers an IR."],
              ["Snag / punch list", "The list of defects found at inspection that must be fixed before sign-off."],
              ["Handover / close-out", "Final issue of all O&M manuals, as-builts, warranties and training — the formal completion of documentation obligations."],
            ]} />

            <H2>Revision control discipline</H2>
            <Ul items={[
              "Every document carries a revision and a date in its title block — no exceptions",
              "Keep every revision; never delete a superseded version (the register stacks revisions automatically)",
              "A small cloud + revision triangle on a drawing marks exactly what changed in that revision",
              "The latest approved revision is the only one anyone should build from — make sure site has it",
              "Match the revision on the physical document to the revision logged in the register",
            ]} />
            <Callout tone="tip">
              Track each document's <strong>type</strong>, <strong>status</strong> and{" "}
              <strong>revision</strong> in the register and you can answer the two questions that
              stall projects in seconds: "Is this approved?" and "Is this the latest version?"
            </Callout>
          </>
        ),
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  {
    id: "commissioning",
    label: "Commissioning",
    icon: Wrench,
    pages: [
      {
        id: "commissioning-process",
        label: "Commissioning process",
        content: (
          <>
            <Heading>Commissioning process</Heading>
            <Lead>
              Commissioning is the systematic verification that every part of the installed
              system works as designed. It is not testing — testing finds faults;
              commissioning proves the design intent is met.
            </Lead>

            <H2>Stages</H2>
            <KV rows={[
              ["Pre-installation check", "Verify equipment is on site, correct model and firmware version, undamaged. Check quantities against the BOQ."],
              ["Infrastructure check", "Verify cable runs, terminations, labelling, tray routing, and conduit before final connections are made."],
              ["Power-on & basic function", "Power each device individually. Verify no fault LEDs, no smoke, correct indicator states."],
              ["IP commissioning", "Assign static IPs, verify network connectivity (ping each device), confirm VLAN assignment."],
              ["System integration", "Connect the control system. Verify each command works: power on/off, volume, input selection, display control."],
              ["User acceptance testing (UAT)", "Run through the client's test script in the presence of the client representative. Sign off on each room."],
              ["Snag list", "Document all items that failed UAT. Agree resolution timescale and re-test date."],
            ]} />

            <H2>Documentation to produce at commissioning</H2>
            <Ul items={[
              "As-built drawings — updated to reflect what was actually installed (cable routes, rack layouts)",
              "IP schedule — every device, its IP address, MAC address, and hostname",
              "Cable schedule — every cable, from/to, length, test result",
              "Rack schedule — rack elevation showing every unit and its position",
              "Software/firmware versions — every device, version number, date",
              "Test results — signed by both Frontline and the client representative",
            ]} />

            <H2>AV system test checklist (boardroom example)</H2>
            <Ul items={[
              "Laptop connected via USB-C → image displayed on main screen at native resolution",
              "Wireless presentation (Barco ClickShare) → image on screen",
              "Video conference: camera image visible to far end, far-end video on display",
              "Microphone: all microphone channels pass speech to far end; no feedback",
              "Room control panel: power on/off sequence, volume up/down, preset recall",
              "Display brightness set to appropriate level for room ambient light",
              "Cable management tidy, no loose cables visible",
              "All indicator LEDs on control processor are green",
            ]} />
          </>
        ),
      },
      {
        id: "rack-design",
        label: "Rack design",
        content: (
          <>
            <Heading>Rack design</Heading>
            <Lead>
              A well-designed rack is easy to commission, easy to maintain, and runs cool.
              A badly designed rack wastes hours during commissioning and causes overheating.
            </Lead>

            <H2>Rack units (U)</H2>
            <P>
              Equipment rack height is measured in rack units (U). 1U = 44.45 mm (1.75 in).
              A standard 19" equipment rack is 42U tall. Half-rack enclosures are 24U or 27U.
            </P>

            <H2>Rack layout principles</H2>
            <Ul items={[
              "Heavy items at the bottom — amplifiers, UPS. Keeps the centre of gravity low.",
              "Patch panels near the top — easiest to access for adds/moves/changes",
              "Network switch near the patch panel — minimises patch cable length",
              "Leave 1U gaps between heat-generating equipment (amplifiers) — or use vented blanking panels",
              "Cable management panels (1U D-ring) above and below every dense patch panel",
              "Label every piece of equipment and every cable at both ends",
              "Power distribution: use rack-mount PDUs — never use domestic extension leads in a rack",
            ]} />

            <H2>Thermal management</H2>
            <P>
              Heat rises. Amps at the bottom generate heat that rises to cool DSPs and
              control processors above. Calculate the total heat load (W) for the rack and
              ensure adequate ventilation:
            </P>
            <Ul items={[
              "Open-frame racks in a cooled equipment room: passive ventilation usually sufficient",
              "Enclosed rack cabinets: add rack-mount fan tray at the top (extract) and ventilated bottom panel (intake)",
              "High-density racks (UPS + multiple amps): may require active rack cooling unit (APC, Rittal)",
              "Equipment room must maintain < 25°C ambient for reliable operation of electronics",
            ]} />

            <H2>Typical rack elevation (boardroom system)</H2>
            <Pre>{`1U  Patch panel (Cat 6A — 24 port)
1U  Cable management
1U  Gigabit PoE switch (24 port)
1U  Cable management
2U  Crestron NVX processor
1U  Crestron DM matrix card frame
1U  Blanking panel
2U  Biamp TesiraFORTÉ AVB (DSP)
1U  Shure ULXD4Q (wireless receiver)
1U  Blanking panel
2U  Crown DCi 4|600N (amplifier)
2U  Crown DCi 4|600N (amplifier)
1U  Blanking panel
2U  UPS (800 VA)
2U  Power distribution unit (PDU)
—   Spare: 4U (always leave spare space)`}</Pre>
          </>
        ),
      },
    ],
  },
]

// ── Page ──────────────────────────────────────────────────────────────────────

function navigate(id: string, setter: (id: string) => void) {
  setter(id)
  window.scrollTo({ top: 0, behavior: "instant" })
}

export default function DocsPage() {
  const [activeId, setActiveId] = useState("key-numbers")

  const allPages = DOCS.flatMap((s) => s.pages)
  const activePage = allPages.find((p) => p.id === activeId)
  const activeSection = DOCS.find((s) => s.pages.some((p) => p.id === activeId))

  const activeIdx = allPages.findIndex((p) => p.id === activeId)
  const prevPage = activeIdx > 0 ? allPages[activeIdx - 1] : null
  const nextPage = activeIdx < allPages.length - 1 ? allPages[activeIdx + 1] : null

  return (
    <div className="min-h-svh bg-background">

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-4">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground shrink-0"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <Separator orientation="vertical" className="mx-1 h-5" />
          <div className="flex min-w-0 items-center gap-2">
            <FitLogo size={24} />
            <span className="whitespace-nowrap text-sm font-semibold">FIT</span>
            <span className="text-muted-foreground/50">/</span>
            <span className="truncate text-sm text-muted-foreground">Engineering Reference</span>
          </div>
        </div>
      </header>

      {/* ── Mobile section + page nav ── */}
      <div className="lg:hidden sticky top-14 z-10 border-b bg-background/95 backdrop-blur">
        <div className="overflow-x-auto">
          <div className="flex h-11 items-center gap-0.5 px-3">
            {DOCS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => navigate(section.pages[0].id, setActiveId)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors whitespace-nowrap",
                  activeSection?.id === section.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <section.icon className="size-3.5 shrink-0" />
                {section.label}
              </button>
            ))}
          </div>
        </div>
        {activeSection && activeSection.pages.length > 1 && (
          <div className="border-t overflow-x-auto">
            <div className="flex h-9 items-center gap-0.5 px-3">
              {activeSection.pages.map((page) => (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => navigate(page.id, setActiveId)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1 text-xs transition-colors whitespace-nowrap",
                    activeId === page.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {page.label}
                  {page.badge && (
                    <Badge variant="secondary" className="ml-1 h-4 py-0 text-[10px]">
                      {page.badge}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Desktop: sidebar + content ── */}
      <div className="flex">

        {/* Sidebar */}
        <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 sticky top-14 h-[calc(100svh-3.5rem)] overflow-y-auto border-r bg-background px-3 py-6">
          {DOCS.map((section) => (
            <div key={section.id} className="mb-5">
              {/* Section label */}
              <div className="mb-1.5 flex items-center gap-1.5 px-2">
                <section.icon className="size-3.5 shrink-0 text-muted-foreground/60" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
                  {section.label}
                </span>
              </div>
              {/* Pages */}
              <div className="space-y-0.5">
                {section.pages.map((page) => (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => navigate(page.id, setActiveId)}
                    className={cn(
                      "w-full text-left rounded-lg px-3 py-2 text-sm transition-colors",
                      activeId === page.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <span className="leading-snug">{page.label}</span>
                    {page.badge && (
                      <Badge variant="secondary" className="ml-2 h-4 py-0 text-[10px]">
                        {page.badge}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1 px-5 py-10 md:px-10 lg:px-14">
          <div className="max-w-3xl">
            {activePage?.content ?? (
              <p className="text-muted-foreground">Select a topic from the sidebar.</p>
            )}

            {/* Prev / next */}
            <div className="mt-14 flex items-center justify-between gap-4 border-t pt-6">
              {prevPage ? (
                <button
                  type="button"
                  onClick={() => navigate(prevPage.id, setActiveId)}
                  className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="size-4" />
                  {prevPage.label}
                </button>
              ) : <span />}
              {nextPage && (
                <button
                  type="button"
                  onClick={() => navigate(nextPage.id, setActiveId)}
                  className="ml-auto flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {nextPage.label}
                  <ChevronRight className="size-4" />
                </button>
              )}
            </div>
          </div>
        </main>

      </div>
    </div>
  )
}
