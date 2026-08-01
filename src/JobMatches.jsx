import React from 'react';

const JobMatches = () => {
    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <h1 className="text-3xl font-bold mb-6">Yapay Zeka İş Eşleşmeleri</h1>
            <p className="text-gray-400 mb-8">
                CV'nize en uygun iş ilanları taranıyor ve yetenek açığınız analiz ediliyor...
            </p>

            {/* Accordion (Açılır-Kapanır) Listesinin Geleceği Yer */}
            <div className="space-y-4">
                {/* Örnek İlan Kutusu */}
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 cursor-pointer hover:bg-gray-700 transition">
                    <h2 className="text-xl font-semibold">Java Developer - Örnek Şirket</h2>
                    <p className="text-sm text-green-400 mt-2">Uyum Yüzdesi: Tahminleniyor...</p>
                    {/* Tıklanınca açılacak AI analiz detayı (Skill-Gap) daha sonra buraya eklenecek */}
                </div>
            </div>
        </div>
    );
};

export default JobMatches;