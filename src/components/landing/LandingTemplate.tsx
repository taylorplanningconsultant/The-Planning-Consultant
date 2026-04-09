"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { STRIPE_PRODUCTS } from "@/lib/stripe/products";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/utils/cn";

const LPA_CAROUSEL_NAMES = [
  "Westminster",
  "Manchester City",
  "Birmingham City",
  "Leeds City",
  "Bristol City",
  "Sheffield City",
  "Liverpool City",
  "Newcastle City",
  "Hackney",
  "Islington",
  "Camden",
  "Southwark",
  "Brighton & Hove",
  "Oxford City",
  "Cambridge City",
  "Wigan Council",
  "Tewkesbury Borough",
  "Cheltenham Borough",
  "Bath & NE Somerset",
  "Exeter City",
] as const;

export function LandingTemplate() {
  const router = useRouter();
  const [annual, setAnnual] = useState(false);
  const [postcode, setPostcode] = useState("");
  const heroInputRef = useRef<HTMLInputElement | null>(null);
  const heroInputWrapRef = useRef<HTMLDivElement | null>(null);

  function handleCheck() {
    const value = postcode.trim();

    if (!value) {
      const w = heroInputWrapRef.current;
      if (w) w.style.borderColor = "#D94040";
      heroInputRef.current?.focus();
      window.setTimeout(() => {
        if (heroInputWrapRef.current) heroInputWrapRef.current.style.borderColor = "";
      }, 1600);
      return;
    }

    router.push(`/check?postcode=${encodeURIComponent(value)}`);
  }

  async function handleSubscribe(priceId: string, isAnnual: boolean) {
    void isAnnual;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login?next=/dashboard/billing&view=signup";
      return;
    }

    const res = await fetch("/api/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        priceId,
        mode: "subscription",
        successPath: "/dashboard/billing",
      }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  useEffect(() => {
    // Scroll-reveal animation for "card" blocks.
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((el) => {
          if (el.isIntersecting) {
            (el.target as HTMLElement).style.opacity = "1";
            (el.target as HTMLElement).style.transform = "translateY(0)";
          }
        });
      },
      { threshold: 0.12 },
    );

    document
      .querySelectorAll(
        ".step,.price-card,.b2b-card",
      )
      .forEach((el) => {
        const node = el as HTMLElement;
        node.style.opacity = "0";
        node.style.transform = "translateY(22px)";
        node.style.transition = "opacity .55s ease, transform .55s ease";
        obs.observe(node);
      });

    return () => obs.disconnect();
  }, []);

  const inputClassName =
    "w-full border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-brand focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-background";

  return (
    <>
      <div className="hero-wrap dot-bg">
        <div className="hero-gradient" />
        <div className="hero-dot" />
        <div
          className={cn(
            "hero",
            "!min-h-0 !pt-10 !pb-8 !px-7 md:!pt-12 md:!pb-10 md:!px-7",
          )}
        >
          <div>
            <div className="hero-badge fi-anim border border-white/20 bg-white/10 text-white">
              <span className="badge-dot bg-white" />
              AI-powered planning guidance
            </div>
            <h1 className="hero-headline fi-anim d1 text-white">
              Know your planning
              <br />
              chances{" "}
              <span className="hl text-white bg-none [-webkit-text-fill-color:white] [background-clip:unset] [-webkit-background-clip:unset]">
                before you
                <br />
                spend a penny
              </span>
            </h1>
            <p className="hero-sub fi-anim d2 text-white">
              Instant planning constraint reports for any UK postcode. Check
              conservation areas, permitted development rights, flood zones, and
              more — in under 60 seconds.
            </p>
            <div
              ref={heroInputWrapRef}
              className="hero-input-wrap fi-anim d3"
            >
              <input
                ref={heroInputRef}
                type="text"
                placeholder="Enter your postcode…"
                id="hero-input"
                autoComplete="postal-code"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCheck();
                }}
              />
              <button type="button" onClick={handleCheck}>
                Check now
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 13 13"
                  fill="none"
                >
                  <path
                    d="M2.5 6.5H10.5M7.5 3.5L10.5 6.5L7.5 9.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <p className="hero-note fi-anim d4 text-white/60">
              <svg
                width="13"
                height="13"
                viewBox="0 0 13 13"
                fill="none"
              >
                <path
                  d="M6.5 1a5.5 5.5 0 100 11A5.5 5.5 0 006.5 1zm0 3v3.5m0 2h.01"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
              Free basic check. No account required. Full report from £29.
            </p>
          </div>

          <div className="hero-visual !py-6 !px-6 md:!py-8 md:!px-8">
            <div className="chip chip-a">
              <div className="chip-icon ci-green">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6.5L4.5 9L10 3"
                    stroke="#126B3A"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <div className="chip-title">Report ready</div>
                <div className="chip-sub">Just now</div>
              </div>
            </div>
            <div className="chip chip-b">
              <div className="chip-icon ci-gold">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M6 1.5l1.2 3.6H11L8.1 7.5l1.1 3.4L6 8.7l-3.2 2.2 1.1-3.4L1 5.1h3.8L6 1.5z"
                    stroke="#C49A3C"
                    strokeWidth="1.1"
                    fill="none"
                  />
                </svg>
              </div>
              <div>
                <div className="chip-title">74% approval likelihood</div>
                <div className="chip-sub">Above area average</div>
              </div>
            </div>

            <div className="report-card card-float">
              <div className="rc-header">
                <div>
                  <div className="rc-addr">14 Elm Grove, London SE5 8RB</div>
                  <div className="rc-title">Planning Constraints Report</div>
                </div>
                <div className="rc-badge">Live</div>
              </div>
              <div className="rc-body">
                <div className="rc-score-row">
                  <div className="rc-score-num">74%</div>
                  <div className="rc-score-lbl">
                    Approval
                    <br />
                    likelihood
                  </div>
                </div>
                <div className="rc-bar">
                  <div className="rc-bar-fill" />
                </div>
                <div className="rc-rows">
                  <div className="rc-row">
                    <div className="rc-dot d-g" />
                    <span className="rc-name">Conservation area</span>
                    <span className="rc-tag t-pass">None</span>
                  </div>
                  <div className="rc-row">
                    <div className="rc-dot d-g" />
                    <span className="rc-name">Listed building</span>
                    <span className="rc-tag t-pass">Clear</span>
                  </div>
                  <div className="rc-row">
                    <div className="rc-dot d-y" />
                    <span className="rc-name">Article 4 direction</span>
                    <span className="rc-tag t-warn">Review</span>
                  </div>
                  <div className="rc-row">
                    <div className="rc-dot d-g" />
                    <span className="rc-name">Flood zone</span>
                    <span className="rc-tag t-pass">Zone 1</span>
                  </div>
                  <div className="rc-row">
                    <div className="rc-dot d-g" />
                    <span className="rc-name">Tree pres. order</span>
                    <span className="rc-tag t-pass">None</span>
                  </div>
                </div>
              </div>
              <div className="rc-footer">
                <span className="rc-footer-txt">The Planning Consultant</span>
                <a href="#" className="rc-footer-link">
                  Full report
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="none"
                  >
                    <path
                      d="M2 5h6M5 2l3 3-3 3"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1180px] mx-auto px-7 pb-8 md:pb-10 w-full">
          <div className="hero-stats flex-wrap justify-center gap-x-9 gap-y-8 !mt-6 !pt-5 max-[920px]:!mt-5 max-[920px]:!pt-4">
            <div className="text-center min-w-[min(100%,160px)]">
              <div className="stat-val">45 min</div>
              <div className="stat-lbl">Saved per site assessment</div>
            </div>
            <div className="text-center min-w-[min(100%,160px)]">
              <div className="stat-val">8</div>
              <div className="stat-lbl">Constraint categories checked</div>
            </div>
            <div className="text-center min-w-[min(100%,160px)]">
              <div className="stat-val">337</div>
              <div className="stat-lbl">Local authorities covered</div>
            </div>
            <div className="text-center min-w-[min(100%,160px)]">
              <div className="stat-val">{"< 60s"}</div>
              <div className="stat-lbl">Results in under 60 seconds</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-background">
        <div className="max-w-[1180px] mx-auto px-6 md:px-8 pt-5 pb-2 text-center">
          <span className="logos-lbl">Serving homeowners across</span>
        </div>
      </div>
      <div className="logos">
        <div className="logos-inner">
          <div className="logos-carousel-full">
            <div className="logos-carousel w-full min-w-0">
              <div className="logos-viewport">
                <div className="logos-track">
                  {LPA_CAROUSEL_NAMES.map((name) => (
                    <span key={`a-${name}`} className="logo-item">
                      {name}
                    </span>
                  ))}
                  {LPA_CAROUSEL_NAMES.map((name) => (
                    <span key={`b-${name}`} className="logo-item">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="how-wrap dot-bg" id="how-it-works">
        <div className="section">
          <div
            className="sec-head"
            style={{
              textAlign: "center",
              maxWidth: 560,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <div className="sec-label">How it works</div>
            <h2 className="sec-h">From postcode to answer in 60 seconds</h2>
            <p className="sec-sub" style={{ margin: "0 auto" }}>
              We check 8 planning constraint categories against live
              government data — no waiting, no phone calls.
            </p>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-num">01</div>
              <Image
                src="/illustrations/house_searching.svg"
                alt=""
                width={400}
                height={112}
                className="mb-4 h-28 w-full object-contain opacity-90"
              />
              <div className="step-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M10 11a3 3 0 100-6 3 3 0 000 6z"
                    stroke="#126B3A"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M10 2C6.686 2 4 4.686 4 8c0 5.25 6 10 6 10s6-4.75 6-10c0-3.314-2.686-6-6-6z"
                    stroke="#126B3A"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
              <div className="step-title">Enter your postcode</div>
              <p className="step-desc">
                Type your UK postcode. We identify your local planning authority
                and run constraint checks for your area — no full address
                required.
              </p>
            </div>
            <div className="step">
              <div className="step-num">02</div>
              <Image
                src="/illustrations/checklist.svg"
                alt=""
                width={400}
                height={112}
                className="mb-4 h-28 w-full object-contain opacity-90"
              />
              <div className="step-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle
                    cx="10"
                    cy="10"
                    r="7"
                    stroke="#126B3A"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M10 7v3l2 2"
                    stroke="#126B3A"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="step-title">We check 8 constraints</div>
              <p className="step-desc">
                Our AI cross-references planning.data.gov.uk, your LPA&apos;s
                local plan, and live appeal decisions to build a complete
                constraint picture in seconds.
              </p>
            </div>
            <div className="step">
              <div className="step-num">03</div>
              <Image
                src="/illustrations/report.svg"
                alt=""
                width={400}
                height={112}
                className="mb-4 h-28 w-full object-contain opacity-90"
              />
              <div className="step-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M6 10l3 3 5-5"
                    stroke="#126B3A"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <rect
                    x="3"
                    y="3"
                    width="14"
                    height="14"
                    rx="2"
                    stroke="#126B3A"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
              <div className="step-title">Get your full report</div>
              <p className="step-desc">
                Receive a structured PDF with your approval likelihood score,
                constraint breakdown, next steps, and policy references — ready
                to share with your architect.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURE */}
      <div id="features">
        <div className="section">
          <div className="feat-grid">
            <div className="feat-visual">
              <div className="fv-header">
                <div className="tl-row">
                  <div className="tl tl-r" />
                  <div className="tl tl-y" />
                  <div className="tl tl-g" />
                </div>
                <div className="fv-url">
                  theplanningconsultant.co.uk/report/SE5-8RB
                </div>
              </div>
              <div className="ct-table">
                <div className="ct-head">
                  <div />
                  <div>Constraint</div>
                  <div>Detail</div>
                  <div>Status</div>
                </div>
                <div className="ct-row">
                  <div className="w-2 h-2 rounded-full bg-[#8FA896] mt-1 flex-shrink-0" />
                  <div className="ct-name">Conservation Area</div>
                  <div className="ct-val">None nearby</div>
                  <div className="ct-tag t-g">Clear</div>
                </div>
                <div className="ct-row">
                  <div className="w-2 h-2 rounded-full bg-[#8FA896] mt-1 flex-shrink-0" />
                  <div className="ct-name">Listed Building</div>
                  <div className="ct-val">Not listed</div>
                  <div className="ct-tag t-g">Clear</div>
                </div>
                <div className="ct-row">
                  <div className="w-2 h-2 rounded-full bg-[#8FA896] mt-1 flex-shrink-0" />
                  <div className="ct-name">Article 4 Direction</div>
                  <div className="ct-val">Partial (Class E)</div>
                  <div className="ct-tag t-y">Review</div>
                </div>
                <div className="ct-row">
                  <div className="w-2 h-2 rounded-full bg-[#8FA896] mt-1 flex-shrink-0" />
                  <div className="ct-name">Flood Zone</div>
                  <div className="ct-val">Zone 1 — Low</div>
                  <div className="ct-tag t-g">Low risk</div>
                </div>
                <div className="ct-row">
                  <div className="w-2 h-2 rounded-full bg-[#8FA896] mt-1 flex-shrink-0" />
                  <div className="ct-name">Tree Pres. Order</div>
                  <div className="ct-val">None</div>
                  <div className="ct-tag t-g">Clear</div>
                </div>
                <div className="ct-row">
                  <div className="w-2 h-2 rounded-full bg-[#8FA896] mt-1 flex-shrink-0" />
                  <div className="ct-name">Green Belt</div>
                  <div className="ct-val">Not applicable</div>
                  <div className="ct-tag t-g">Clear</div>
                </div>
                <div className="ct-row">
                  <div className="w-2 h-2 rounded-full bg-[#8FA896] mt-1 flex-shrink-0" />
                  <div className="ct-name">AONB / Nat. Park</div>
                  <div className="ct-val">Outside boundary</div>
                  <div className="ct-tag t-g">Clear</div>
                </div>
                <div className="ct-row">
                  <div className="w-2 h-2 rounded-full bg-[#8FA896] mt-1 flex-shrink-0" />
                  <div className="ct-name">Permitted Dev. Rights</div>
                  <div className="ct-val">Full rights</div>
                  <div className="ct-tag t-b">Active</div>
                </div>
              </div>
            </div>
            <div>
              <div className="sec-label">Planning constraint checker</div>
              <h2 className="sec-h">
                Eight checks.
                <br />
                Instant results.
              </h2>
              <p className="sec-sub" style={{ marginBottom: 32 }}>
                We cross-reference every major planning constraint category using live data
                from government planning portals — the same sources your council uses.
              </p>
              <ul className="feat-list">
                <li className="fi">
                  <div className="fi-icon">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                    >
                      <path
                        d="M2 7l3.5 3.5 6.5-7"
                        stroke="#126B3A"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="fi-title">Live government data</div>
                    <div className="fi-desc">
                      Pulled directly from planning.data.gov.uk and OS Data Hub — updated in
                      real time, not cached guesswork.
                    </div>
                  </div>
                </li>
                <li className="fi">
                  <div className="fi-icon">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                    >
                      <path
                        d="M2 7l3.5 3.5 6.5-7"
                        stroke="#126B3A"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="fi-title">Approval likelihood score</div>
                    <div className="fi-desc">
                      AI-generated score based on constraints, local precedent, and recent appeal
                      decisions in your LPA area.
                    </div>
                  </div>
                </li>
                <li className="fi">
                  <div className="fi-icon">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                    >
                      <path
                        d="M2 7l3.5 3.5 6.5-7"
                        stroke="#126B3A"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="fi-title">Shareable PDF report</div>
                    <div className="fi-desc">
                      Download and share with your architect or planning consultant. Unique link for
                      easy collaboration.
                    </div>
                  </div>
                </li>
                <li className="fi">
                  <div className="fi-icon">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                    >
                      <path
                        d="M2 7l3.5 3.5 6.5-7"
                        stroke="#126B3A"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="fi-title">Clear next steps</div>
                    <div className="fi-desc">
                      Jargon-free recommendations — from pre-app enquiries to permitted development
                      certificates.
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* PLANNING STATEMENT */}
      <div
        className="dot-bg border-y border-border bg-secondary"
        id="planning-statement"
      >
        <div className="mx-auto max-w-[1180px] px-5 py-[72px] md:px-7 md:py-[92px]">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="order-1 flex w-full items-center justify-center px-1 sm:px-2">
              <Image
                src="/illustrations/agreement.svg"
                alt=""
                width={480}
                height={240}
                className="mx-auto h-auto w-full max-w-[min(100%,280px)] object-contain object-center opacity-90 sm:max-w-[min(100%,340px)] md:max-w-[min(100%,400px)] lg:max-w-[min(100%,440px)]"
              />
            </div>
            <div className="order-2 mx-auto max-w-[520px] text-center lg:order-none lg:mx-0 lg:max-w-none lg:text-left">
              <p className="mb-3.5 text-xs font-bold uppercase tracking-widest text-accent">
                Planning statement
              </p>
              <h2 className="mb-3.5 text-[clamp(30px,4vw,44px)] font-extrabold leading-[1.1] tracking-tight text-foreground">
                The words that go
                <br />
                with your drawings
              </h2>
              <p className="mb-3.5 max-w-[520px] text-[15.5px] font-normal leading-relaxed text-muted-foreground lg:mx-0">
                Many applications need a short written explanation — what you want to do, how it
                affects the area, and which local policies it meets. That&apos;s a{" "}
                <span className="font-semibold text-foreground">planning statement</span>: the story
                behind your plans, in the format councils expect.
              </p>
              <p className="mb-8 max-w-[520px] text-[15.5px] font-normal leading-relaxed text-muted-foreground lg:mx-0">
                We draft one tailored to your authority, citing the right policies so you start from
                something solid — not a blank page — for a one-off fee.
              </p>
              <ul className="mb-8 flex list-none flex-col gap-[18px] p-0 text-left">
                <li className="flex items-start gap-[13px]">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-light">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                    >
                      <path
                        d="M2 7l3.5 3.5 6.5-7"
                        stroke="#126B3A"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="mb-0.5 text-[14.5px] font-semibold tracking-tight text-foreground">
                      Written for homeowners
                    </div>
                    <div className="text-[13.5px] leading-[1.55] text-muted-foreground">
                      Plain-English structure you can review with your family or builder before
                      anything is submitted.
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-[13px]">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-light">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                    >
                      <path
                        d="M2 7l3.5 3.5 6.5-7"
                        stroke="#126B3A"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="mb-0.5 text-[14.5px] font-semibold tracking-tight text-foreground">
                      Grounded in your local plan
                    </div>
                    <div className="text-[13.5px] leading-[1.55] text-muted-foreground">
                      References the policies your LPA actually uses — so the narrative matches what
                      officers look for.
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-[13px]">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-light">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                    >
                      <path
                        d="M2 7l3.5 3.5 6.5-7"
                        stroke="#126B3A"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="mb-0.5 text-[14.5px] font-semibold tracking-tight text-foreground">
                      Editable Word output
                    </div>
                    <div className="text-[13.5px] leading-[1.55] text-muted-foreground">
                      Tweak wording with your architect or planning consultant, then attach it to
                      your application pack.
                    </div>
                  </div>
                </li>
              </ul>
              <div className="mb-6 flex flex-wrap items-baseline justify-center gap-3 lg:justify-start">
                <div className="text-5xl font-extrabold leading-none tracking-tight text-foreground">
                  <span className="align-super text-2xl font-semibold">£</span>
                  79
                </div>
                <div className="text-[13px] text-muted-brand">One-off</div>
              </div>
              <Link
                href="/statement"
                className="inline-block w-full rounded-lg bg-gradient-to-br from-primary to-accent px-6 py-3 text-center text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90 sm:w-auto"
              >
                Get planning statement
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* PROFESSIONALS */}
      <div className="pro-wrap" id="professionals">
        <div className="pro-gradient" />
        <div className="pro-dots" />
        <div className="pro-inner">
          <div>
            <div className="pro-lbl">For professionals</div>
            <h2 className="pro-h">
              Built for architects,
              <br />
              agents &amp; developers
            </h2>
            <p className="pro-sub">
              Run unlimited constraint checks, generate planning statement drafts, and manage all
              your sites from one dashboard. Everything your team needs, at a fraction of the cost of
              manual research.
            </p>
            <ul className="pro-feats">
              <li className="pfi">
                <div className="pfi-check">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M2 5l2.5 2.5 3.5-4"
                      stroke="white"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                Unlimited constraint checks across all your sites
              </li>
              <li className="pfi">
                <div className="pfi-check">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M2 5l2.5 2.5 3.5-4"
                      stroke="white"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                AI planning statement generator citing your LPA&apos;s policies
              </li>
              <li className="pfi">
                <div className="pfi-check">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M2 5l2.5 2.5 3.5-4"
                      stroke="white"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                Priority support and white-label report branding (Agency plan)
              </li>
              <li className="pfi">
                <div className="pfi-check">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M2 5l2.5 2.5 3.5-4"
                      stroke="white"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                Top-up credits available for busy months
              </li>
              <li className="pfi">
                <div className="pfi-check">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M2 5l2.5 2.5 3.5-4"
                      stroke="white"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                Matched lead referrals from homeowners in your area
              </li>
            </ul>
            <a href="#professional-pricing" className="btn-white">
              View professional plans
              <svg
                width="13"
                height="13"
                viewBox="0 0 13 13"
                fill="none"
              >
                <path
                  d="M2.5 6.5H10.5M7 3L10.5 6.5L7 10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
          <div className="pro-right">
            <Image
              src="/illustrations/city.svg"
              alt=""
              width={480}
              height={192}
              className="mb-6 h-48 w-full object-contain opacity-90"
            />
            <div className="pro-metrics">
              <div className="pm-card">
                <div className="pm-val">45 min</div>
                <div className="pm-lbl">Saved per site assessment</div>
              </div>
              <div className="pm-card">
                <div className="pm-val">8</div>
                <div className="pm-lbl">Constraint categories checked</div>
              </div>
              <div className="pm-card">
                <div className="pm-val">337</div>
                <div className="pm-lbl">Local authorities covered</div>
              </div>
              <div className="pm-card">
                <div className="pm-val">{"< 60s"}</div>
                <div className="pm-lbl">Results in under 60 seconds</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRICING */}
      <div id="pricing">
        <div className="section">
          <div
            className="sec-head"
            style={{
              textAlign: "center",
              maxWidth: 540,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <div className="sec-label">Pricing</div>
            <h2 className="sec-h">Simple, transparent pricing</h2>
            <p className="sec-sub" style={{ margin: "0 auto" }}>
              No hidden fees. No subscription required for homeowners. Start free and pay only
              when you need the full report.
            </p>
          </div>

          <div
            className={cn(
              "price-grid min-[921px]:!grid-cols-4 max-[920px]:!grid-cols-1",
            )}
          >
            <div className="price-card">
              <div className="price-tier">Free</div>
              <div className="price-amount">£0</div>
              <div className="price-per">No account needed</div>
              <p className="price-desc">
                Run a basic constraint check from any UK postcode and see whether major constraints
                exist in your area.
              </p>
              <ul className="price-feats">
                <li className="pf-row">
                  <div className="pf-chk">
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path
                        d="M1.5 4.5l2 2 4-4"
                        stroke="#126B3A"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  Basic constraint check (3 categories)
                </li>
                <li className="pf-row">
                  <div className="pf-chk">
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path
                        d="M1.5 4.5l2 2 4-4"
                        stroke="#126B3A"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  Pass / flag / fail overview
                </li>
                <li className="pf-row">
                  <div className="pf-chk">
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path
                        d="M1.5 4.5l2 2 4-4"
                        stroke="#126B3A"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  Permitted development indicator
                </li>
                <li className="pf-row">
                  <div className="pf-chk">
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path
                        d="M1.5 4.5l2 2 4-4"
                        stroke="#126B3A"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  No PDF export
                </li>
              </ul>
              <a href="/check" className="btn-price-outline">
                Run free check
              </a>
            </div>

            <div className="price-card price-card-feat">
              <div className="pop-tag">Most popular</div>
              <div className="price-tier">Full Report</div>
              <div className="price-amount">
                <span className="price-cur">£</span>29
              </div>
              <div className="price-per">One-off</div>
              <p className="price-desc">
                Full constraint analysis, approval likelihood score, and next steps. Everything before
                speaking to an architect.
              </p>
              <ul className="price-feats">
                <li className="pf-row">
                  <div className="pf-chk">
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path
                        d="M1.5 4.5l2 2 4-4"
                        stroke="white"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  All 8 constraint categories
                </li>
                <li className="pf-row">
                  <div className="pf-chk">
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path
                        d="M1.5 4.5l2 2 4-4"
                        stroke="white"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  Approval likelihood score
                </li>
                <li className="pf-row">
                  <div className="pf-chk">
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path
                        d="M1.5 4.5l2 2 4-4"
                        stroke="white"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  Shareable PDF report + unique link
                </li>
                <li className="pf-row">
                  <div className="pf-chk">
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path
                        d="M1.5 4.5l2 2 4-4"
                        stroke="white"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  Next steps &amp; recommended actions
                </li>
                <li className="pf-row">
                  <div className="pf-chk">
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path
                        d="M1.5 4.5l2 2 4-4"
                        stroke="white"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  Local planning policy summary
                </li>
              </ul>
              <a href="/check" className="btn-price-white">
                Get full report
              </a>
            </div>

            <div className="price-card">
              <div className="price-tier">Planning Statement</div>
              <div className="price-amount">
                <span className="price-cur">£</span>79
              </div>
              <div className="price-per">One-off</div>
              <p className="price-desc">
                AI planning statement draft citing your local planning policies. Editable Word output.
              </p>
              <ul className="price-feats">
                <li className="pf-row">
                  <div className="pf-chk">
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path
                        d="M1.5 4.5l2 2 4-4"
                        stroke="#126B3A"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  AI planning statement draft
                </li>
                <li className="pf-row">
                  <div className="pf-chk">
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path
                        d="M1.5 4.5l2 2 4-4"
                        stroke="#126B3A"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  Cites your LPA&apos;s local plan policies
                </li>
                <li className="pf-row">
                  <div className="pf-chk">
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path
                        d="M1.5 4.5l2 2 4-4"
                        stroke="#126B3A"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  Editable Word document output
                </li>
                <li className="pf-row">
                  <div className="pf-chk">
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path
                        d="M1.5 4.5l2 2 4-4"
                        stroke="#126B3A"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  Professional-grade starting draft
                </li>
              </ul>
              <a href="/check" className="btn-price-main">
                Get planning statement
              </a>
            </div>

            <div className="price-card">
              <div className="price-tier">Bundle</div>
              <div className="price-amount">
                <span className="price-cur">£</span>99
              </div>
              <div className="price-per">Report + statement</div>
              <p className="price-desc">
                Save £9 — get both your constraint report and planning statement
              </p>
              <ul className="price-feats">
                <li className="pf-row">
                  <div className="pf-chk">
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path
                        d="M1.5 4.5l2 2 4-4"
                        stroke="#126B3A"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  Full constraint report (all 8 categories)
                </li>
                <li className="pf-row">
                  <div className="pf-chk">
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path
                        d="M1.5 4.5l2 2 4-4"
                        stroke="#126B3A"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  Approval likelihood &amp; PDF + link
                </li>
                <li className="pf-row">
                  <div className="pf-chk">
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path
                        d="M1.5 4.5l2 2 4-4"
                        stroke="#126B3A"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  AI planning statement draft
                </li>
                <li className="pf-row">
                  <div className="pf-chk">
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path
                        d="M1.5 4.5l2 2 4-4"
                        stroke="#126B3A"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  Cites your LPA&apos;s local plan policies
                </li>
              </ul>
              <a href="/check" className="btn-price-outline">
                Get bundle
              </a>
            </div>
          </div>

          {/* B2B */}
          <div className="b2b-wrap" id="professional-pricing">
            <div className="b2b-tag-row">
              <span className="b2b-tag">
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 11 11"
                  fill="none"
                >
                  <rect
                    x="1"
                    y="4"
                    width="9"
                    height="6"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M3.5 4V3a2 2 0 014 0v1"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                </svg>
                Professional subscriptions
              </span>
              <span className="text-[13px] text-muted-brand">
                For architects, planning agents, and developers
              </span>
            </div>
            <div className="flex justify-center mb-8">
              <div className="inline-flex w-full max-w-md items-center rounded-lg border border-border bg-secondary p-1 gap-1 md:w-auto">
                <button
                  type="button"
                  onClick={() => setAnnual(false)}
                  className={cn(
                    "min-h-11 flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors md:flex-none",
                    !annual ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-background/80",
                  )}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setAnnual(true)}
                  className={cn(
                    "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 sm:pl-4 sm:pr-3 text-sm font-medium transition-colors md:flex-none",
                    annual ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-background/80",
                  )}
                >
                  <span>Annual</span>
                  <span
                    className={cn(
                      "text-[10px] sm:text-[11px] font-semibold whitespace-nowrap px-1.5 py-0.5 rounded-md shrink-0",
                      annual
                        ? "bg-white/20 text-white"
                        : "bg-brand-light text-accent",
                    )}
                  >
                    Best value
                  </span>
                </button>
              </div>
            </div>
            <div className="b2b-grid">
              <div className="b2b-card">
                <div className="b2b-plan">Starter</div>
                <div className="b2b-amt">{annual ? "£66" : "£79"}</div>
                <div className="b2b-per">/month</div>
                <p
                  className={cn(
                    "m-0 text-[13px] text-muted-foreground",
                    annual ? "mb-1" : "mb-4",
                  )}
                >
                  15 credits/month · Rollover up to 30 credits
                </p>
                {annual ? (
                  <div className="mb-4 flex flex-col gap-1">
                    <p className="m-0 text-[12.5px] text-muted-foreground">
                      billed as £790/year
                    </p>
                    <p className="m-0 text-[12.5px] font-semibold text-accent">Save £158</p>
                  </div>
                ) : null}
                <div className="b2b-div" />
                <ul className="b2b-feats">
                  <li className="b2b-feat">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 13 13"
                      fill="none"
                    >
                      <path
                        d="M2 6.5l3 3 6-6"
                        stroke="#126B3A"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    1 credit = 1 AI Report (£29 value)
                  </li>
                  <li className="b2b-feat">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 13 13"
                      fill="none"
                    >
                      <path
                        d="M2 6.5l3 3 6-6"
                        stroke="#126B3A"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    3 credits = 1 Planning Statement (£79 value)
                  </li>
                  <li className="b2b-feat">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 13 13"
                      fill="none"
                    >
                      <path
                        d="M2 6.5l3 3 6-6"
                        stroke="#126B3A"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Credits roll over up to 30
                  </li>
                  <li className="b2b-feat">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 13 13"
                      fill="none"
                    >
                      <path
                        d="M2 6.5l3 3 6-6"
                        stroke="#126B3A"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Top-up credits available
                  </li>
                  <li className="b2b-feat">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 13 13"
                      fill="none"
                    >
                      <path
                        d="M2 6.5l3 3 6-6"
                        stroke="#126B3A"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    1 user seat
                  </li>
                </ul>
                <button
                  type="button"
                  onClick={() =>
                    void handleSubscribe(
                      annual
                        ? STRIPE_PRODUCTS.subscriptions.starterAnnual
                        : STRIPE_PRODUCTS.subscriptions.starterMonthly,
                      annual,
                    )
                  }
                  className="btn-price-outline"
                >
                  Get started
                </button>
              </div>
              <div className="b2b-card b2b-card-mid">
                <div className="b2b-plan">Pro</div>
                <div className="b2b-amt">{annual ? "£149" : "£179"}</div>
                <div className="b2b-per">/month</div>
                <p
                  className={cn(
                    "m-0 text-[13px] text-muted-foreground",
                    annual ? "mb-1" : "mb-4",
                  )}
                >
                  60 credits/month · Rollover up to 120 credits
                </p>
                {annual ? (
                  <div className="mb-4 flex flex-col gap-1">
                    <p className="m-0 text-[12.5px] text-muted-foreground">
                      billed as £1,790/year
                    </p>
                    <p className="m-0 text-[12.5px] font-semibold text-accent">Save £358</p>
                  </div>
                ) : null}
                <div className="b2b-div" />
                <ul className="b2b-feats">
                  <li className="b2b-feat">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 13 13"
                      fill="none"
                    >
                      <path
                        d="M2 6.5l3 3 6-6"
                        stroke="#126B3A"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Everything in Starter
                  </li>
                  <li className="b2b-feat">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 13 13"
                      fill="none"
                    >
                      <path
                        d="M2 6.5l3 3 6-6"
                        stroke="#126B3A"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    60 credits/month
                  </li>
                  <li className="b2b-feat">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 13 13"
                      fill="none"
                    >
                      <path
                        d="M2 6.5l3 3 6-6"
                        stroke="#126B3A"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Credits roll over up to 120
                  </li>
                  <li className="b2b-feat">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 13 13"
                      fill="none"
                    >
                      <path
                        d="M2 6.5l3 3 6-6"
                        stroke="#126B3A"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Priority support
                  </li>
                  <li className="b2b-feat">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 13 13"
                      fill="none"
                    >
                      <path
                        d="M2 6.5l3 3 6-6"
                        stroke="#126B3A"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Lead referrals from homeowners
                  </li>
                </ul>
                <button
                  type="button"
                  onClick={() =>
                    void handleSubscribe(
                      annual
                        ? STRIPE_PRODUCTS.subscriptions.proAnnual
                        : STRIPE_PRODUCTS.subscriptions.proMonthly,
                      annual,
                    )
                  }
                  className="btn-price-main"
                >
                  Get started
                </button>
              </div>
              <div className="b2b-card">
                <div className="b2b-plan">Agency</div>
                <div className="b2b-amt">{annual ? "£333" : "£399"}</div>
                <div className="b2b-per">/month</div>
                <p
                  className={cn(
                    "m-0 text-[13px] text-muted-foreground",
                    annual ? "mb-1" : "mb-4",
                  )}
                >
                  160 credits/month · Rollover up to 320 credits
                </p>
                {annual ? (
                  <div className="mb-4 flex flex-col gap-1">
                    <p className="m-0 text-[12.5px] text-muted-foreground">
                      billed as £3,990/year
                    </p>
                    <p className="m-0 text-[12.5px] font-semibold text-accent">Save £798</p>
                  </div>
                ) : null}
                <div className="b2b-div" />
                <ul className="b2b-feats">
                  <li className="b2b-feat">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 13 13"
                      fill="none"
                    >
                      <path
                        d="M2 6.5l3 3 6-6"
                        stroke="#126B3A"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Everything in Pro
                  </li>
                  <li className="b2b-feat">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 13 13"
                      fill="none"
                    >
                      <path
                        d="M2 6.5l3 3 6-6"
                        stroke="#126B3A"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    160 credits/month
                  </li>
                  <li className="b2b-feat">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 13 13"
                      fill="none"
                    >
                      <path
                        d="M2 6.5l3 3 6-6"
                        stroke="#126B3A"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Credits roll over up to 320
                  </li>
                  <li className="b2b-feat">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 13 13"
                      fill="none"
                    >
                      <path
                        d="M2 6.5l3 3 6-6"
                        stroke="#126B3A"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Priority support
                  </li>
                  <li className="b2b-feat">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 13 13"
                      fill="none"
                    >
                      <path
                        d="M2 6.5l3 3 6-6"
                        stroke="#126B3A"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Top-up credits available
                  </li>
                </ul>
                <a
                  href="mailto:hello@theplanningconsultant.com"
                  className="btn-price-outline"
                >
                  Get started
                </a>
              </div>
            </div>
            <p className="mt-6 text-[12.5px] text-muted-foreground text-center max-w-2xl mx-auto leading-relaxed">
              Top-up credit packs available for subscribers:
              <br className="hidden sm:inline" />{" "}
              <span className="sm:whitespace-nowrap">
                5 credits £35 · 15 credits £95 · 40 credits £219
              </span>
            </p>
            <p className="mt-4 text-[12.5px] text-muted-brand text-center">
              No commitment. Cancel anytime.
            </p>
          </div>
        </div>
      </div>

      {/* PLANNING GUIDES — COMING SOON */}
      <div
        className="bg-secondary border-t border-border py-12"
        id="guides"
      >
        <div className="max-w-5xl mx-auto px-6 md:px-8 text-center">
          <p className="text-accent text-xs font-bold uppercase tracking-widest mb-3">
            Planning guides
          </p>
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Expert planning guides coming soon
          </h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            We&apos;re publishing free planning guides covering permitted
            development, planning applications, and everything in between. Sign
            up to be notified when they launch.
          </p>
          <div className="flex w-full flex-col gap-3 justify-center sm:flex-row sm:items-stretch">
            <input
              type="email"
              placeholder="your@email.com"
              autoComplete="email"
              className={cn(inputClassName, "w-full sm:max-w-xs")}
            />
            <button
              type="button"
              className="min-h-11 w-full rounded-lg bg-gradient-to-br from-primary to-accent px-6 py-3 text-white font-semibold shadow-md transition-opacity hover:opacity-90 sm:w-auto"
            >
              Notify me
            </button>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="cta-wrap">
        <div className="cta-dots" />
        <div className="cta-inner">
          <h2 className="cta-h">
            Start with your postcode.
            <br />
            <span>Know in 60 seconds.</span>
          </h2>
          <div className="cta-acts">
            <a href="/check" className="btn-cta-lg">
              Check my postcode free
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2.5 7H11.5M8 4L11.5 7L8 10"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
            <a href="#pricing" className="btn-ghost-lg">
              View pricing
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

