import { ArrowDownRight, ChevronRight } from "lucide-react";
import React from "react";
import type { StorefrontExperience } from "./storefrontAccess";

type StorefrontHeroActionsV2Props = {
  experience: StorefrontExperience;
  onVisitorStart: () => void;
};

/** Paper Edition hero CTA pair — one vermillion commitment button, one quiet ink ghost. */
export function StorefrontHeroActionsV2({ experience, onVisitorStart }: StorefrontHeroActionsV2Props) {
  const primary = experience.primaryCta;
  return (
    <div className="mt-9 flex flex-wrap items-center gap-3">
      {primary.requiresLogin ? (
        <button type="button" onClick={onVisitorStart} className="v2-btn v2-btn-accent group px-7 py-4 text-[11px]">
          {primary.label}
          <ArrowDownRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
        </button>
      ) : (
        <a href={primary.href} className="v2-btn v2-btn-accent group px-7 py-4 text-[11px]">
          {primary.label}
          <ArrowDownRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
        </a>
      )}
      <a href={experience.secondaryCta.href} className="v2-btn v2-btn-ghost px-6 py-4 text-[11px]">
        {experience.secondaryCta.label}
        <ChevronRight size={14} />
      </a>
    </div>
  );
}
