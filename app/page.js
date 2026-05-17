"use client";

import Link from "next/link";
import { Lock, Clock, Flame, Wifi, Shield, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-badge">
          <span className="badge-dot" />
          Zero-knowledge · Self-destructing · No account required
        </div>

        <h1 className="hero-headline">
          Files that
          <br />
          <span className="headline-accent">vanish</span>
          <br />
          on delivery.
        </h1>

        <p className="hero-sub">
          Share sensitive files, passwords, and messages with end-to-end encryption.
          They self-destruct after delivery — nothing lingers on any server.
        </p>

        <div className="hero-cta">
          <Link href="/share" className="btn-primary">
            Start Secure Drop <ArrowRight size={16} />
          </Link>
          <Link href="/access" className="btn-ghost">
            Receive a File
          </Link>
        </div>
      </section>

      <section className="features">
        {[
          {
            icon: <Clock size={22} />,
            title: "Self-Destruct",
            desc: "Files auto-delete when time is up. Set expiry from 1 hour to 30 days.",
          },
          {
            icon: <Flame size={22} />,
            title: "Burn After Read",
            desc: "Text messages vanish permanently after the first view.",
          },
          {
            icon: <Wifi size={22} />,
            title: "Local Network",
            desc: "Air-gapped QR sharing — works without internet on your LAN.",
          },
          {
            icon: <Lock size={22} />,
            title: "Password Protection",
            desc: "Optional passphrase locks your drop. Text messages are AES-encrypted client-side.",
          },
          {
            icon: <Shield size={22} />,
            title: "Download Limits",
            desc: "Set a maximum download count. The link stops working after the limit is hit.",
          },
          {
            icon: <ArrowRight size={22} />,
            title: "No Account Needed",
            desc: "Send and receive files instantly. No signup, no tracking. Just a link.",
          },
        ].map((feature) => (
          <div key={feature.title} className="feature-card">
            <div className="feature-icon">{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.desc}</p>
          </div>
        ))}
      </section>

      <section className="stats-bar">
        {[
          ["4 MB", "Max File Size"],
          ["30 days", "Max Expiry"],
          ["AES-256", "Encryption"],
          ["$0", "Cost to Use"],
        ].map(([value, label]) => (
          <div key={label} className="stat-item">
            <span className="stat-val">{value}</span>
            <span className="stat-label">{label}</span>
          </div>
        ))}
      </section>

      <section className="how-it-works">
        <h2>How it works</h2>
        <div className="steps">
          {[
            {
              n: "01",
              t: "Upload or type",
              d: "Drop a file or type a message. Set expiry, password, and download limits.",
            },
            {
              n: "02",
              t: "Get a drop link",
              d: "We generate a unique, unguessable link (or QR code) for your share.",
            },
            {
              n: "03",
              t: "Share the link",
              d: "Send it via any channel. The recipient clicks to download — no account needed.",
            },
            {
              n: "04",
              t: "It vanishes",
              d: "On expiry or after the download limit, the file is permanently deleted.",
            },
          ].map((step) => (
            <div key={step.n} className="step">
              <span className="step-num">{step.n}</span>
              <h4>{step.t}</h4>
              <p>{step.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bottom-cta">
        <h2>Ready to share securely?</h2>
        <p>No signup. Free forever. Works anywhere.</p>
        <Link href="/share" className="btn-primary">
          Create Your First Drop →
        </Link>
      </section>
    </main>
  );
}
