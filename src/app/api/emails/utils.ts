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
        content: "You are an email categorizer. Based on the email content, suggest ONE appropriate label from the following categories ONLY: Personal, Work, School, Finance, Shopping, Travel, Social, Newsletter, Promotion, Important, Other. Respond with JUST the category name, nothing else."
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