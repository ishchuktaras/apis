import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Zde už používáte Prismu
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password, fullName, salonName } = await req.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Chybí povinné údaje" },
        { status: 400 }
      );
    }

    // 1. Zkontrolujeme, zda uživatel neexistuje
    const existingUser = await prisma.users.findUnique({ // Změňte 'users' pokud se tabulka jmenuje 'profiles'
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Uživatel s tímto emailem již existuje" },
        { status: 400 }
      );
    }

    // 2. Zahashujeme heslo
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Vytvoříme uživatele v DB
    const user = await prisma.users.create({ // Opět, změňte 'users' dle vašeho schema.prisma
      data: {
        email,
        password: hashedPassword,
        full_name: fullName,
        salon_name: salonName,
        role: "owner", // Výchozí role
      },
    });

    return NextResponse.json({ message: "Uživatel vytvořen", userId: user.id });

  } catch (error) {
    console.error("Chyba registrace:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}