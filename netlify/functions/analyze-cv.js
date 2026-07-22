export const handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const data = JSON.parse(event.body);
        const { prompt } = data;

        const apiKey = process.env.API_KEY;

        // 1. KONTROL: Netlify'da API_KEY gerçekten var mı?
        if (!apiKey) {
            return { statusCode: 500, body: JSON.stringify({ error: 'Netlify panelinde API_KEY bulunamadı! Environment Variables kısmını kontrol edin.' }) };
        }

        const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const aiResult = await aiResponse.json();

        // 2. KONTROL: Yapay Zeka servisi hata döndürdü mü?
        if (aiResult.error) {
            return { statusCode: 500, body: JSON.stringify({ error: `Gemini API Hatası: ${aiResult.error.message}` }) };
        }

        let jsonString = aiResult.candidates[0].content.parts[0].text;

        // 3. KONTROL: Yapay zeka yaramazlık yapıp ```json markdown'ı eklediyse zorla temizle!
        jsonString = jsonString.replace(/```json/ig, '').replace(/```/g, '').trim();

        // Tertemiz metni objeye çevir
        const finalResult = JSON.parse(jsonString);

        return {
            statusCode: 200,
            body: JSON.stringify(finalResult)
        };

    } catch (error) {
        // 4. KONTROL: Eğer kod hala çöküyorsa, TAM OLARAK neden çöktüğünü frontend'e gönder!
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Backend Çöktü: ${error.message}` })
        };
    }
};