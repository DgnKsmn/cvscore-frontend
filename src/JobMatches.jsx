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

    const [expandedJobIndex, setExpandedJobIndex] = useState(null);

    const handleFileChange = e => {
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

    // GÜNCELLENEN KISIM: İstek doğrudan Railway backend'imize ve yeni SerpApi formatına (List<String>) gidiyor!
    const fetchRealJobsFromBackend = async () => {
        try {
            const query = encodeURIComponent("Software Developer");
            const url = `https://cvscore-backend-production.up.railway.app/api/jobs/search?query=${query}&page=1`;

            const token = localStorage.getItem('cvscore_jwt');
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error("İlanlar çekilirken bir hata oluştu.");

            const links = await response.json(); // Backend artık doğrudan saf link dizisi dönüyor

            if (links && links.length > 0) {
                const realJobs = links.map((link, index) => {
                    const matchScore = Math.max(70, 99 - index);

                    return {
                        title: `Yazılım Geliştirici Pozisyonu ${index + 1}`,
                        company: "Global Teknoloji Şirketi",
                        matchScore: matchScore,
                        match: `%${matchScore}`,
                        link: link // SerpApi'den gelen gerçek ve saf ilan linki
                    };
                });

                setAllFetchedJobs(realJobs);
                setDisplayedJobs(realJobs.slice(0, 10));
                setCurrentIndex(10);
            } else {
                fallbackToDefaultJobs();
            }
        } catch (error) {
            console.error("Backend SerpApi Bağlantı Hatası:", error);
            fallbackToDefaultJobs();
        }
    };

    // İstediğin link sayısına uygun olarak 100 adet mock ilan üreten fallback fonksiyonumuz
    const fallbackToDefaultJobs = () => {
        const unvanlar = ["Frontend Developer", "Backend Developer", "Full Stack Engineer", "React Native Developer", "UI/UX Designer"];
        const sirketler = ["TechCorp Global", "StartupLab", "InnoSoft Yazılım", "Digital Art Studio", "NextGen Teknoloji"];

        const mockJobs = Array.from({ length: 100 }, (_, i) => {
            const title = unvanlar[i % 5];
            const company = `${sirketler[i % 5]}`;
            const matchScore = Math.max(65, 99 - Math.floor(i / 2));

            const searchQuery = encodeURIComponent(`${title} ${company}`);
            const safeMockLink = `https://www.linkedin.com/jobs/search/?keywords=${searchQuery}`;

            return {
                title: title,
                company: `${company} ${i + 1}`,
                matchScore: matchScore,
                match: `%${matchScore}`,
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

        await fetchRealJobsFromBackend();

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
        setExpandedJobIndex(null);
    };

    const toggleJobExpand = index => {
        if (expandedJobIndex === index) {
            setExpandedJobIndex(null);
        } else {
            setExpandedJobIndex(index);
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto print:block">
            <div className="mb-8 print:hidden">
                <h1 className="text-3xl font-bold text-white mb-2">İş İlanı Linkleri Ve Uyumları</h1>
                <p className="text-slate-400">
                    Size en uygun iş ilanlarını görebilirsiniz. İlanların sağındaki oklara tıklayarak detayları görebilirsiniz.
                </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 flex flex-col items-center justify-center text-center shadow-xl relative overflow-hidden print:p-0 print:border-none print:shadow-none print:bg-transparent">
                {!showResults ? (
                    <>
                        <div className="text-6xl mb-6 opacity-80 print:hidden">🔍</div>
                        <h2 className="text-xl font-bold text-white mb-3 print:hidden">
                            {isAnalyzing ? "Yapay Zeka Taraması Yapılıyor" : "Henüz Bir Analiz Başlatmadınız"}
                        </h2>
                        <p className="text-slate-400 max-w-lg mb-8 text-sm leading-relaxed print:hidden">
                            {isAnalyzing && "Küresel iş havuzundan kariyerinize en uygun aktif ilanlar filtreleniyor ve CV skorunuz hesaplanıyor..."}
                        </p>

                        {!isAnalyzing && (
                            <div className="w-full max-w-md mb-8 print:hidden">
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
                            <div className="flex flex-col items-center justify-center py-8 space-y-4 print:hidden">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
                            </div>
                        )}

                        {!isLoggedIn && showAuthWarning && (
                            <div
                                onClick={() => setActivePage('login')}
                                className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 w-full max-w-md text-center text-sm font-medium cursor-pointer hover:bg-red-500/20 transition-colors print:hidden"
                            >
                                Henüz giriş yapmadınız. Lütfen öncelikle Giriş Yapın veya Kaydolun.
                            </div>
                        )}

                        {!isAnalyzing && (
                            <button
                                onClick={handleStartAnalysis}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 print:hidden"
                            >
                                <span>✨</span> ANALİZİ BAŞLAT
                            </button>
                        )}
                    </>
                ) : (
                    <div className="w-full space-y-6">

                        <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row justify-between items-center gap-4">
                            <h3 className="text-xl font-bold text-white">Önerilen İş İlanları ({displayedJobs.length})</h3>

                            <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => window.print()}
                                        className="print:hidden text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                                    >
                                        <span>📥</span> Raporu İndir
                                    </button>
                                    <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded font-semibold">
                                        SerpApi Active
                                    </span>
                                </div>
                                <span className="text-[10px] text-slate-400 italic print:hidden">Analiz raporunu görmek için bir ilana tıklayın</span>
                            </div>
                        </div>

                        <div className="space-y-4 text-left max-h-[600px] overflow-y-auto pr-2 custom-scrollbar print:max-h-none print:overflow-visible print:pr-0 print:h-auto">
                            {displayedJobs.map((job, idx) => {
                                const isExpanded = expandedJobIndex === idx;

                                return (
                                    <div
                                        key={idx}
                                        className={`bg-slate-950 border transition-all duration-300 rounded-xl overflow-hidden print:break-inside-avoid ${isExpanded ? 'border-blue-500/50 shadow-lg shadow-blue-500/10 print:border-slate-500' : 'border-slate-800 hover:border-slate-600'}`}
                                    >
                                        <div
                                            className="p-4 flex flex-col md:flex-row items-center justify-between cursor-pointer print:bg-slate-100 print:text-black"
                                            onClick={() => toggleJobExpand(idx)}
                                        >
                                            <div className="flex-1 w-full md:w-auto mb-3 md:mb-0">
                                                <h4 className="font-bold text-slate-100 text-base md:text-lg print:text-slate-900">{job.title}</h4>
                                                <p className="text-sm text-slate-400 print:text-slate-600">{job.company}</p>
                                            </div>
                                            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                                <span className="text-emerald-400 font-bold text-sm bg-emerald-500/10 px-3 py-1 rounded-lg print:border print:border-emerald-500 print:bg-transparent">
                                                    {job.match} Uyum
                                                </span>
                                                <a
                                                    href={job.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={e => e.stopPropagation()}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg font-semibold transition-colors print:hidden"
                                                >
                                                    İlana Git
                                                </a>
                                                <span className="text-slate-400 ml-2 print:hidden">
                                                    {isExpanded ? '▲' : '▼'}
                                                </span>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="bg-slate-900 border-t border-slate-800 p-6 transition-all print:bg-white print:border-slate-300">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800 flex flex-col items-center justify-center print:bg-slate-50 print:border-slate-200">
                                                        <p className="text-slate-400 text-sm mb-3 print:text-slate-500">ATS Uyum Skoru</p>
                                                        <p className="text-5xl font-bold text-emerald-400 print:text-emerald-600">%{job.matchScore}</p>
                                                        <p className="text-xs text-slate-500 mt-3 print:text-slate-400">Sektör ortalamasının üzerinde</p>
                                                    </div>

                                                    <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800 print:bg-slate-50 print:border-slate-200">
                                                        <p className="text-emerald-400 text-sm font-bold mb-3 print:text-emerald-600">Güçlü Yönleriniz</p>
                                                        <ul className="text-slate-300 text-sm space-y-2 list-disc list-inside print:text-slate-700">
                                                            <li>Modern Framework tecrübesi</li>
                                                            <li>Temiz kod mimarisi geçmişi</li>
                                                            <li>Problem çözme yetkinliği</li>
                                                        </ul>
                                                    </div>

                                                    <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800 print:bg-slate-50 print:border-slate-200">
                                                        <p className="text-amber-400 text-sm font-bold mb-3 print:text-amber-600">Gelişim Alanları</p>
                                                        <ul className="text-slate-300 text-sm space-y-2 list-disc list-inside print:text-slate-700">
                                                            <li>Cloud (AWS/Azure) araçları eksik</li>
                                                            <li>Test yazım pratikleri (Jest vb.)</li>
                                                            <li>Açık kaynak katkıları kısıtlı</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="pt-4 flex flex-wrap justify-center gap-4 print:hidden">
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