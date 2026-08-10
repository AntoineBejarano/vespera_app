import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BrainCircuit, GraduationCap, Plus } from "lucide-react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { professionalRole } from "@/lib/professionals";

export type ProfessionalWorkspaceItem = {
  id: string;
  name: string;
  tagline: string | null;
  categories: string[];
  coverUrl: string | null;
  memoryCount: number;
};

export function ProfessionalsWorkspace({
  professionals,
}: {
  professionals: ProfessionalWorkspaceItem[];
}) {
  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Professionals"
        description="Professors, coaches and experts with continuous memory, evidence and voice."
        actions={
          <Button asChild>
            <Link href="/personas/new">
              <Plus className="size-4" /> Create professional
            </Link>
          </Button>
        }
      />

      {professionals.length ? (
        <ul className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {professionals.map((professional) => (
            <li key={professional.id} className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="relative aspect-[16/8] overflow-hidden border-b border-border bg-muted">
                {professional.coverUrl ? (
                  <Image
                    src={professional.coverUrl}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover object-top"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-[var(--accent)]">
                    <GraduationCap className="size-9" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="truncate text-base font-semibold">{professional.name}</h2>
                  <Badge variant="secondary">{professionalRole(professional.categories)}</Badge>
                </div>
                <p className="mt-2 min-h-10 text-sm leading-5 text-muted-foreground">
                  {professional.tagline || "A persistent professional mind for focused work."}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <BrainCircuit className="size-3.5" /> {professional.memoryCount} memories
                  </span>
                  <Button asChild size="sm">
                    <Link href={`/professionals/session?characterId=${professional.id}`}>
                      Open <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-10 border-y border-border py-14 text-center">
          <GraduationCap className="mx-auto size-8 text-[var(--accent)]" />
          <h2 className="mt-4 text-xl font-semibold">No professional profiles yet</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            Add the category teacher, professor, coach, mentor, advisor or professional to a persona.
          </p>
          <Button asChild className="mt-5">
            <Link href="/personas/new">Create the first professional</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
