
import { Payload } from '../types';

export const encodePayload = (payload: Payload): string => {
  const { data, senderEmail, senderWalletUid } = payload;
  const params = new URLSearchParams();
  
  params.set("type", payload.type);
  params.set("to", senderEmail || "");
  params.set("from_uid", senderWalletUid || "");
  params.set("amt", (data.amount || 0).toString());
  params.set("cur", (data.currency || "USD").toUpperCase());
  params.set("date", data.originDate || new Date(payload.timestamp).toISOString().split('T')[0]);
  params.set("ref_str", data.reference || "");
  params.set("tx_type", data.type || "");
  params.set("tx_id", data.id || "");
  
  if (data.relatedTransactionId) params.set("ref", data.relatedTransactionId);

  const iouUri = `iou:1?${params.toString()}`;
  return btoa(encodeURIComponent(iouUri));
};

export const decodePayload = (base64: string): Payload | null => {
  try {
    const iouUri = decodeURIComponent(atob(base64));
    if (!iouUri.startsWith('iou:1?')) return null;
    
    const queryString = iouUri.split('?')[1];
    const params = new URLSearchParams(queryString);
    
    return {
      type: params.get("type") as any || 'REQUEST',
      senderEmail: params.get("to") || "",
      senderWalletUid: params.get("from_uid") || "",
      timestamp: Date.now(),
      data: {
        id: params.get("tx_id") || "",
        type: params.get("tx_type") as any,
        amount: parseFloat(params.get("amt") || "0"),
        currency: params.get("cur") || "USD",
        originDate: params.get("date") || "",
        reference: params.get("ref_str") || "",
        relatedTransactionId: params.get("ref") || undefined
      }
    };
  } catch (error) {
    console.error("Failed to decode payload:", error);
    return null;
  }
};

export const generateDccUrl = (payload: Payload): string => {
  const base64 = encodePayload(payload);
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}#data=${base64}`;
};

export const getPayloadFromUrl = (): Payload | null => {
  const hash = window.location.hash;
  if (!hash.startsWith('#data=')) return null;
  const base64 = hash.replace('#data=', '');
  return decodePayload(base64);
};

export const clearUrlHash = () => {
  window.history.replaceState(null, '', window.location.pathname);
};

export const formatDateToISOString = (date: string | Date): string => {
  let d: Date;
  if (typeof date === 'string') {
    d = new Date(date);
  } else {
    d = date;
  }
  return d.toISOString().split('T')[0];
};
