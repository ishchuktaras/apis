import { Resend } from 'resend';
import { NextResponse } from 'next/server';

// Ujisti se, že máš RESEND_API_KEY v souboru .env.local
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    // Rozbalení dat z požadavku (to, subject, html)
    const { to, subject, html } = await request.json();

    // Validace (jednoduchá)
    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Chybí povinné parametry (to, subject, html)' }, { status: 400 });
    }

    // Odeslání e-mailu přes Resend
    const data = await resend.emails.send({
      from: 'APIS <onboarding@resend.dev>', // Používáme testovací doménu Resend (ve free verzi nutné)
      to: [to], // POZOR: Ve free verzi zde musí být TVŮJ email (na který jsi se registroval na Resend.com)
      subject: subject,
      html: html,
    });

    // Vracíme odpověď s daty od Resend
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Chyba při odesílání emailu:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}