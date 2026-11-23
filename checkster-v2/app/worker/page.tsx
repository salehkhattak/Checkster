import type { Metadata } from "next";
import { WorkerApp } from "@/components/worker/worker-app";

export const metadata: Metadata = {
  title: "Checkster Kaarigar — kaam payein, izzat ke saath",
  description: "For plumbers, mistris, painters and electricians: get jobs near you, see the problem before you go, and set your own price.",
};

export default function WorkerPage() {
  return <WorkerApp />;
}
