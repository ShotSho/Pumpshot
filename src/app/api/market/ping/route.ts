import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mint } = body;

    if (!mint) {
      return NextResponse.json({ error: 'Mint is required' }, { status: 400 });
    }

    await prisma.activeStream.upsert({
      where: { mint },
      update: { lastPingAt: new Date() },
      create: { mint, lastPingAt: new Date() }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to ping active_streams', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
