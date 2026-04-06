import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planning Statement Generator",
  description:
    "Generate a professional planning statement for your project. Site-specific, LPA-referenced, £79 one-off.",
};

export default function StatementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
