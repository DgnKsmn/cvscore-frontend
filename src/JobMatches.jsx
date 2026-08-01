import React, { useState } from 'react';
import toast from 'react-hot-toast';

const JobMatches = ({ setActivePage, isLoggedIn = false }) => {
    const [cvFile, setCvFile] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showAuthWarning, setShowAuthWarning] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type === "application/pdf") {
                setCvFile(file);
                toast.success(`${file.name} başarıyla eklendi!`);
                setShowAuthWarning(false);
            } else {
                toast.error("Lütfen sadece PDF formatında bir CV yükleyin.");
                e.target.value = null;
            }
        }
    };

    const handleStartAnalysis = () => {
        if (!isLoggedIn) {
            setShowAuthWarning(true);
            toast.error("Henüz giriş yapmadınız. Lütfen öncelikle Giriş Yapın veya Kaydolun.");
            return;
        }

        setShowAuthWarning(false);

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
        <div className="w-full max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Yapay Zeka İş Eşleşmeleri</h1>
                <p className="text-slate-400">
                    Sizin için en uygun 25 ile 100 arası ilanın linklerini bulmak için CV'nizi yükleyip analizi başlatın.
                </p>
            </div>

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
    );
};

export default JobMatches;