// app/api/team/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  // Kontrola session a existence uživatele/tenantId
  if (!session?.user?.tenantId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const members = await prisma.user.findMany({
      where: { 
        tenantId: session.user.tenantId 
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        // Vynecháme heslo z bezpečnostních důvodů
      }
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("TEAM_GET_ERROR:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}