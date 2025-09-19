import { NextResponse } from 'next/server';

export async function GET() {
  const response = NextResponse.redirect('/');
  response.cookies.delete({
    name: 'azure_token',
    path: '/', // opcional, mas bom manter
  });
  return response;
}
