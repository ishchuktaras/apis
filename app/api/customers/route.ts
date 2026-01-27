import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return new NextResponse("Unauthorized", { status: 401 });

  try {
    // Načteme klienty a jejich rezervace z tvé nové DB
    const clients = await prisma.client.findMany({
      where: { tenantId: session.user.tenantId },
      include: {
        bookings: {
          include: { service: true },
          orderBy: { startTime: 'desc' }
        }
      }
    });

    // Zpracujeme data do formátu, který tvoje UI očekává
    const formattedCustomers = clients.map(client => {
      const totalVisits = client.bookings.filter(b => b.status !== 'CANCELLED').length;
      const totalSpent = client.bookings
        .filter(b => b.status !== 'CANCELLED')
        .reduce((sum, b) => sum + Number(b.service.price), 0);
      
      const lastBooking = client.bookings[0] ? {
        date: client.bookings[0].startTime.toISOString(),
        status: client.bookings[0].status,
        serviceName: client.bookings[0].service.name
      } : null;

      return {
        id: client.id,
        name: client.fullName,
        email: client.email || '',
        phone: client.phone,
        totalVisits,
        totalSpent,
        lastBooking
      };
    });

    return NextResponse.json(formattedCustomers);
  } catch (error) {
    console.error("CUSTOMERS_GET_ERROR:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}