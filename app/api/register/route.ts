import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, salonName } = body;

    if (!email || !password || !name || !salonName) {
      return new NextResponse("Chybí povinné údaje", { status: 400 });
    }

    // 1. Ověříme, zda už email neexistuje
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return new NextResponse("Uživatel s tímto emailem již existuje", { status: 409 });
    }

    // 2. Zahashujeme heslo
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3. Vytvoříme slug pro salon (např. "Muj Salon" -> "muj-salon")
    // Přidáme náhodné číslo pro unikátnost
    const slug = salonName.toLowerCase().replace(/ /g, '-') + '-' + Math.floor(Math.random() * 10000);

    // 4. TRANSAKCE: Musíme vytvořit Salon (Tenant) A Uživatele najednou
    const user = await prisma.$transaction(async (tx) => {
      // A) Vytvoření Salonu
      const newTenant = await tx.tenant.create({
        data: {
          name: salonName,
          slug: slug,
          // primaryColor je nastaven defaultně v DB
        }
      });

      // B) Vytvoření Uživatele spojeného se salonem
      const newUser = await tx.user.create({
        data: {
          email,
          fullName: name,
          hashedPassword,
          role: "OWNER", // První uživatel je vždy majitel
          tenantId: newTenant.id
        }
      });

      return newUser;
    });

    return NextResponse.json(user);

  } catch (error: unknown) {
    console.error("CHYBA REGISTRACE:", error);
    const errorMessage = error instanceof Error ? error.message : "Neznámá chyba";
    return new NextResponse("Interní chyba serveru: " + errorMessage, { status: 500 });
  }
}