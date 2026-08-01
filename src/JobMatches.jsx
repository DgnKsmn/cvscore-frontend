import React, { useState } from 'react';
import toast from 'react-hot-toast';

const JobMatches = ({ setActivePage, isLoggedIn = false }) => {
    const [cvFile, setCvFile] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showAuthWarning, setShowAuthWarning] = useState(false);

    // Sonuçların gösterilmesi ve listelenmesi için state'ler
    const [showResults, setShowResults] = useState(false);
    const [matchedJobs, setMatchedJobs] = useState([]);

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

        setShowResults(false);
        setIsAnalyzing(true);
        toast.loading("CV'niz analiz ediliyor, size uygun linkler aranıyor...", { duration: 3000 });

        // Gerçekçi simülasyon ve iş ilanı sonuçları oluşturma
        setTimeout(() => {
            setIsAnalyzing(false);
            setMatchedJobs([
                { title: "Senior Frontend Developer", company: "TechCorp Global", match: "%94", link: "#" },
                { title: "React & Next.js Developer", company: "StartupLab", match: "%89", link: "#" },
                { title: "Full Stack Software Engineer", company: "InnoSoft Yazılım", match: "%85", link: "#" },
                { title: "UI/UX & Frontend Specialist", company: "Digital Art Studio", match: "%81", link: "#" },
                { title: "Junior Software Developer", company: "NextGen Teknoloji", match: "%78", link: "#" }
            ]);
            setShowResults(true);
            toast.success("Analiz tamamlandı! İş ilanları listeleniyor.");
        }, 3000);
    };

    const handleReset = () => {
        setCvFile(null);
        setShowResults(false);
        setMatchedJobs([]);
        setShowAuthWarning(false);
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
                {!showResults ? (
                    <>
                        <div className="text-6xl mb-6 opacity-80">🔍</div>
                        <h2 className="text-xl font-bold text-white mb-3">
                            {isAnalyzing ? "Yapay Zeka Çalışıyor" : "Henüz Bir Analiz Başlatmadınız"}
                        </h2>
                        <p className="text-slate-400 max-w-lg mb-8 text-sm leading-relaxed">
                            {isAnalyzing
                                ? "CV metniniz taranıyor ve size en uygun iş ilanları eşleştiriliyor..."
                                : "Sisteme yükleyeceğiniz CV verileriniz ve hedefleriniz doğrultusunda uygun iş ilanı linklerinin taranması için motoru çalıştırın."}
                        </p>

                        {!isAnalyzing && (
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
                        )}

                        {isAnalyzing && (
                            <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
                            </div>
                        )}

                        {!isLoggedIn && showAuthWarning && (
                            <div
                                onClick={() => setActivePage('login')}
                                className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 w-full max-w-md text-center text-sm font-medium cursor-pointer hover:bg-red-500/20 transition-colors"
                            >
                                Henüz giriş yapmadınız. Lütfen öncelikle Giriş Yapın veya Kaydolun.
                            </div>
                        )}

                        {!isAnalyzing && (
                            <button
                                onClick={handleStartAnalysis}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
                            >
                                <span>✨</span> Analizi Başlat
                            </button>
                        )}
                    </>
                ) : (
                    <div className="w-full space-y-6">
                        <div className="border-b border-slate-800 pb-4 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Eşleşen İş İlanları</h3>
                            <span className="text-xs text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full font-semibold">AI Match Active</span>
                        </div>

                        <div className="space-y-3 text-left">
                            {matchedJobs.map((job, idx) => (
                                <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between hover:border-blue-500/50 transition-all">
                                    <div>
                                        <h4 className="font-bold text-slate-100 text-sm md:text-base">{job.title}</h4>
                                        <p className="text-xs text-slate-400">{job.company}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-emerald-400 font-bold text-sm bg-emerald-500/10 px-3 py-1 rounded-lg">{job.match} Uyum</span>
                                        <a href={job.link} onClick={(e) => { e.preventDefault(); toast.success("İlan detay sayfasına yönlendiriliyorsunuz."); }} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-lg font-semibold transition-colors">
                                            İlana Git
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 flex justify-center">
                            <button
                                onClick={handleReset}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold py-2.5 px-6 rounded-xl transition-colors"
                            >
                                Yeni Analiz Yap
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobMatches;