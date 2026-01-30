// app/api/send-email/route.ts
import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { to, subject, html } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Chybí povinné parametry' }, { status: 400 });
    }

    // Konfigurace transportu (údaje budou v .env)
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT) || 465,
      secure: true, // true pro port 465, false pro ostatní
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: `"APIS SaaS" <${process.env.EMAIL_SERVER_USER}>`,
      to,
      subject,
      html,
    });

    return NextResponse.json({ success: true, messageId: info.messageId });

  } catch (error: unknown) {
    console.error('Chyba při odesílání přes SMTP:', error);
    const errorMessage = error instanceof Error ? error.message : 'Neznámá chyba';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}