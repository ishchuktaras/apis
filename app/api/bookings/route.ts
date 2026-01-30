// app/api/bookings/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const bookings = await prisma.booking.findMany({
      where: { tenantId: session.user.tenantId },
      include: {
        service: true,
        client: true
      },
      orderBy: { startTime: 'asc' }
    });
    return NextResponse.json(bookings);
  } catch (error) {
    return new NextResponse("Error", { status: 500 });
  }
}