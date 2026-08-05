import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { STRIPE_PLAN_ENV, priceIdForPlan } from "@/lib/stripe/catalog";
import { getAppUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import {
  PRIMARY_SUPERADMIN_EMAIL,
  isSuperadminUser,
} from "@/lib/platform/superadmin";
import { getSeoAutomationSettings } from "@/lib/platform/settings";
import {
  runSeoGenerationAction,
  updateSeoAutomationAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Superadmin",
  robots: { index: false, follow: false },
};

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      {hint ? <CardContent className="text-xs text-muted-foreground">{hint}</CardContent> : null}
    </Card>
  );
}

async function loadSeoGeneratedAdminData() {
  try {
    const [draftCount, publishedCount, recentRuns, recentPages] =
      await Promise.all([
        prisma.seoGeneratedPage.count({ where: { status: "draft" } }),
        prisma.seoGeneratedPage.count({ where: { status: "published" } }),
        prisma.seoGenerationRun.findMany({
          orderBy: { startedAt: "desc" },
          take: 5,
          select: {
            id: true,
            source: true,
            status: true,
            pagesAttempted: true,
            pagesCreated: true,
            pagesPublished: true,
            error: true,
            startedAt: true,
            finishedAt: true,
          },
        }),
        prisma.seoGeneratedPage.findMany({
          orderBy: { generatedAt: "desc" },
          take: 8,
          select: {
            id: true,
            slug: true,
            title: true,
            category: true,
            status: true,
            score: true,
            generatedAt: true,
            publishedAt: true,
          },
        }),
      ]);

    return {
      draftCount,
      publishedCount,
      recentRuns,
      recentPages,
    };
  } catch (error) {
    console.error("[admin] failed to load generated SEO data", { error });
    return {
      draftCount: 0,
      publishedCount: 0,
      recentRuns: [],
      recentPages: [],
    };
  }
}

async function loadAdminData() {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    userCount,
    newUserCount,
    workspaceCount,
    characterCount,
    publicPersonaCount,
    publicRegistryCount,
    adultWorkspaceCount,
    recentUsers,
    recentPublicPersonas,
    seoSettings,
    generatedSeo,
  ] = await Promise.all([
    prisma.user.count({ where: { isTelegramPeer: false } }),
    prisma.user.count({
      where: { isTelegramPeer: false, createdAt: { gte: last24h } },
    }),
    prisma.workspace.count(),
    prisma.character.count({ where: { archivedAt: null } }),
    prisma.character.count({
      where: { archivedAt: null, isPublic: true, isAdult: false },
    }),
    prisma.character.count({
      where: {
        archivedAt: null,
        isPublic: true,
        isAdult: false,
        slug: { not: null },
      },
    }),
    prisma.workspace.count({ where: { adultEnabled: true } }),
    prisma.user.findMany({
      where: { isTelegramPeer: false },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        createdAt: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        _count: { select: { workspaceMembers: true, characters: true } },
      },
    }),
    prisma.character.findMany({
      where: {
        archivedAt: null,
        isPublic: true,
        isAdult: false,
        slug: { not: null },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        slug: true,
        name: true,
        updatedAt: true,
        user: { select: { email: true, name: true } },
      },
    }),
    getSeoAutomationSettings(),
    loadSeoGeneratedAdminData(),
  ]);

  return {
    userCount,
    newUserCount,
    workspaceCount,
    characterCount,
    publicPersonaCount,
    publicRegistryCount,
    adultWorkspaceCount,
    recentUsers,
    recentPublicPersonas,
    seoSettings,
    generatedSeo,
  };
}

export default async function AdminPage() {
  const user = await getAppUser();
  if (!user) redirect("/handler/sign-in");
  if (
    !isSuperadminUser(user) ||
    user.email?.trim().toLowerCase() !== PRIMARY_SUPERADMIN_EMAIL
  ) {
    notFound();
  }

  const data = await loadAdminData();
  const seo = data.seoSettings;
  const stripePlans = Object.entries(STRIPE_PLAN_ENV).map(([plan, config]) => ({
    plan,
    ...config,
    priceId: priceIdForPlan(plan as keyof typeof STRIPE_PLAN_ENV),
  }));

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 border-b pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
              <ShieldCheck className="size-4" />
              Superadmin
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Platform control
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Secure operator cockpit for users, plans, public registry health,
              and the SEO automation kill switch.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/personas">Open app</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/registry">Registry</Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label="Users"
            value={data.userCount}
            hint={`${data.newUserCount} new in the last 24h`}
          />
          <Stat label="Workspaces" value={data.workspaceCount} />
          <Stat
            label="Personas"
            value={data.characterCount}
            hint={`${data.publicPersonaCount} public SFW`}
          />
          <Stat
            label="Registry pages"
            value={data.publicRegistryCount}
            hint={`${data.adultWorkspaceCount} After Dark workspaces enabled`}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader>
              <CardTitle>SEO automation</CardTitle>
              <CardDescription>
                Start paused. Autopublish should stay off until drafts prove
                repeatable quality.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateSeoAutomationAction} className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      seo.enabled
                        ? "bg-emerald-500/15 text-emerald-600"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {seo.enabled ? "Active" : "Paused"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Last updated {formatDate(seo.updatedAt)}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1.5 text-sm">
                    <span className="text-muted-foreground">Mode</span>
                    <select
                      name="mode"
                      defaultValue={seo.mode}
                      className="h-9 w-full rounded-lg border bg-background px-3 text-sm"
                    >
                      <option value="draft_only">Draft only</option>
                      <option value="autopublish">Autopublish after QA</option>
                    </select>
                  </label>
                  <label className="space-y-1.5 text-sm">
                    <span className="text-muted-foreground">Daily pages</span>
                    <input
                      name="dailyPageLimit"
                      type="number"
                      min={1}
                      max={25}
                      defaultValue={seo.dailyPageLimit}
                      className="h-9 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>
                  <label className="space-y-1.5 text-sm">
                    <span className="text-muted-foreground">
                      Daily budget cents
                    </span>
                    <input
                      name="dailyBudgetCents"
                      type="number"
                      min={0}
                      max={10000}
                      defaultValue={seo.dailyBudgetCents}
                      className="h-9 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>
                  <label className="space-y-1.5 text-sm">
                    <span className="text-muted-foreground">
                      Min publish score
                    </span>
                    <input
                      name="minPublishScore"
                      type="number"
                      min={50}
                      max={100}
                      defaultValue={seo.minPublishScore}
                      className="h-9 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>
                  <label className="space-y-1.5 text-sm">
                    <span className="text-muted-foreground">Writer model</span>
                    <input
                      name="writerModel"
                      defaultValue={seo.writerModel}
                      className="h-9 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>
                  <label className="space-y-1.5 text-sm">
                    <span className="text-muted-foreground">Reviewer model</span>
                    <input
                      name="reviewerModel"
                      defaultValue={seo.reviewerModel}
                      className="h-9 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button name="intent" value="save" type="submit">
                    Save settings
                  </Button>
                  <Button name="intent" value="start" type="submit" variant="outline">
                    Start
                  </Button>
                  <Button name="intent" value="pause" type="submit" variant="destructive">
                    Pause
                  </Button>
                </div>
              </form>

              <div className="mt-6 border-t pt-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Drafts</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {data.generatedSeo.draftCount}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Published</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {data.generatedSeo.publishedCount}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Last run</p>
                    <p className="mt-1 text-sm font-medium">
                      {data.generatedSeo.recentRuns[0]?.status ?? "Never"}
                    </p>
                  </div>
                </div>

                <form action={runSeoGenerationAction} className="mt-4">
                  <Button type="submit" variant="outline">
                    Generate draft now
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform plans</CardTitle>
              <CardDescription>
                Stripe plan wiring is env-driven today. This panel makes missing
                production price IDs visible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stripePlans.map((p) => (
                  <div
                    key={p.plan}
                    className="rounded-lg border p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{p.label}</p>
                        <p className="text-xs text-muted-foreground">
                          Max personas: {p.maxCharacters}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          p.priceId
                            ? "bg-emerald-500/15 text-emerald-600"
                            : "bg-amber-500/15 text-amber-700"
                        }`}
                      >
                        {p.priceId ? "Configured" : "Missing"}
                      </span>
                    </div>
                    <p className="mt-2 break-all text-xs text-muted-foreground">
                      {p.priceEnv}: {p.priceId ?? "not set"}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent users</CardTitle>
              <CardDescription>
                Operational view only. User mutation controls come next.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-4 font-medium">User</th>
                      <th className="py-2 pr-4 font-medium">Plan</th>
                      <th className="py-2 pr-4 font-medium">Usage</th>
                      <th className="py-2 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentUsers.map((u) => (
                      <tr key={u.id} className="border-t">
                        <td className="py-3 pr-4">
                          <p className="font-medium">{u.email ?? u.name ?? u.id}</p>
                          <p className="text-xs text-muted-foreground">
                            Stripe {u.stripeCustomerId ? "customer" : "not linked"}
                            {u.stripeSubscriptionId ? " · subscribed" : ""}
                          </p>
                        </td>
                        <td className="py-3 pr-4">{u.plan}</td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {u._count.characters} personas ·{" "}
                          {u._count.workspaceMembers} workspaces
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {formatDate(u.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent registry pages</CardTitle>
              <CardDescription>
                Real public DB personas only. Showcase demos are excluded.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.recentPublicPersonas.length ? (
                <div className="space-y-3">
                  {data.recentPublicPersonas.map((p) => (
                    <Link
                      key={p.id}
                      href={`/p/${p.slug}`}
                      className="block rounded-lg border p-3 text-sm transition hover:bg-muted/50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{p.name}</p>
                        <span className="text-xs text-muted-foreground">
                          /p/{p.slug}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        by {p.user.email ?? p.user.name ?? "Creator"} · updated{" "}
                        {formatDate(p.updatedAt)}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No real registry pages are published yet.
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader>
              <CardTitle>Generated SEO pages</CardTitle>
              <CardDescription>
                Drafts are not indexable. Published pages appear under
                /use-cases and in the sitemap.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.generatedSeo.recentPages.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs text-muted-foreground">
                      <tr>
                        <th className="py-2 pr-4 font-medium">Page</th>
                        <th className="py-2 pr-4 font-medium">Status</th>
                        <th className="py-2 pr-4 font-medium">Score</th>
                        <th className="py-2 font-medium">Generated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.generatedSeo.recentPages.map((page) => (
                        <tr key={page.id} className="border-t">
                          <td className="py-3 pr-4">
                            <p className="font-medium">{page.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {page.status === "published" ? (
                                <Link
                                  href={`/use-cases/${page.slug}`}
                                  className="hover:text-foreground"
                                >
                                  /use-cases/{page.slug}
                                </Link>
                              ) : (
                                `/use-cases/${page.slug}`
                              )}
                              {" · "}
                              {page.category}
                            </p>
                          </td>
                          <td className="py-3 pr-4">{page.status}</td>
                          <td className="py-3 pr-4">{page.score}</td>
                          <td className="py-3 text-muted-foreground">
                            {formatDate(page.generatedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No generated SEO pages yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generation runs</CardTitle>
              <CardDescription>
                Manual and cron executions, including errors from AI providers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.generatedSeo.recentRuns.length ? (
                <div className="space-y-3">
                  {data.generatedSeo.recentRuns.map((run) => (
                    <div key={run.id} className="rounded-lg border p-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">
                          {run.source} · {run.status}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(run.startedAt)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Attempted {run.pagesAttempted} · created{" "}
                        {run.pagesCreated} · published {run.pagesPublished}
                      </p>
                      {run.error ? (
                        <p className="mt-2 line-clamp-3 text-xs text-destructive">
                          {run.error}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No generation runs yet.
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
