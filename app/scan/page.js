"use client";
import dynamic from "next/dynamic";

const ScanForm = dynamic(() => import("./ScanForm"), { ssr: false });

export default function ScanPage() {
  return <ScanForm />;
}
