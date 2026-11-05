import { ReactNode } from 'react';
import { SectionId } from '../types';

interface InspectorProps {
  active: SectionId;
  onTab(id: SectionId): void;
  sections: { id: SectionId; label: string; node: ReactNode }[];
}

/** Phone: tabs with one section visible. Desktop (lg): all sections stacked in a 380 px column. */
export const Inspector = ({ active, onTab, sections }: InspectorProps) => (
  <aside className="flex min-h-0 flex-1 flex-col bg-surface lg:w-[380px] lg:flex-none lg:overflow-y-auto lg:border-l lg:border-line">
    <div role="tablist" aria-label="Settings" className="flex shrink-0 border-b border-line lg:hidden">
      {sections.map((s) => (
        <button
          key={s.id}
          type="button"
          role="tab"
          aria-selected={active === s.id}
          aria-controls={`section-${s.id}`}
          onClick={() => onTab(s.id)}
          className={`h-11 flex-1 border-b-2 text-sm font-medium ${
            active === s.id ? 'border-accent text-ink' : 'border-transparent text-ink-3'
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto lg:overflow-visible">
      {sections.map((s) => (
        <section
          key={s.id}
          id={`section-${s.id}`}
          role="tabpanel"
          className={`${active === s.id ? 'block' : 'hidden'} lg:block scroll-mt-2 border-b border-line px-5 pb-[18px] pt-4`}
        >
          {s.node}
        </section>
      ))}
    </div>
  </aside>
);
