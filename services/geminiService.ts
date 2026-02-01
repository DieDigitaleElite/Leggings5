
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

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const promptText = `
    Analyze the person's body shape in the image.
    Recommend the best fit size for this product: "${productName}".
    Available sizes: [XS, S, M, L, XL, XXL].
    
    IMPORTANT: Be realistic. If the person has a curvy or strong build, choose L, XL, or XXL. 
    Avoid choosing 'M' by default.
    
    Response format: Only return the size code (e.g., "XL"). No extra text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: cleanUserBase64, mimeType: userMimeType } },
          { text: promptText },
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
 * Fokus: 100% Design-Treue und vollständiges Set (Top + Bottom).
 */
export async function performVirtualTryOn(userBase64: string, productBase64: string, productName: string): Promise<string> {
  const userMimeType = getMimeType(userBase64);
  const productMimeType = getMimeType(productBase64);
  
  const cleanUserBase64 = getCleanBase64(userBase64);
  const cleanProductBase64 = getCleanBase64(productBase64);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Präziser Prompt für Design-Konsistenz
  const promptText = `
    VIRTUAL TRY-ON TASK - HIGH PRECISION REQUIRED.
    
    OBJECTIVE:
    Dress the person in Image 1 with the COMPLETE 2-PIECE SET shown in Image 2.
    The product is: "${productName}".
    
    STRICT RULES:
    1. COMPLETE OUTFIT: You MUST apply BOTH the Top (sports bra/crop top) and the Bottom (leggings/pants) from Image 2. 
    2. DESIGN INTEGRITY: Keep all seams, textures, colors, and cut-outs exactly as they appear in Image 2. DO NOT add pockets, logos, or change the stitching.
    3. ZERO HALLUCINATION: Do not invent new clothing parts. Use only what is visible in the reference image.
    4. PRESERVE IDENTITY: Keep the person's face, hair, skin tone, hands, and the original background from Image 1 100% identical.
    5. PERFECT FIT: Drape the fabric realistically over the person's body shape.
    
    Return the result as a high-quality synthesized image.
  `;

  try {
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
      throw new Error("Fehler bei der Bildgenerierung.");
    }

    let generatedImageUrl: string | null = null;
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData?.data) {
        generatedImageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!generatedImageUrl) throw new Error("Kein Bild generiert.");
    return generatedImageUrl;
  } catch (error: any) {
    console.error("Try-On Error:", error);
    throw new Error(error.message || "Fehler bei der Anprobe.");
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
    img.onerror = () => reject(new Error("Load Error"));
    img.src = `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
  });
}
