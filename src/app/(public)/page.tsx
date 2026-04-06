import "../landing-template.css";
import { Footer } from "@/components/layout/Footer";
import { Nav } from "@/components/layout/Nav";
import { LandingTemplate } from "@/components/landing/LandingTemplate";

export default function HomePage() {
  return (
    <>
      <Nav />
      <LandingTemplate />
      <Footer />
    </>
  );
}
