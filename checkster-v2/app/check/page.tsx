import { Suspense } from "react";
import type { Metadata } from "next";
import { CheckFlow } from "@/components/check/flow";

export const metadata: Metadata = {
  title: "Check my home — Checkster",
  description: "Photo, expert discussion, fair price and a kaarigar near you, step by step.",
};

export default function CheckPage() {
  return (
    <Suspense fallback={null}>
      <CheckFlow />
    </Suspense>
  );
}
