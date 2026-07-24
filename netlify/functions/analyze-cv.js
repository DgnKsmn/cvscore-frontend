export const handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const data = JSON.parse(event.body);
        const { prompt } = data;

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { statusCode: 500, body: JSON.stringify({ error: 'API_KEY bulunamadı!' }) };
        }

        // --- GEMINI API İSTEĞİ ---
        const aiResponse = await fetch(`[https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=$](https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=$){apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const aiResult = await aiResponse.json();

        // Gemini'den hata dönerse yakala
        if (aiResult.error) {
            return { statusCode: 500, body: JSON.stringify({ error: `Gemini API Hatası: ${aiResult.error.message}` }) };
        }

        // Gemini'nin verdiği yanıt metnini al
        let rawText = aiResult.candidates[0].content.parts[0].text;

        // KONTROL: Yapay zeka yaramazlık yapıp ```json markdown'ı eklediyse zorla temizle!
        let jsonString = rawText.replace(/```json/ig, '').replace(/```/g, '').trim();

        // Tertemiz metni objeye çevir
        const finalResult = JSON.parse(jsonString);

        return {
            statusCode: 200,
            body: JSON.stringify(finalResult)
        };

    } catch (error) {
        // Hata durumunda frontend'e net bir mesaj gönder
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Backend Çöktü: ${error.message}` })
        };
    }
};