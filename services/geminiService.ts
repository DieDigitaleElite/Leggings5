
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
 * Analysiert das Bild des Nutzers und gibt eine fundierte Größenempfehlung ab.
 */
export async function estimateSizeFromImage(userBase64: string, productName: string): Promise<string> {
  const userMimeType = getMimeType(userBase64);
  const cleanUserBase64 = getCleanBase64(userBase64);

  try {
    // WICHTIG: Der API_KEY muss direkt im Konstruktor ohne Zwischenvariable stehen
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: cleanUserBase64, mimeType: userMimeType } },
          { text: `Analyze the person's body shape in the image and recommend a size for "${productName}". Options: [XS, S, M, L, XL, XXL]. Return ONLY the size code.` },
        ],
      },
    });

    const size = response.text?.trim().toUpperCase();
    const validSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    return validSizes.includes(size || '') ? (size || 'M') : 'M';
  } catch (error: any) {
    console.error("Size Estimation Error:", error);
    return 'M';
  }
}

/**
 * Erstellt die virtuelle Anprobe. 
 */
export async function performVirtualTryOn(userBase64: string, productBase64: string, productName: string): Promise<string> {
  const userMimeType = getMimeType(userBase64);
  const productMimeType = getMimeType(productBase64);
  
  const cleanUserBase64 = getCleanBase64(userBase64);
  const cleanProductBase64 = getCleanBase64(productBase64);

  try {
    // Direktes Instanziieren gemäß Google SDK Spezifikation für Web-Umgebungen
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const promptText = `
      VIRTUAL TRY-ON TASK.
      Apply the clothing from Image 2 to the person in Image 1.
      Product: "${productName}".
      The output must be a photo of the person wearing the new outfit.
      Keep person, background and face exactly as in Image 1.
    `;

    const response = await ai.models.generateContent({
      model: APP_CONFIG.MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { data: cleanUserBase64, mimeType: userMimeType } },
          { inlineData: { data: cleanProductBase64, mimeType: productMimeType } },
          { text: promptText },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4"
        }
      }
    });

    if (!response || !response.candidates?.[0]?.content?.parts) {
      throw new Error("Die KI hat kein Bild generiert.");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData?.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("Das KI-Ergebnis enthielt keine Bilddaten.");
  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);
    
    const message = error.message || "";

    if (message.includes("API key not valid") || message.includes("400")) {
      throw new Error("API Key Fehler: Der Hoster konnte den Key nicht korrekt in die App einfügen. Bitte stelle sicher, dass die Variable 'API_KEY' in Vercel ohne Anführungszeichen gespeichert wurde und führe einen 'Redeploy' durch.");
    }
    
    if (message.includes("403") || message.includes("location")) {
      throw new Error("Regions-Beschränkung: Die Gemini API (Free Tier) ist in einigen EU-Ländern eingeschränkt. Bitte aktiviere Billing in deinem Google Cloud Projekt, um diese Sperre aufzuheben.");
    }

    throw new Error(message || "Ein technischer Fehler ist aufgetreten.");
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
    img.onerror = () => reject(new Error("Bild konnte nicht geladen werden."));
    img.src = `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
  });
}
