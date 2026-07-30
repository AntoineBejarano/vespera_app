import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(80).optional(),
  ageConfirmed: z.literal(true),
  adultConsent: z.literal(true),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          error:
            "Datos inválidos. Confirma que tienes 18+ y aceptas el consentimiento adulto.",
        },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json({ error: "Ya existe una cuenta con ese email" }, { status: 409 });
    }

    const passwordHash = await hash(parsed.data.password, 12);
    const now = new Date();

    const user = await prisma.user.create({
      data: {
        email,
        name: parsed.data.name ?? email.split("@")[0],
        passwordHash,
        ageVerifiedAt: now,
        adultConsentAt: now,
        settings: {
          create: {
            adultConsent: true,
            language: "es",
          },
        },
      },
    });

    return Response.json({ id: user.id, email: user.email });
  } catch (error) {
    console.error("[register]", error);
    return Response.json({ error: "No se pudo crear la cuenta" }, { status: 500 });
  }
}
