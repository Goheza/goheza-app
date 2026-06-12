// app/api/resolve-tiktok/route.ts

import { NextResponse } from 'next/server';
import { resolveTikTokUrl } from '@/lib/tiktokURL';

export async function POST(req: Request) {
  const { url } = await req.json();

  const resolvedUrl = await resolveTikTokUrl(url);

  return NextResponse.json({
    resolvedUrl,
  });
}