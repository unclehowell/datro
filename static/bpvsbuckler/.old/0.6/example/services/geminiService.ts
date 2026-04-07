import { GoogleGenAI, Type } from "@google/genai";
import { Data } from "@measured/puck";

// Initialize Gemini
// NOTE: In a production environment, this should be proxied through a backend
// to avoid exposing the API Key. For this demo, we use process.env.API_KEY.
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Generates Puck-compatible JSON content based on a user prompt.
 */
export const generatePuckContent = async (prompt: string, currentData: Data): Promise<Data> => {
  const ai = getAiClient();
  
  if (!ai) {
    alert("API Key missing. Please check your environment configuration.");
    return currentData;
  }

  try {
    // We strictly define the schema so Gemini returns valid Puck JSON structure
    // matching our HeadingBlock and TextBlock components.
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: `
        You are a CMS content generator helper. 
        The user wants to generate content for a website about "Great House Farm" or general web content.
        
        Current Content Context: ${JSON.stringify(currentData.content.map(c => c.type))}
        User Request: ${prompt}

        Generate a JSON object representing the page content.
        The content array must only contain objects with the following shapes:
        
        1. HeadingBlock: { "type": "HeadingBlock", "props": { "title": "String" } }
        2. TextBlock: { "type": "TextBlock", "props": { "title": "Optional String", "content": "String (Markdown supported)" } }

        Return a JSON object with a "content" array.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            content: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ["HeadingBlock", "TextBlock"] },
                  props: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      content: { type: Type.STRING },
                      id: { type: Type.STRING }
                    },
                    required: [] // Allow flexible props based on type
                  }
                },
                required: ["type", "props"]
              }
            }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from AI");
    }

    const generatedData = JSON.parse(resultText);
    
    // Merge new content with existing content or replace? 
    // Puck's AI behavior usually replaces or appends. 
    // Here we return the full new data structure keeping the root props.
    return {
      ...currentData,
      content: [...currentData.content, ...generatedData.content]
    };

  } catch (error) {
    console.error("Error generating content with Gemini:", error);
    alert("Failed to generate content. See console for details.");
    return currentData;
  }
};