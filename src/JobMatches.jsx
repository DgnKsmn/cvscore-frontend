import React, { useState } from 'react';

// DİKKAT: Artık App.jsx'ten 'isLoggedIn' prop'unu alıyoruz
const JobMatches = ({ isLoggedIn }) => {
    const [isSearching, setIsSearching] = useState(false);
    const [jobs, setJobs] = useState([]);
    const [authError, setAuthError] = useState(false);

    const handleSearch = () => {
        // GERÇEK KONTROL BURADA YAPILIYOR
        if (!isLoggedIn) {
            setAuthError(true);
            return; // Giriş yapılmadıysa fonksiyonu burada durdur
        }

        // Giriş yapılmışsa hata mesajını kaldır ve analizi başlat
        setAuthError(false);
        setIsSearching(true);

        // Geçici API simülasyonu
        setTimeout(() => {
            setIsSearching(false);
            // setJobs([...])
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <h1 className="text-3xl font-bold mb-6">Yapay Zeka İş Eşleşmeleri</h1>
            <p className="text-gray-400 mb-8">
                Sizin için en uygun 5 ile 10 arası ilanın linklerini bulmak için analizi başlatın.
            </p>

            {jobs.length === 0 && !isSearching ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-800/50 rounded-xl border border-gray-700/50">
                    <div className="text-6xl opacity-30 mb-6">🔍</div>
                    <h3 className="text-xl font-semibold text-gray-200 mb-2">Henüz Bir Analiz Başlatmadınız</h3>
                    <p className="text-sm text-gray-400 mb-6 max-w-sm">
                        Sisteme kayıtlı CV verileriniz ve hedefleriniz doğrultusunda uygun 5 ile 10 arası iş ilanı linkinin taranması için motoru çalıştırın.
                    </p>

                    {/* GİRİŞ YAPILMADI UYARISI SADECE HATA VARSA ÇIKAR */}
                    {authError && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/40 rounded-lg text-red-400 font-medium text-sm">
                            Henüz giriş yapmadınız. Lütfen öncelikle Giriş Yapın veya Kaydolun.
                        </div>
                    )}

                    <button
                        onClick={handleSearch}
                        className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 text-white font-bold py-3 px-8 rounded-xl transition-all"
                    >
                        ✨ Analizi Başlat
                    </button>
                </div>
            ) : isSearching ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500 mb-4"></div>
                    <p className="text-gray-400 font-medium">Linkler tespit ediliyor, lütfen bekleyin...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Veriler buraya gelecek */}
                </div>
            )}
        </div>
    );
};

export default JobMatches;