# Shopware Virtual Try-On App

Diese App ermöglicht Kunden eine virtuelle Anprobe von Sportbekleidung direkt im Shopware-Store.

## 🚀 Hosting Optionen

### Option A: Vercel (Empfohlen - Kostenlos & Ohne Kreditkarte)
1. Dateien in ein GitHub Repository hochladen.
2. Bei [Vercel](https://vercel.com) mit GitHub anmelden.
3. Projekt importieren.
4. **Environment Variable** hinzufügen: `API_KEY` = (Dein Gemini API Key).
5. Deploy klicken.

### Option B: Firebase (Google Cloud)
1. `npm install -g firebase-tools`
2. `firebase login`
3. `firebase init hosting` (Öffentliches Verzeichnis: `.`)
4. `firebase deploy`
*Hinweis: Erfordert meist Kreditkarte zur Verifizierung bei Google.*

## 🛒 Einbindung in Shopware 6

1. Gehe im Shopware Admin zu **Inhalte > Erlebniswelten**.
2. Wähle eine Seite (z.B. Landingpage oder Produktseite).
3. Füge einen **HTML-Block** hinzu.
4. Nutze den folgenden Code (ersetze die URL durch deine eigene):

```html
<div style="width: 100%; height: 800px; overflow: hidden; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
  <iframe 
    src="https://DEINE-APP-URL.vercel.app" 
    width="100%" 
    height="100%" 
    style="border: none;"
    allow="camera">
  </iframe>
</div>
```

## 🔑 API Key erhalten
Erstelle einen kostenlosen Key unter [aistudio.google.com](https://aistudio.google.com/). Nutze dort den "Free of charge" Plan.
