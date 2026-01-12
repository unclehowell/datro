
import { GoogleGenAI } from "@google/genai";
import { Transaction, TransactionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateEmailDraft = async (
  transaction: Transaction,
  url: string,
  userEmail: string
): Promise<string> => {
  const isUOM = transaction.type === TransactionType.UOM;
  const typeLabel = isUOM ? "Requesting Payment (UOM)" : "Issuing Debt Note (IOU)";
  
  const prompt = `Write a professional but friendly email for a Peer-to-Peer debt reconciliation app called DCC.
  Sender: ${userEmail}
  Transaction Type: ${typeLabel}
  Amount: ${transaction.amount} ${transaction.currency}
  Reference: ${transaction.reference || 'Personal'}
  Confirmation Link: ${url}

  The email should explain that this is a digital pledge being recorded in the sender's client-side ledger and requires the recipient's acknowledgement to "close the circle."
  
  Format the output as plain text suitable for an email body. Start with a clear subject-line-ready opening sentence.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || `Hi, I've recorded a ${typeLabel} of ${transaction.amount} ${transaction.currency} in my DCC ledger. Please click here to confirm or reject this record: ${url}`;
  } catch (err) {
    console.error("Gemini Error:", err);
    return `Hi,\n\nI'm using DCC to track our recent transaction. I've logged a ${typeLabel} for ${transaction.amount} ${transaction.currency}.\n\nPlease click the link below to confirm this in your own local wallet and reconcile our balances:\n\n${url}\n\nBest regards,\n${userEmail}`;
  }
};
