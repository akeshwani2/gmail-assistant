import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { gmail_v1 } from 'googleapis';
import { suggestLabel, createLabel, processEmail } from '../utils';

// Update interface to match Gmail API types
type GmailMessage = gmail_v1.Schema$Message;
type MessageAdded = gmail_v1.Schema$HistoryMessageAdded;

function extractEmailContent(message: any): string {
  let content = '';

  // Function to decode base64 content
  const decodeBase64 = (data: string) => {
    return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
  };

  // Function to extract text from parts recursively
  const extractFromParts = (parts: any[]) => {
    for (const part of parts) {
      if (part.mimeType === 'text/plain') {
        const body = part.body.data;
        if (body) {
          content += decodeBase64(body) + ' ';
        }
      } else if (part.parts) {
        extractFromParts(part.parts);
      }
    }
  };

  // Handle different message structures
  if (message.payload) {
    if (message.payload.body?.data) {
      content = decodeBase64(message.payload.body.data);
    } else if (message.payload.parts) {
      extractFromParts(message.payload.parts);
    }
  }

  return content.trim();
}

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
        q: 'is:unread has:nouserlabels newer_than:2d'  // Only process emails from last 2 days
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
        const subject = headers?.find(h => h.name === 'Subject')?.value || '';
        const from = headers?.find(h => h.name === 'From')?.value || '';
        const emailContent = extractEmailContent(email.data.payload);

        const emailContext = `
Subject: ${subject}
From: ${from}
Content: ${emailContent}
`;

        // Process the email content and suggest a label
        const suggestedLabel = await suggestLabel(emailContext);
        
        // Create and apply the label
        if (suggestedLabel) {
          const labelId = await createLabel(gmail, suggestedLabel);
          await gmail.users.messages.modify({
            userId: 'me',
            id: message.id!,
            requestBody: {
              addLabelIds: [labelId]
            }
          });
        }

        // Check if email should be flagged as important
        await processEmail(gmail, message.id!);
        processedEmails.push({
          messageId: message.id,
          appliedLabel: suggestedLabel
        });

        // After processing each message
        console.log(`Processed message ${message.id} with label: ${suggestedLabel}`);

        // After label is suggested
        console.log(`Email "${subject}" from ${from} labeled as: ${suggestedLabel}`);
      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error);
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