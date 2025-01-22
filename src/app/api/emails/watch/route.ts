import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function createLabel(gmail: any, labelName: string) {
  try {
    // First, list all labels to check if it exists
    const labels = await gmail.users.labels.list({
      userId: 'me',
    });

    // Find if label already exists
    const existingLabel = labels.data.labels?.find(
      (label: any) => label.name.toLowerCase() === labelName.toLowerCase()
    );

    if (existingLabel) {
      return existingLabel.id;
    }

    // Create new label if it doesn't exist
    const response = await gmail.users.labels.create({
      userId: 'me',
      requestBody: {
        name: labelName,
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show',
        // Add color to make it more visible
        color: {
          backgroundColor: '#000000',
          textColor: '#ffffff'
        }
      },
    });

    return response.data.id;
  } catch (error) {
    console.error('Error managing label:', error);
    throw error;
  }
}

async function suggestLabel(emailContent: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "You are an email categorizer. Based on the email content, suggest ONE appropriate label from the following categories ONLY: Personal, Work, Finance, Shopping, Travel, Social, Newsletter, Promotion, Important, Other. Respond with JUST the category name, nothing else."
      },
      {
        role: "user",
        content: emailContent
      }
    ],
    temperature: 0.3,
  });

  return completion.choices[0].message.content?.trim() || 'Other';
}

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

    // Get the latest email
    const messages = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 1,
    });

    if (!messages.data.messages?.length) {
      return NextResponse.json({
        message: 'No emails found'
      });
    }

    const email = await gmail.users.messages.get({
      userId: 'me',
      id: messages.data.messages[0].id!,
    });

    const headers = email.data.payload?.headers;
    const subject = headers?.find(h => h.name === 'Subject')?.value || 'No Subject';
    const from = headers?.find(h => h.name === 'From')?.value || 'Unknown Sender';
    const snippet = email.data.snippet || '';

    // Combine email details for better context
    const emailContent = `
      From: ${from}
      Subject: ${subject}
      Content: ${snippet}
    `;

    // Get AI suggested label
    const suggestedLabel = await suggestLabel(emailContent);
    console.log('Suggested label:', suggestedLabel);

    // Create/get label ID
    const labelId = await createLabel(gmail, suggestedLabel);
    console.log('Label ID:', labelId);

    // Remove any existing auto-labels first (optional)
    const existingLabels = email.data.labelIds || [];
    const autoLabels = ['Personal', 'Work', 'Finance', 'Shopping', 'Travel', 
                       'Social', 'Newsletter', 'Promotion', 'Important', 'Other'];
    const labelsToRemove = existingLabels.filter(labelId => {
      const label = labelId.toLowerCase();
      return autoLabels.some(autoLabel => label.includes(autoLabel.toLowerCase()));
    });

    // Apply the new label
    await gmail.users.messages.modify({
      userId: 'me',
      id: messages.data.messages[0].id!,
      requestBody: {
        removeLabelIds: labelsToRemove,
        addLabelIds: [labelId],
      },
    });

    return NextResponse.json({
      message: 'Email labeled successfully',
      appliedLabel: suggestedLabel,
      emailSubject: subject
    });

  } catch (error) {
    console.error('Error processing email:', error);
    return NextResponse.json({ 
      error: 'Failed to process email', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}