import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planning Constraint Check",
  description:
    "Enter any UK postcode to instantly check planning constraints including conservation areas, listed buildings, flood zones and permitted development rights.",
};

export default function CheckLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="check-logo-only-nav">{children}</div>
  );
}
