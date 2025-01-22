import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function suggestLabel(emailContent: string): Promise<string> {
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