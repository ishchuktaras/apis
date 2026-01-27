import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      include: {
        services: { where: { isActive: true } },
        users: { select: { id: true, fullName: true, role: true } },
        businessHours: true,
      },
    });

    if (!tenant) {
      return new NextResponse("Salon nenalezen", { status: 404 });
    }

    return NextResponse.json({
      profile: {
        id: tenant.id,
        salon_name: tenant.name,
        address: "Adresa v přípravě", // Můžeš přidat do schématu později
        phone: "Telefon v přípravě",
        logo_url: tenant.logoUrl,
        slug: tenant.slug,
      },
      services: tenant.services,
      staff: tenant.users,
      businessHours: tenant.businessHours,
    });
  } catch (error) {
    console.error("PUBLIC_SALON_GET_ERROR:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}