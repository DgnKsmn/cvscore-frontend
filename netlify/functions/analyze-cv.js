export const handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const data = JSON.parse(event.body);
        const { prompt } = data;

        const apiKey = process.env.API_KEY;

        const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const aiResult = await aiResponse.json();

        // Yapay zekanın döndürdüğü string'i parse et
        const jsonString = aiResult.candidates[0].content.parts[0].text;
        const finalResult = JSON.parse(jsonString);

        return {
            statusCode: 200,
            body: JSON.stringify(finalResult)
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Sunucu tarafında bir hata oluştu veya JSON parse edilemedi.' })
        };
    }
};