import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { google } from "googleapis";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "No authorization header" },
        { status: 401 }
      );
    }

    const accessToken = authHeader.split(" ")[1];
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Get recent emails for context
    const emails = await gmail.users.messages.list({
      userId: "me",
    });

    // Get full email details
    const emailDetails = await Promise.all(
      emails.data.messages?.map(async (message) => {
        const email = await gmail.users.messages.get({
          userId: "me",
          id: message.id!,
          format: "full",
        });

        const headers = email.data.payload?.headers;
        return {
          id: message.id,
          subject: headers?.find((h) => h.name === "Subject")?.value,
          from: headers?.find((h) => h.name === "From")?.value,
          date: headers?.find((h) => h.name === "Date")?.value,
          snippet: email.data.snippet,
        };
      }) || []
    );

    // Create context for OpenAI
    const emailContext = emailDetails
      .map(
        (email) =>
          `Email from ${email.from} with subject "${email.subject}" on ${email.date}: ${email.snippet}`
      )
      .join("\n");

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an intelligent email assistant with direct access to the user's Gmail inbox. 

When formatting responses:
- Use bullet points for lists
- Add line breaks between sections for readability
- Use **bold** for important information
- Keep responses clean and well-spaced
- Be concise but thorough
- Be conversational and helpful

When listing email details, format as:
• **From:** sender
• **Subject:** subject line
• **Date:** date
• **Summary:** brief description

Always end with a relevant follow-up question.`
        },
        {
          role: "user",
          content: `Here are my recent emails:\n${emailContext}\n\nUser question: ${message}`
        }
      ],
      temperature: 0.7,
    });

    return NextResponse.json({
      response: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error("Error in chat endpoint:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
