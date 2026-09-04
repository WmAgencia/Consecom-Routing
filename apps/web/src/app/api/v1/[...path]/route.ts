import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.PUBLIC_API_URL || 'http://localhost:3001';

// Determina se deve usar proxy local ou API direta
const USE_LOCAL_PROXY = !process.env.NEXT_PUBLIC_API_URL;

async function handleRequest(request: NextRequest, pathSegments: string[]) {
  const url = `${API_BASE}/${pathSegments.join('/')}`;
  const searchParams = request.nextUrl.search;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Passa cookies para autenticação
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    // Pega body se houver
    let body: string | undefined;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      body = await request.text();
    }

    const response = await fetch(`${url}${searchParams}`, {
      method: request.method,
      headers,
      body: body ?? null,
      cache: 'no-store',
    });

    const data = await response.text();
    const newResponse = new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    });

    // Passa cookies de resposta
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      newResponse.headers.set('set-cookie', setCookie);
    }

    return newResponse;
  } catch (error) {
    return NextResponse.json({ error: 'API unavailable', details: String(error) }, { status: 503 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handleRequest(request, path);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handleRequest(request, path);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handleRequest(request, path);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handleRequest(request, path);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handleRequest(request, path);
}
