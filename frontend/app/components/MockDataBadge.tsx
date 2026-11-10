"use client";

/**
 * The Mock data badge's entry point (rendered by app/layout.tsx). In mock mode it loads
 * the panel (MockDataPanel.tsx); with mock mode off it renders nothing and pulls in no
 * mock code, demo login or seed data (Prompt 2 flows E-F2, 2026-11-09).
 */
import dynamic from "next/dynamic";
import { MOCK_MODE } from "../lib/mockMode";

const MockDataPanel = dynamic(() => import("./MockDataPanel").then((mod) => mod.MockDataPanel), { ssr: false });

export function MockDataBadge() {
  return MOCK_MODE ? <MockDataPanel /> : null;
}
