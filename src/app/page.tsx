import "./landing-template.css";
import { LandingTemplate } from "@/components/landing/LandingTemplate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planning Constraint Checker",
  description:
    "Free planning constraint check for any UK postcode. AI-powered reports from £29.",
};

export default function HomePage() {
  return <LandingTemplate />;
}
