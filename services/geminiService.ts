
import { GoogleGenAI } from "@google/genai";
import { APP_CONFIG } from "../constants";

function getMimeType(dataUrl: string): string {
  if (dataUrl.startsWith('data:')) {
    const match = dataUrl.match(/^data:([^;]+);base64,/);
    return match ? match[1] : "image/png";
  }
  return "image/png";
}

function getCleanBase64(dataUrl: string): string {
  return dataUrl.replace(/^data:[^;]+;base64,/, "");
}

/**
 * Analysiert das Bild des Nutzers für eine Größenempfehlung.
 */
export async function estimateSizeFromImage(userBase64: string, productName: string): Promise<string> {
  try {
    // Strikt nach Vorgabe initialisieren
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: APP_CONFIG.MODEL_NAME,
      contents: {
        parts: [
          { 
            inlineData: { 
              data: getCleanBase64(userBase64), 
              mimeType: getMimeType(userBase64) 
            } 
          },
          { text: `Estimate body size for product "${productName}". Options: [XS, S, M, L, XL, XXL]. Return ONLY the size code.` },
        ],
      },
    });

    const size = response.text?.trim().toUpperCase();
    const validSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    return validSizes.includes(size || '') ? (size || 'M') : 'M';
  } catch (error) {
    console.error("Size Estimation Error:", error);
    return 'M';
  }
}

/**
 * Erstellt die virtuelle Anprobe.
 */
export async function performVirtualTryOn(userBase64: string, productBase64: string, productName: string): Promise<string> {
  // Überprüfung ob der Key überhaupt vorhanden ist (bevor der Request rausgeht)
  if (!process.env.API_KEY || process.env.API_KEY === "undefined") {
    throw new Error("API_KEY ist im Browser nicht verfügbar. Bitte stelle sicher, dass die Umgebungsvariable 'API_KEY' korrekt gesetzt und die App neu deployed wurde.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const promptText = `VIRTUAL TRY-ON: Place the outfit from the second image onto the person in the first image. 
    Product: ${productName}. Keep the person's face, pose, and the background identical to the first image. 
    Output the final image where the person is wearing the new outfit.`;

    const response = await ai.models.generateContent({
      model: APP_CONFIG.MODEL_NAME,
      contents: {
        parts: [
          { 
            inlineData: { 
              data: getCleanBase64(userBase64), 
              mimeType: getMimeType(userBase64) 
            } 
          },
          { 
            inlineData: { 
              data: getCleanBase64(productBase64), 
              mimeType: getMimeType(productBase64) 
            } 
          },
          { text: promptText },
        ],
      }
    });

    if (!response?.candidates?.[0]?.content?.parts) {
      throw new Error("Die KI hat keine Bilddaten zurückgegeben.");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData?.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("Das Ergebnis enthielt keine gültigen Bilddaten.");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    const status = error.status || "";
    const message = error.message || "";

    if (message.includes("API key not valid") || status === "INVALID_ARGUMENT") {
      throw new Error("Der API Key wird von Google als ungültig abgelehnt. Bitte prüfe in der Google AI Studio Console, ob der Key aktiv ist und keine Einschränkungen (Restrictions) hat.");
    }
    
    throw new Error(message || "Ein Fehler bei der Bildgenerierung ist aufgetreten.");
  }
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

export async function urlToBase64(url: string): Promise<string> {
  if (url.startsWith('data:')) return url;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else reject(new Error("Canvas Error"));
    };
    img.onerror = () => reject(new Error("Bild-Ladefehler"));
    img.src = `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
  });
}
