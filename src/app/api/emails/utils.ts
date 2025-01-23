import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Add these type definitions at the top
interface GmailHeader {
  name: string;
  value: string;
}

interface GmailMessage {
  data: {
    id: string;
    payload?: {
      headers?: GmailHeader[];
    };
    snippet?: string;
  };
}

export async function suggestLabel(emailContent: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an email categorizer. Based on the email content, suggest ONE appropriate label from these categories:
- Work (for job-related, professional, or business emails)
- School (for education-related content)
- Finance (for banking, payments, investments)
- Shopping (for purchases, orders, receipts)
- Travel (for trips, bookings, itineraries)
- Social (for personal communications, events, social activities)
- Newsletter (for subscriptions, updates, digests)
- Promotion (for marketing, sales, offers)
- Personal (for private matters)
- Important (for urgent or critical matters)
- Miscellaneous (only if no Miscellaneous category clearly fits)

Respond with JUST the category name, nothing else. Be decisive and avoid using "Miscellaneous" unless absolutely necessary.`
        },
        {
          role: "user",
          content: emailContent
        }
      ],
      temperature: 0.1,
      max_tokens: 10,
    });

    return completion.choices[0].message.content?.trim() || 'Miscellaneous';
  } catch (error) {
    console.error('Error suggesting label:', error);
    return 'Miscellaneous';
  }
}

export async function createLabel(gmail: any, labelName: string) {
  try {
    const labels = await gmail.users.labels.list({
      userId: 'me',
    });

    const existingLabel = labels.data.labels?.find(
      (label: any) => label.name.toLowerCase() === labelName.toLowerCase()
    );

    if (existingLabel) {
      console.log(`Using existing label: ${labelName}`);
      return existingLabel.id;
    }

    console.log(`Creating new label: ${labelName}`);
    const response = await gmail.users.labels.create({
      userId: 'me',
      requestBody: {
        name: labelName,
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show',
        color: {
          backgroundColor: '#666666',
          textColor: '#ffffff'
        }
      },
    });

    console.log(`Label created with ID: ${response.data.id}`);
    return response.data.id;
  } catch (error: any) {
    console.error('Error managing label:', error);
    if (error?.response?.data) {
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

export async function starEmail(gmail: any, messageId: string) {
  try {
    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds: ['STARRED']
      }
    });
    console.log(`Starred email: ${messageId}`);
  } catch (error) {
    console.error('Error starring email:', error);
    throw error;
  }
}

export async function flagImportantEmails(gmail: any, messageId: string, criteria: {
  sender?: string;
  subject?: string;
  contains?: string[];
}) {
  try {
    const message: GmailMessage = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
    });

    const headers = message.data.payload?.headers;
    const from = headers?.find((h: GmailHeader) => h.name === 'From')?.value || '';
    const subject = headers?.find((h: GmailHeader) => h.name === 'Subject')?.value || '';
    const content = message.data.snippet || '';

    // Check if email matches criteria
    const shouldFlag = 
      (criteria.sender && from.includes(criteria.sender)) ||
      (criteria.subject && subject.includes(criteria.subject)) ||
      (criteria.contains && criteria.contains.some(term => content.includes(term)));

    if (shouldFlag) {
      // Add both a star and the important label
      await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: ['STARRED', 'IMPORTANT']
        }
      });
      console.log(`Flagged important email: ${messageId}`);
    }
  } catch (error) {
    console.error('Error flagging email:', error);
    throw error;
  }
}

export async function processEmail(gmail: any, messageId: string) {
  try {
    // Define your criteria for important emails
    const importantCriteria = {
      sender: ['boss@company.com', 'important@client.com'],
      subject: ['urgent', 'important', 'deadline'],
      contains: ['meeting', 'priority', 'asap']
    };

    // Flag emails matching criteria
    await flagImportantEmails(gmail, messageId, {
      sender: importantCriteria.sender.join('|'),
      subject: importantCriteria.subject.join('|'),
      contains: importantCriteria.contains
    });

    // You can also star specific emails directly
    // await starEmail(gmail, messageId);

  } catch (error) {
    console.error('Error processing email:', error);
    throw error;
  }
}