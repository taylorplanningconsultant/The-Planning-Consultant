import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Check Planning Constraints",
  description:
    "Check planning constraints for your UK postcode. Free basic check, full AI report from £29.",
};

export default function CheckLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
