import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET: Načte nastavení profilu a salonu pro přihlášeného uživatele
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Díky tvému rozšíření typů TS ví, že email existuje, pokud je session validní
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { tenant: true }
    });

    if (!user) return new NextResponse("User not found", { status: 404 });

    return NextResponse.json({
      id: user.id,
      userName: user.fullName,
      email: user.email,
      salonName: user.tenant.name,
      salonSlug: user.tenant.slug,
      primaryColor: user.tenant.primaryColor,
      logoUrl: user.tenant.logoUrl || ""
    });

  } catch (error) {
    console.error("SETTINGS_GET_ERROR:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

/**
 * PATCH: Aktualizuje jméno uživatele a údaje o salonu (Tenant)
 */
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Validace přítomnosti emailu i tenantId ze session
    if (!session?.user?.email || !session?.user?.tenantId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { userName, salonName, primaryColor, logoUrl } = body;

    const tenantId = session.user.tenantId;
    const userEmail = session.user.email;

    // Transakce zajistí, že se buď uloží vše, nebo nic
    await prisma.$transaction(async (tx) => {
      // 1. Aktualizace uživatele
      if (userName) {
        await tx.user.update({
          where: { email: userEmail },
          data: { fullName: userName }
        });
      }

      // 2. Aktualizace údajů salonu (Tenant)
      await tx.tenant.update({
        where: { id: tenantId },
        data: { 
          name: salonName,
          primaryColor: primaryColor,
          logoUrl: logoUrl
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SETTINGS_PATCH_ERROR:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}