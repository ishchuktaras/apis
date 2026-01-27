import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Načtení nastavení (Uživatel + Salon)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: {
        tenant: true // Přibalíme i data o salonu
      }
    });

    if (!user) {
      return new NextResponse("Uživatel nenalezen", { status: 404 });
    }

    // Vrátíme kombinovaná data
    return NextResponse.json({
      userName: user.fullName,
      email: user.email,
      salonName: user.tenant.name,
      salonSlug: user.tenant.slug,
      primaryColor: user.tenant.primaryColor
    });

  } catch (error) {
    console.error("CHYBA GET SETTINGS:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// PATCH: Uložení změn
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { userName, salonName, primaryColor } = body;

    // Transakce: Aktualizujeme uživatele I salon najednou
    await prisma.$transaction(async (tx) => {
      // 1. Update uživatele
      await tx.user.update({
        where: { email: session.user?.email! },
        data: { fullName: userName }
      });

      // 2. Update salonu (tenanta)
      // Potřebujeme ID salonu, získáme ho přes uživatele
      const user = await tx.user.findUnique({
        where: { email: session.user?.email! },
        select: { tenantId: true }
      });

      if (user?.tenantId) {
        await tx.tenant.update({
          where: { id: user.tenantId },
          data: { 
            name: salonName,
            primaryColor: primaryColor
          }
        });
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("CHYBA PATCH SETTINGS:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}