exports.handler = async function (event, context) {
    // Güvenlik: Sadece POST isteklerini kabul et
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // React (Frontend) tarafından gelen verileri al
        const data = JSON.parse(event.body);
        const { cvData, jobDesc } = data; // Frontend'den ne isimle gönderiyorsan o

        // API anahtarını güvenli sunucu ortamından alıyoruz (Frontend'den DEĞİL)
        const apiKey = process.env.API_KEY; // Netlify paneline bu isimle ekleyeceğiz

        // Yapay zekaya asıl isteği burada atıyoruz
        // Not: Buradaki URL ve body kısmını senin kendi mevcut fetch yapına göre güncelle
        const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // Kendi prompt yapını buraya ekle
                contents: [{ parts: [{ text: `CV: ${cvData}, İş İlanı: ${jobDesc}` }] }]
            })
        });

        const aiResult = await aiResponse.json();

        // Yapay zekadan gelen sonucu React (Frontend) tarafına geri gönder
        return {
            statusCode: 200,
            body: JSON.stringify(aiResult)
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Sunucu tarafında bir hata oluştu.' })
        };
    }
};