import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
  }

  const accessToken = authHeader.split(' ')[1];

  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10,
    });

    // Fetch full email details for each message
    const emails = await Promise.all(
      response.data.messages?.map(async (message) => {
        const email = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
        });
        
        const headers = email.data.payload?.headers;
        return {
          id: message.id,
          subject: headers?.find(h => h.name === 'Subject')?.value || 'No Subject',
          sender: headers?.find(h => h.name === 'From')?.value || 'Unknown',
          date: headers?.find(h => h.name === 'Date')?.value,
          snippet: email.data.snippet,
        };
      }) || []
    );

    return NextResponse.json(emails);
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
  }
}