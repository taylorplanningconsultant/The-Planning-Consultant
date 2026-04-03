"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/utils/cn";

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
        ".step,.tes-card,.blog-card,.price-card,.b2b-card,.pm-card",
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

  const trustedLogos = [
    "Apex Architecture",
    "Redfield Planning",
    "Urban Form Studio",
    "Meridian Developments",
    "Cornerstone Surveyors",
    "Northbank Planning",
    "Cedar & Co Consulting",
    "Beacon Design Partners",
    "Horizon Planning Group",
    "Maple Street Architects",
    "Stonebridge Surveying",
    "Linden Planning Services",
  ];

  return (
    <>
      <Nav />
      <div className="hero-wrap">
        <div className="hero-gradient" />
        <div className="hero-dot" />
        <div className="hero">
          <div>
            <div className="hero-badge fi-anim">
              <span className="badge-dot" />
              AI-powered planning guidance
            </div>
            <h1 className="hero-headline fi-anim d1">
              Know your planning
              <br />
              chances{" "}
              <span className="hl">
                before you
                <br />
                spend a penny
              </span>
            </h1>
            <p className="hero-sub fi-anim d2">
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
            <p className="hero-note fi-anim d4">
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

          <div className="hero-visual">
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
                <span className="rc-footer-txt">MyPlanningGuide</span>
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
          <div className="hero-stats fi-anim d4">
            <div>
              <div className="stat-val">12,400+</div>
              <div className="stat-lbl">Reports generated</div>
            </div>
            <div>
              <div className="stat-val">98%</div>
              <div className="stat-lbl">Data accuracy</div>
            </div>
            <div>
              <div className="stat-val">340+</div>
              <div className="stat-lbl">Architects on Pro</div>
            </div>
          </div>
        </div>
      </div>

      {/* LOGOS */}
      <div className="flex w-full justify-center px-6 text-center md:px-8">
        <span className="logos-lbl">Trusted by</span>
      </div>
      <div className="logos">
        <div className="logos-carousel-full">
          <div className="logos-carousel">
            <div className="logos-viewport">
              <div className="logos-track">
                {[...trustedLogos, ...trustedLogos].map((name, idx) => (
                  <span key={`${name}-${idx}`} className="logo-item">
                    {name}
                  </span>
                ))}
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
                <div className="fv-url">myplanningguide.co.uk/report/SE5-8RB</div>
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

      {/* TESTIMONIALS */}
      <div className="tes-wrap dot-bg-lg">
        <div className="section">
          <div
            className="sec-head"
            style={{
              textAlign: "center",
              maxWidth: 500,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <div className="sec-label">Trusted by thousands</div>
            <h2 className="sec-h">What our users say</h2>
          </div>
          <div className="tes-grid">
            <div className="tes-card">
              <div className="tes-stars">
                <span className="star">★</span>
                <span className="star">★</span>
                <span className="star">★</span>
                <span className="star">★</span>
                <span className="star">★</span>
              </div>
              <p className="tes-quote">
                &ldquo;Saved me £400 in pre-application fees before I even knew if the project was
                viable. Found out about an Article 4 direction that would have caused issues —
                checked in two minutes.&rdquo;
              </p>
              <div className="tes-author">
                <div className="t-avatar">S</div>
                <div>
                  <div className="t-name">Sarah M.</div>
                  <div className="t-role">Homeowner, South London</div>
                </div>
              </div>
            </div>
            <div className="tes-card">
              <div className="tes-stars">
                <span className="star">★</span>
                <span className="star">★</span>
                <span className="star">★</span>
                <span className="star">★</span>
                <span className="star">★</span>
              </div>
              <p className="tes-quote">
                &ldquo;I run preliminary site assessments for every project. This cuts my constraint
                research from 45 minutes to under two. The Pro tier pays for itself on the first
                project of the month.&rdquo;
              </p>
              <div className="tes-author">
                <div className="t-avatar">J</div>
                <div>
                  <div className="t-name">James T.</div>
                  <div className="t-role">Architect, Manchester</div>
                </div>
              </div>
            </div>
            <div className="tes-card">
              <div className="tes-stars">
                <span className="star">★</span>
                <span className="star">★</span>
                <span className="star">★</span>
                <span className="star">★</span>
                <span className="star">★</span>
              </div>
              <p className="tes-quote">
                &ldquo;The planning statement generator is the standout feature. First draft in 10
                minutes, accurately citing our LPA&apos;s local plan. Quality is better than I expected at
                this price point.&rdquo;
              </p>
              <div className="tes-author">
                <div className="t-avatar">R</div>
                <div>
                  <div className="t-name">Rebecca H.</div>
                  <div className="t-role">Planning Consultant, Bristol</div>
                </div>
              </div>
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
                Team seats and white-label report branding (Agency plan)
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
                API access for integration into your own workflow
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
                <div className="pm-val">340+</div>
                <div className="pm-lbl">Architects &amp; agents on Pro</div>
              </div>
              <div className="pm-card">
                <div className="pm-val">8</div>
                <div className="pm-lbl">Constraint categories checked</div>
              </div>
              <div className="pm-card">
                <div className="pm-val">£0</div>
                <div className="pm-lbl">Setup cost. Cancel anytime.</div>
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

          <div className="price-grid">
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
                  Basic constraint check (5 categories)
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
              <div className="price-per">One-off, per report</div>
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
              <div className="price-tier">Report + Statement</div>
              <div className="price-amount">
                <span className="price-cur">£</span>79
              </div>
              <div className="price-per">One-off bundle</div>
              <p className="price-desc">
                AI personalised report + planning statement draft citing your local planning policies.
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
                  Everything in Full Report
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
              <div className="inline-flex items-center rounded-lg border border-border p-1 gap-1 bg-secondary">
                <button
                  type="button"
                  onClick={() => setAnnual(false)}
                  className={cn(
                    "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                    !annual ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-background/80",
                  )}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setAnnual(true)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md px-3 py-2 sm:pl-4 sm:pr-3 text-sm font-medium transition-colors",
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
                    Save 2 months
                  </span>
                </button>
              </div>
            </div>
            <div className="b2b-grid">
              <div className="b2b-card">
                <div className="b2b-plan">Starter</div>
                <div className="b2b-amt">{annual ? "£49" : "£59"}</div>
                <div className="b2b-per">/month</div>
                {annual ? (
                  <div className="mb-4 flex flex-col gap-1">
                    <p className="m-0 text-[12.5px] text-muted-foreground">
                      billed as £590/year
                    </p>
                    <p className="m-0 text-[12.5px] font-semibold text-accent">Save £118</p>
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
                    10 AI reports / month
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
                    3 statements / month
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
                    1 seat
                  </li>
                </ul>
                <a href="/signup?plan=starter" className="btn-price-outline">
                  Start free trial
                </a>
              </div>
              <div className="b2b-card b2b-card-mid">
                <div className="b2b-plan">Pro</div>
                <div className="b2b-amt">{annual ? "£107" : "£129"}</div>
                <div className="b2b-per">/month</div>
                {annual ? (
                  <div className="mb-4 flex flex-col gap-1">
                    <p className="m-0 text-[12.5px] text-muted-foreground">
                      billed as £1,290/year
                    </p>
                    <p className="m-0 text-[12.5px] font-semibold text-accent">Save £258</p>
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
                    40 AI reports / month
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
                    15 statements / month
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
                    1 seat
                  </li>
                </ul>
                <a href="/signup?plan=pro" className="btn-price-main">
                  Start free trial
                </a>
              </div>
              <div className="b2b-card">
                <div className="b2b-plan">Agency</div>
                <div className="b2b-amt">{annual ? "£249" : "£299"}</div>
                <div className="b2b-per">/month</div>
                {annual ? (
                  <div className="mb-4 flex flex-col gap-1">
                    <p className="m-0 text-[12.5px] text-muted-foreground">
                      billed as £2,990/year
                    </p>
                    <p className="m-0 text-[12.5px] font-semibold text-accent">Save £598</p>
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
                    100 AI reports / month
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
                    40 statements / month
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
                    5 seats
                  </li>
                </ul>
                <a href="/contact?plan=agency" className="btn-price-outline">
                  Contact us
                </a>
              </div>
            </div>
            <p className="mt-4 text-[12.5px] text-muted-brand text-center">
              All professional plans include a 14-day free trial. No credit card
              required to start.
            </p>
          </div>
        </div>
      </div>

      {/* BLOG */}
      <div className="blog-wrap" id="guides">
        <div className="section">
          <div className="blog-header">
            <div>
              <div className="sec-label">Planning guides</div>
              <h2 className="sec-h" style={{ marginBottom: 0 }}>
                Free guides from planning experts
              </h2>
            </div>
            <a href="/blog" className="btn-outline-sm">
              All guides
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2.5 6H9.5M6.5 3L9.5 6L6.5 9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
          <div className="blog-grid">
            <a
              href="/blog/planning-permission-rear-extension"
              className="blog-card"
            >
              <div className="blog-cat">Extensions</div>
              <div className="blog-title">
                Do I Need Planning Permission for a Rear Extension?
              </div>
              <div className="blog-exc">
                Permitted development rules, size limits, and when you&apos;ll need a full application
                — explained in plain English.
              </div>
              <div className="blog-meta">5 min read · John Smith, MRTPI</div>
            </a>
            <a
              href="/blog/planning-constraints-explained"
              className="blog-card"
            >
              <div className="blog-cat">Constraints</div>
              <div className="blog-title">
                How to Check Planning Constraints on Any UK Property
              </div>
              <div className="blog-exc">
                Conservation areas, Article 4 directions, flood zones — what they mean and how to
                check before you start.
              </div>
              <div className="blog-meta">7 min read · John Smith, MRTPI</div>
            </a>
            <a
              href="/blog/what-is-a-planning-statement"
              className="blog-card"
            >
              <div className="blog-cat">Applications</div>
              <div className="blog-title">
                What is a Planning Statement and Do You Need One?
              </div>
              <div className="blog-exc">
                When it&apos;s required, what it should include, and how AI is making them accessible to
                everyone.
              </div>
              <div className="blog-meta">6 min read · John Smith, MRTPI</div>
            </a>
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

      <Footer />
    </>
  );
}

