import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Načtení nastavení (Uživatel + Salon)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Tato kontrola "ujišťuje" TypeScript, že user existuje
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }, // ODSTRANĚNO: ?. a !
      include: {
        tenant: true
      }
    });

    if (!user) {
      return new NextResponse("Uživatel nenalezen", { status: 404 });
    }

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
    
    // Opět: kontrolujeme email přímo zde
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { userName, salonName, primaryColor } = body;

    // Email si uložíme do konstanty, abychom nemuseli opakovat session.user.email
    const userEmail = session.user.email;

    await prisma.$transaction(async (tx) => {
      // 1. Update uživatele
      await tx.user.update({
        where: { email: userEmail }, // ČISTÉ: bez ?. a !
        data: { fullName: userName }
      });

      // 2. Update salonu (tenanta)
      const user = await tx.user.findUnique({
        where: { email: userEmail }, // ČISTÉ: bez ?. a !
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