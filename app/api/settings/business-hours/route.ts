import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { tenant: true }
    });

    if (!user) return new NextResponse("Not found", { status: 404 });

    return NextResponse.json({
      id: user.id, // Potřebujeme ID pro frontend
      userName: user.fullName,
      email: user.email,
      salonName: user.tenant.name,
      salonSlug: user.tenant.slug,
      primaryColor: user.tenant.primaryColor,
      logoUrl: user.tenant.logoUrl || "" // Přidáno logo
    });

  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { userName, salonName, primaryColor, logoUrl } = body;

    await prisma.$transaction(async (tx) => {
      // 1. User update
      if (userName) {
        await tx.user.update({
          where: { email: session.user?.email! },
          data: { fullName: userName }
        });
      }

      // 2. Tenant update
      // @ts-ignore
      const tenantId = session.user.tenantId;
      
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
    return new NextResponse("Internal Error", { status: 500 });
  }
}