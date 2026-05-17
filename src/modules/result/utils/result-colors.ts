import type {
  FinalViability,
  ResultImpact,
  ResultTone,
} from "@/src/modules/result/api/result.types";

export const toneClasses: Record<ResultTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  danger: "border-red-200 bg-red-50 text-red-700",
  neutral: "border-labora-ui bg-white text-labora-gray",
  info: "border-labora-mint bg-labora-mint/20 text-labora-deep",
};

export const viabilityClasses: Record<FinalViability["color"], string> = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-800",
  yellow: "border-amber-200 bg-amber-50 text-amber-900",
  orange: "border-orange-200 bg-orange-50 text-orange-800",
  red: "border-red-200 bg-red-50 text-red-700",
  gray: "border-labora-ui bg-labora-ivory text-labora-gray",
};

export const viabilityRingClasses: Record<FinalViability["color"], string> = {
  green: "border-emerald-400 text-emerald-800",
  yellow: "border-amber-400 text-amber-900",
  orange: "border-orange-400 text-orange-800",
  red: "border-red-400 text-red-700",
  gray: "border-labora-ui text-labora-gray",
};

export const impactClasses: Record<ResultImpact, string> = {
  high: "border-red-200 bg-red-50 text-red-700",
  medium: "border-amber-200 bg-amber-50 text-amber-900",
  low: "border-labora-mint bg-labora-mint/20 text-labora-deep",
  none: "border-labora-ui bg-white text-labora-gray",
};
