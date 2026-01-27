// app/api/booking/cancel/[id]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        service: true, // v schématu máš 'service'
        tenant: true,  // v schématu máš 'tenant'
        client: true   // v schématu máš 'client'
      }
    });

    if (!booking) return new NextResponse("Rezervace nenalezena", { status: 404 });

    return NextResponse.json({
      id: booking.id,
      booking_date: booking.startTime.toISOString().split('T')[0],
      start_time: booking.startTime.toISOString().split('T')[1].substring(0, 5),
      customer_name: booking.client.fullName,
      status: booking.status,
      services: { title: booking.service.name }, // v schématu máš 'name', ne 'title'
      profiles: { salon_name: booking.tenant.name, slug: booking.tenant.slug }
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Chyba serveru", { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.booking.update({
      where: { id: params.id },
      data: { status: 'CANCELLED' } // BookingStatus enum má 'CANCELLED'
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return new NextResponse("Chyba při aktualizaci", { status: 500 });
  }
}