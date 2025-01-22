import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { suggestLabel, createLabel } from '../utils';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
  }

  const accessToken = authHeader.split(' ')[1];

  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get initial historyId
    const profile = await gmail.users.getProfile({
      userId: 'me'
    });

    // Store this historyId in your application state
    const historyId = profile.data.historyId;

    return NextResponse.json({
      message: 'Email monitoring started',
      historyId: historyId
    });

  } catch (error) {
    console.error('Error setting up email watch:', error);
    return NextResponse.json({ 
      error: 'Failed to set up email monitoring', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}