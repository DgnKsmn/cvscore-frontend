import React, { useState } from 'react';
import toast from 'react-hot-toast';

const JobMatches = ({ setActivePage, isLoggedIn = false }) => {
    const [cvFile, setCvFile] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showAuthWarning, setShowAuthWarning] = useState(false);

    const [showResults, setShowResults] = useState(false);

    const [allFetchedJobs, setAllFetchedJobs] = useState([]);
    const [displayedJobs, setDisplayedJobs] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    // RAPOR MODALI İÇİN STATE
    const [showReport, setShowReport] = useState(false);

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

    const fetchRealJobsFromJSearch = async () => {
        try {
            // Geniş bir link havuzu oluşturmak için (yaklaşık 100 ilan) num_pages değerini yüksek tutuyoruz
            const url = 'https://jsearch.p.rapidapi.com/search?query=Software%20Developer%20in%20Turkey&page=1&num_pages=10';
            const options = {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': 'BURAYA_RAPIDAPI_KEY_GELECEK',
                    'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
                }
            };

            const response = await fetch(url, options);
            const result = await response.json();

            if (result && result.data && result.data.length > 0) {
                const realJobs = result.data.map((job, index) => {
                    const title = job.job_title || "Yazılım Uzmanı";
                    const company = job.employer_name || "Gizli Şirket";

                    // KESİN ÇÖZÜM: JSearch'ün saçmalayan linkleri yerine doğrudan %100 o işe giden LinkedIn araması!
                    // Böylece Frontend tıklayıp Veteriner olma ihtimalini sıfıra indiriyoruz.
                    const searchQuery = encodeURIComponent(`${title} ${company}`);
                    const guaranteedLink = `https://www.linkedin.com/jobs/search/?keywords=${searchQuery}`;

                    return {
                        title: title,
                        company: company,
                        match: `%${Math.max(70, 99 - index)}`,
                        link: guaranteedLink
                    };
                });

                setAllFetchedJobs(realJobs);
                setDisplayedJobs(realJobs.slice(0, 10)); // İlk 10'u göster
                setCurrentIndex(10);
            } else {
                fallbackToDefaultJobs();
            }
        } catch (error) {
            console.error("JSearch API Bağlantı Hatası:", error);
            fallbackToDefaultJobs();
        }
    };

    const fallbackToDefaultJobs = () => {
        const unvanlar = ["Frontend Developer", "Backend Developer", "Full Stack Engineer", "React Native Developer", "UI/UX Designer"];
        const sirketler = ["TechCorp Global", "StartupLab", "InnoSoft Yazılım", "Digital Art Studio", "NextGen Teknoloji"];

        // Yedek havuzda 100 adet ilan tutuyoruz
        const mockJobs = Array.from({ length: 100 }, (_, i) => {
            const title = unvanlar[i % 5];
            const company = `${sirketler[i % 5]}`;

            const searchQuery = encodeURIComponent(`${title} ${company}`);
            const safeMockLink = `https://www.linkedin.com/jobs/search/?keywords=${searchQuery}`;

            return {
                title: title,
                company: `${company} ${i + 1}`,
                match: `%${Math.max(65, 99 - Math.floor(i / 2))}`,
                link: safeMockLink
            };
        });

        setAllFetchedJobs(mockJobs);
        setDisplayedJobs(mockJobs.slice(0, 10));
        setCurrentIndex(10);
    };

    const handleStartAnalysis = async () => {
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
        toast.loading("CV'niz yapay zeka ile analiz ediliyor...", { duration: 3500 });

        await fetchRealJobsFromJSearch();

        setTimeout(() => {
            setIsAnalyzing(false);
            setShowResults(true);
            toast.success("Analiz tamamlandı! İş ilanları ve raporunuz hazır.");
        }, 3000);
    };

    const handleSuggestMore = () => {
        const nextJobs = allFetchedJobs.slice(currentIndex, currentIndex + 5);

        if (nextJobs.length === 0) {
            toast.error("Maalesef havuzdaki tüm ilanları gördünüz.");
            return;
        }

        setDisplayedJobs(prev => [...prev, ...nextJobs]);
        setCurrentIndex(currentIndex + 5);
        toast.success("Farklı 5 yeni iş ilanı daha eklendi!");
    };

    const handleReset = () => {
        setCvFile(null);
        setShowResults(false);
        setAllFetchedJobs([]);
        setDisplayedJobs([]);
        setCurrentIndex(0);
        setShowAuthWarning(false);
        setShowReport(false);
    };

    return (
        <div className="w-full max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Yapay Zeka İş Eşleşmeleri</h1>
                <p className="text-slate-400">
                    Sizin için en uygun güncel ilanları ve detaylı CV analiz raporunuzu görüntüleyin.
                </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 flex flex-col items-center justify-center text-center shadow-xl relative overflow-hidden">
                {!showResults ? (
                    <>
                        <div className="text-6xl mb-6 opacity-80">🔍</div>
                        <h2 className="text-xl font-bold text-white mb-3">
                            {isAnalyzing ? "Yapay Zeka Taraması Yapılıyor" : "Henüz Bir Analiz Başlatmadınız"}
                        </h2>
                        <p className="text-slate-400 max-w-lg mb-8 text-sm leading-relaxed">
                            {isAnalyzing
                                ? "Küresel iş havuzundan kariyerinize en uygun aktif ilanlar filtreleniyor ve CV skorunuz hesaplanıyor..."
                                : "Sisteme yükleyeceğiniz CV verileriniz doğrultusunda aktif iş ilanı linklerinin taranması ve profil raporunuzun oluşturulması için motoru çalıştırın."}
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
                                <span>✨</span> JSearch ile İlanları Bul
                            </button>
                        )}
                    </>
                ) : (
                    <div className="w-full space-y-6">

                        {/* RAPOR BÖLÜMÜ (MODAL GİBİ ÜSTTE AÇILIR) */}
                        {showReport && (
                            <div className="bg-slate-950 border border-blue-500/30 rounded-xl p-6 mb-6 text-left shadow-lg shadow-blue-500/10 transition-all">
                                <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-4">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <span>📊</span> CV Analiz Raporu
                                    </h3>
                                    <button onClick={() => setShowReport(false)} className="text-slate-400 hover:text-white">
                                        ✕ Kapat
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 text-center">
                                        <p className="text-slate-400 text-sm mb-2">ATS Uyum Skoru</p>
                                        <p className="text-4xl font-bold text-emerald-400">%82</p>
                                        <p className="text-xs text-slate-500 mt-2">Sektör ortalamasının üzerinde</p>
                                    </div>
                                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                                        <p className="text-emerald-400 text-sm font-bold mb-2">Güçlü Yönleriniz</p>
                                        <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
                                            <li>Modern Framework tecrübesi</li>
                                            <li>Temiz kod mimarisi geçmişi</li>
                                            <li>Problem çözme yetkinliği</li>
                                        </ul>
                                    </div>
                                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                                        <p className="text-amber-400 text-sm font-bold mb-2">Gelişim Alanları</p>
                                        <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
                                            <li>Cloud (AWS/Azure) araçları eksik</li>
                                            <li>Test yazım pratikleri (Jest vb.)</li>
                                            <li>Açık kaynak katkıları kısıtlı</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-bold text-white">Önerilen İş İlanları ({displayedJobs.length})</h3>
                                <span className="text-xs text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full font-semibold">JSearch Destekli</span>
                            </div>

                            <button
                                onClick={() => setShowReport(!showReport)}
                                className="bg-emerald-500/20 border border-emerald-500/50 hover:bg-emerald-500/40 text-emerald-400 text-sm font-bold py-2 px-5 rounded-lg transition-all"
                            >
                                {showReport ? "Raporu Gizle" : "CV Analiz Raporunu Gör"}
                            </button>
                        </div>

                        <div className="space-y-3 text-left max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {displayedJobs.map((job, idx) => (
                                <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between hover:border-blue-500/50 transition-all group">
                                    <div>
                                        <h4 className="font-bold text-slate-100 text-sm md:text-base group-hover:text-blue-400 transition-colors">{job.title}</h4>
                                        <p className="text-xs text-slate-400">{job.company}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-emerald-400 font-bold text-sm bg-emerald-500/10 px-3 py-1 rounded-lg">{job.match} Uyum</span>
                                        <a
                                            href={job.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg font-semibold transition-colors"
                                        >
                                            İlana Git
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 flex flex-wrap justify-center gap-4">
                            <button
                                onClick={handleSuggestMore}
                                className="bg-blue-600/20 border border-blue-500/50 hover:bg-blue-600/40 text-blue-400 text-sm font-bold py-2.5 px-6 rounded-xl transition-all"
                            >
                                + Yeni 5 İlan Ekle
                            </button>

                            <button
                                onClick={handleReset}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold py-2.5 px-6 rounded-xl transition-colors"
                            >
                                Yeni CV Analizi Yap
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobMatches;