import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { gmail_v1 } from 'googleapis';
import { suggestLabel, createLabel } from '../utils';

// Update interface to match Gmail API types
type GmailMessage = gmail_v1.Schema$Message;
type MessageAdded = gmail_v1.Schema$HistoryMessageAdded;

export async function POST(request: NextRequest) {
  try {
    const { lastHistoryId } = await request.json();
    console.log('Received request with historyId:', lastHistoryId);

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const accessToken = authHeader.split(' ')[1];
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    let messages = [];

    // Always get the current historyId from profile
    const profile = await gmail.users.getProfile({
      userId: 'me'
    });
    const currentHistoryId = profile.data.historyId;
    console.log('Current historyId from profile:', currentHistoryId);

    // If we have a valid lastHistoryId, try to use history
    if (lastHistoryId) {
      try {
        console.log('Checking history since:', lastHistoryId);
        const history = await gmail.users.history.list({
          userId: 'me',
          startHistoryId: lastHistoryId,
          historyTypes: ['messageAdded']
        });
        
        messages = (history.data.history || [])
          .flatMap(h => h.messagesAdded || [])
          .map(m => m.message)
          .filter((m): m is any => m !== undefined && m !== null);
        
        console.log('Found messages from history:', messages.length);
      } catch (historyError: any) {
        console.error('History error:', historyError);
        // Fall through to getting recent messages
      }
    }

    // If no messages from history, get recent messages with a higher limit
    if (messages.length === 0) {
      console.log('Falling back to recent messages');
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 10,
        q: 'is:unread has:nouserlabels'  // Only gets emails with no user labels
      });
      messages = response.data.messages || [];
      console.log('Found unprocessed messages:', messages.map(m => m.id)); // Log message IDs

      // If no messages need processing, return early
      if (messages.length === 0) {
        console.log('No new messages to process');
        return NextResponse.json({ 
          message: 'No new emails to process',
          newHistoryId: currentHistoryId
        });
      }
    }

    const processedEmails = [];

    // Process messages
    for (const message of messages) {
      try {
        console.log('Processing message:', message.id);
        const email = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full'
        });

        const headers = email.data.payload?.headers;
        const subject = headers?.find(h => h.name === 'Subject')?.value || 'No Subject';
        const from = headers?.find(h => h.name === 'From')?.value || 'Unknown Sender';
        const snippet = email.data.snippet || '';

        console.log(`Processing email: "${subject}" from ${from}`);

        const emailContent = `
          From: ${from}
          Subject: ${subject}
          Content: ${snippet}
        `;

        const suggestedLabel = await suggestLabel(emailContent);
        console.log(`AI suggested label: ${suggestedLabel}`);

        const labelId = await createLabel(gmail, suggestedLabel);
        console.log(`Label ID: ${labelId}`);

        await gmail.users.messages.modify({
          userId: 'me',
          id: message.id,
          requestBody: {
            addLabelIds: [labelId],
            removeLabelIds: []
          },
        });

        processedEmails.push({
          subject,
          from,
          label: suggestedLabel,
          timestamp: new Date().toLocaleString()
        });

        // After processing each message
        console.log(`Processed message ${message.id} with label: ${suggestedLabel}`);
      } catch (error) {
        console.error('Error processing message:', error);
      }
    }

    return NextResponse.json({
      message: 'Emails processed',
      processedEmails,
      newHistoryId: currentHistoryId
    });

  } catch (error) {
    console.error('Error in main process:', error);
    return NextResponse.json({ error: 'Failed to check emails' }, { status: 500 });
  }
}