import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  const tenantId = process.env.AZURE_TENANT_ID!;
  const clientId = process.env.AZURE_CLIENT_ID!;
  const clientSecret = process.env.AZURE_CLIENT_SECRET!;
  const scope = 'https://graph.microsoft.com/.default';

  try {
    // 1️⃣ Pegar token do Azure
    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope,
      })
    );

    const accessToken = tokenResponse.data.access_token;

    // 2️⃣ Pegar site pelo Graph API
    const siteResponse = await axios.get(
      'https://graph.microsoft.com/v1.0/sites/12tec.sharepoint.com:/sites/Documentao-12TECEngenharia',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    // 3️⃣ Pegar drive do site
    const driveResponse = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${siteResponse.data.id}/drive`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    return NextResponse.json({
      site: siteResponse.data,
      drive: driveResponse.data,
    });
  } catch (err: any) {
    console.error(err.response?.data || err.message);
    return NextResponse.json(
      { error: err.response?.data || err.message },
      { status: 500 }
    );
  }
}
