import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface SessionUser {
  tenantId: string;
  [key: string]: string | number | boolean | null | undefined;
}

// PATCH: Úprava služby (nebo Soft Delete)
export async function PATCH(
  req: Request,
  { params }: { params: { serviceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { serviceId } = params;

    // Ověříme, zda služba patří tenantovi uživatele (bezpečnost)
    const existingService = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    // Získáme tenantId bezpečně pomocí přetypování (stejně jako v POST)
    const userTenantId = (session.user as SessionUser).tenantId;

   
    if (!existingService || existingService.tenantId !== userTenantId) {
      return new NextResponse("Not found or unauthorized", { status: 404 });
    }

    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: {
        name: body.title, // Mapujeme title z frontendu na name v DB
        price: body.price ? parseFloat(body.price) : undefined,
        durationMin: body.duration ? parseInt(body.duration) : undefined,
        description: body.description,
        isActive: body.isActive // Pro mazání (soft delete)
      }
    });

    return NextResponse.json(updatedService);

  } catch (error) {
    console.error("CHYBA PATCH SERVICE:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}