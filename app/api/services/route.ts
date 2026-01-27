import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface SessionUser {
  tenantId: string;
  [key: string]: string;
}

// GET: Načtení všech služeb pro aktuální salon
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // OPRAVA: Místo @ts-ignore použijeme přetypování
    const tenantId = (session.user as SessionUser).tenantId;

    const services = await prisma.service.findMany({
      where: { tenantId: tenantId },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error("CHYBA GET SERVICES:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST: Vytvoření nové služby
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // OPRAVA: Místo @ts-ignore použijeme přetypování
    const tenantId = (session.user as SessionUser).tenantId;
    
    const body = await req.json();
    const { name, price, durationMin, description } = body;

    if (!name || !price || !durationMin) {
      return new NextResponse("Chybí povinné údaje", { status: 400 });
    }

    const newService = await prisma.service.create({
      data: {
        name,
        price: parseFloat(price),
        durationMin: parseInt(durationMin),
        description: description || "",
        tenantId: tenantId
      }
    });

    return NextResponse.json(newService);

  } catch (error) {
    console.error("CHYBA POST SERVICE:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}