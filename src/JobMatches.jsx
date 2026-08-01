import React, { useState } from 'react';
import toast from 'react-hot-toast';

const JobMatches = ({ setActivePage, isLoggedIn = false }) => {
    const [cvFile, setCvFile] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Uyarının görünüp görünmeyeceğini kontrol eden YENİ STATE
    const [showAuthWarning, setShowAuthWarning] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type === "application/pdf") {
                setCvFile(file);
                toast.success(`${file.name} başarıyla eklendi!`);
                // Kullanıcı dosya yüklediğinde hata mesajını temizle
                setShowAuthWarning(false);
            } else {
                toast.error("Lütfen sadece PDF formatında bir CV yükleyin.");
                e.target.value = null;
            }
        }
    };

    const handleStartAnalysis = () => {
        // 1. Önce giriş kontrolü yap
        if (!isLoggedIn) {
            setShowAuthWarning(true); // UYARIYI SADECE BURADA EKRANA GETİR
            toast.error("Henüz giriş yapmadınız. Lütfen öncelikle Giriş Yapın veya Kaydolun.");
            return;
        }

        // Giriş yapılmışsa uyarıyı kapalı tut
        setShowAuthWarning(false);

        // 2. Sonra dosya kontrolü yap
        if (!cvFile) {
            toast.error("Analizi başlatmak için lütfen önce CV'nizi yükleyin.");
            return;
        }

        setIsAnalyzing(true);
        toast.loading("CV'niz analiz ediliyor, size uygun linkler aranıyor...", { duration: 3000 });

        setTimeout(() => {
            setIsAnalyzing(false);
            toast.success("Analiz tamamlandı! İş ilanları listeleniyor.");
        }, 3000);
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans p-8">
            <div className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold text-white tracking-tight">
                        CV<span className="text-blue-500 text-3xl">scorer</span>
                    </div>
                </div>
                <div className="flex gap-4">
                    {isLoggedIn ? (
                        <button
                            onClick={() => setActivePage && setActivePage('login')}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
                        >
                            Çıkış Yap
                        </button>
                    ) : (
                        <button
                            onClick={() => setActivePage && setActivePage('login')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white transition-colors"
                        >
                            Giriş Yap
                        </button>
                    )}
                    <button
                        onClick={() => setActivePage && setActivePage('home')}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm text-white transition-colors font-medium"
                    >
                        Ana Menü
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-2">Yapay Zeka İş Eşleşmeleri</h1>
                <p className="text-slate-400 mb-8">
                    Sizin için en uygun 25 ile 100 arası ilanın linklerini bulmak için CV'nizi yükleyip analizi başlatın.
                </p>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 flex flex-col items-center justify-center text-center shadow-xl">
                    <div className="text-6xl mb-6 opacity-80">🔍</div>
                    <h2 className="text-xl font-bold text-white mb-3">Henüz Bir Analiz Başlatmadınız</h2>
                    <p className="text-slate-400 max-w-lg mb-8 text-sm leading-relaxed">
                        Sisteme yükleyeceğiniz CV verileriniz ve hedefleriniz doğrultusunda uygun 25 ile 100 arası iş ilanı linkinin taranması için motoru çalıştırın.
                    </p>

                    <div className="w-full max-w-md mb-8">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-950 hover:border-blue-500 hover:bg-slate-900 transition-all group">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <svg className="w-8 h-8 mb-3 text-slate-400 group-hover:text-blue-400 transition-colors" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                </svg>
                                <p className="mb-2 text-sm text-slate-400">
                                    <span className="font-semibold text-blue-400">CV'nizi seçmek için tıklayın</span> veya sürükleyin
                                </p>
                                <p className="text-xs text-slate-500">Sadece PDF formatı desteklenir</p>
                            </div>
                            <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
                        </label>

                        {cvFile && (
                            <div className="mt-4 text-sm text-emerald-400 font-medium bg-emerald-400/10 border border-emerald-500/20 py-2 px-4 rounded-lg inline-flex items-center gap-2">
                                <span>📄</span> {cvFile.name}
                            </div>
                        )}
                    </div>

                    {/* UYARI KUTUSU ARTIK SADECE BUTONA BASILINCA VE GİRİŞ YAPILMAMIŞSA ÇIKACAK */}
                    {!isLoggedIn && showAuthWarning && (
                        <div
                            onClick={() => setActivePage('login')}
                            className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 w-full max-w-md text-center text-sm font-medium cursor-pointer hover:bg-red-500/20 transition-colors"
                        >
                            Henüz giriş yapmadınız. Lütfen öncelikle Giriş Yapın veya Kaydolun.
                        </div>
                    )}

                    <button
                        onClick={handleStartAnalysis}
                        disabled={isAnalyzing}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span>✨</span> {isAnalyzing ? 'Analiz Ediliyor...' : 'Analizi Başlat'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JobMatches;