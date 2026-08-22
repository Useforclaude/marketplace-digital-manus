import { ArrowDownRight, ChevronRight } from "lucide-react";
import React from "react";
import type { StorefrontExperience } from "./storefrontAccess";

type StorefrontHeroActionsProps = {
  experience: StorefrontExperience;
  onVisitorStart: () => void;
};

export function StorefrontHeroActions({ experience, onVisitorStart }: StorefrontHeroActionsProps) {
  const primary = experience.primaryCta;
  return (
    <div className="mt-10 flex flex-wrap items-center gap-3">
      {primary.requiresLogin ? (
        <button type="button" onClick={onVisitorStart} className="gradient-cta group inline-flex items-center gap-3 rounded-full px-6 py-3.5 text-[11px] font-extrabold tracking-[0.12em] text-black">
          {primary.label} <ArrowDownRight size={15} className="transition-transform group-hover:translate-y-0.5 group-hover:translate-x-0.5" />
        </button>
      ) : (
        <a href={primary.href} className="gradient-cta group inline-flex items-center gap-3 rounded-full px-6 py-3.5 text-[11px] font-extrabold tracking-[0.12em] text-black">
          {primary.label} <ArrowDownRight size={15} className="transition-transform group-hover:translate-y-0.5 group-hover:translate-x-0.5" />
        </a>
      )}
      <a href={experience.secondaryCta.href} className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-black/20 px-5 py-3.5 text-[11px] font-bold tracking-[0.1em] text-white/88 backdrop-blur-sm transition-colors hover:border-white/40 hover:text-white">
        {experience.secondaryCta.label} <ChevronRight size={14} />
      </a>
    </div>
  );
}
