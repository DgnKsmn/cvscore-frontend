import React, { useState } from 'react';

const JobMatches = () => {
    const [isSearching, setIsSearching] = useState(false);
    const [jobs, setJobs] = useState([]); // API'den gelecek linkler burada tutulacak

    const handleSearch = () => {
        setIsSearching(true);

        // Geçici bir simülasyon (Backend bağlandığında buraya fetch/axios kodu gelecek)
        setTimeout(() => {
            setIsSearching(false);
            // setJobs([...]) ile veriler yüklenecek
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <h1 className="text-3xl font-bold mb-6">Yapay Zeka İş Eşleşmeleri</h1>
            <p className="text-gray-400 mb-8">
                Size en uygun iş ilanlarını bulmak için analizi başlatın.
            </p>

            {/* Veri yoksa ve arama yapılmıyorsa gösterilecek GİRİŞ EKRANI */}
            {jobs.length === 0 && !isSearching ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-800/50 rounded-xl border border-gray-700/50">
                    <div className="text-6xl opacity-30 mb-6">🔍</div>
                    <h3 className="text-xl font-semibold text-gray-200 mb-2">Henüz Bir Analiz Başlatmadınız</h3>
                    <button
                        onClick={handleSearch}
                        className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 text-white font-bold py-3 px-8 rounded-xl transition-all"
                    >
                        ✨ Analizi Başlat
                    </button>
                </div>
            ) : isSearching ? (
                /* Yükleniyor Ekranı */
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500 mb-4"></div>
                    <p className="text-gray-400 font-medium">Linkler tespit ediliyor, lütfen bekleyin...</p>
                </div>
            ) : (
                /* API'den veriler geldiğinde listelenecek ACCORDION alanı */
                <div className="space-y-4">
                    {/* Dinamik veri haritalaması (jobs.map) buraya eklenecek */}
                    {/* Örnek: jobs.map((job, index) => <JobCard key={index} data={job} />) */}
                </div>
            )}
        </div>
    );
};

export default JobMatches;