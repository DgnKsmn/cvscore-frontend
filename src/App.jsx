import React, { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import Register from './Register';
import Login from './Login';
import Premium from './Premium';
import MobileMenu from './components/MobileMenu';
import { Toaster, toast } from 'react-hot-toast';

pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

function App() {
    const [activePage, setActivePage] = useState('home');

    // CV Uyumu ve ATS Analizi için State'ler
    const [jobLink, setJobLink] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showAuthWarning, setShowAuthWarning] = useState(false);

    // Gelişmiş İş Bulma Modülü İçin State'ler
    const [jobKeyword, setJobKeyword] = useState('');
    const [jobList, setJobList] = useState([]);
    const [isJobSearching, setIsJobSearching] = useState(false);
    const [hasSearchedJobs, setHasSearchedJobs] = useState(false);

    // Sayfalama (Pagination) state'leri
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMoreJobs, setHasMoreJobs] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const [analysisResult, setAnalysisResult] = useState({
        score: 0,
        missingSkills: [],
        improvements: []
    });

    const [atsResult, setAtsResult] = useState({
        score: 0,
        fileCheck: '',
        contactCheck: '',
        experienceCheck: '',
        suggestions: []
    });

    const isLoggedIn = !!localStorage.getItem('cvscore_jwt');

    const handleDrag = e => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const uploadCvToBackend = async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const token = localStorage.getItem('cvscore_jwt');

        try {
            console.log("Sistem Log: PDF backend'e gönderiliyor...");

            const response = await fetch("https://cvscore-backend-production.up.railway.app/api/resume/upload", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData,
            });

            const data = await response.json();
            console.log("Backend'den Gelen Yanıt:", data);

            if (response.ok) {
                toast.success("CV'niz başarıyla sisteme yüklendi!");
            } else {
                toast.error("CV yüklenirken bir sorun oluştu: " + (data.error || "Lütfen tekrar deneyin."));
            }

        } catch (error) {
            console.error("Yükleme hatası:", error);
            toast.error("Sunucu bağlantısı kurulamadı.");
        }
    };

    const handleDrop = e => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            setSelectedFile(file);

            if (file.type === "application/pdf") {
                uploadCvToBackend(file);
            }
        }
    };

    const handleFileChange = e => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);

            if (file.type === "application/pdf") {
                uploadCvToBackend(file);
            }
        }
    };

    const extractTextFromPdf = async file => {
        if (!file || file.type !== "application/pdf") {
            return "PDF formatında bir dosya yüklenmediği için metin okunamadı.";
        }
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = "";

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(" ");
                fullText += pageText + "\n";
            }
            return fullText;
        } catch (error) {
            console.error("Sistem Log: PDF dosyası okunurken bir hata oluştu:", error);
            return "PDF okunurken hata oluştu.";
        }
    };

    const analyzeWithGemini = async (cvText, jobContext) => {
        const requestBody = {
            cvText: cvText,
            jobDescription: jobContext
        };

        const token = localStorage.getItem('cvscore_jwt');

        try {
            const response = await fetch("https://cvscore-backend-production.up.railway.app/api/ai/analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
            });

            if (response.status === 403) {
                return "AUTH_REQUIRED";
            }

            if (response.status === 402) {
                return "LIMIT_REACHED";
            }

            if (!response.ok) {
                console.error("Sistem Log: Backend sunucusundan hata döndü. Durum:", response.status);
                return null;
            }

            const rawResponse = await response.json();
            let rawText = rawResponse.candidates[0].content.parts[0].text;
            let jsonString = rawText.replace(/```json/ig, '').replace(/```/g, '').trim();
            const finalResult = JSON.parse(jsonString);

            return finalResult;
        } catch (error) {
            console.error("Analiz Hatası:", error);
            toast.error("Sunucu ile bağlantı kurulamadı.");
            return null;
        }
    };

    const sonuclariVeritabaninaKaydet = async (dosyaAdi, isLinki, uyumSkoru, atsSkoru, eksiklikler) => {
        const veri = {
            fileName: dosyaAdi,
            jobLink: isLinki || "",
            matchScore: uyumSkoru || 0,
            atsScore: atsSkoru || 0,
            suggestions: eksiklikler || ""
        };

        try {
            const token = localStorage.getItem('cvscore_jwt');
            await fetch("https://cvscore-backend-production.up.railway.app/api/analysis/save", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(veri),
            });
        } catch (error) {
            console.error("Sistem Log: Backend ulaşılamıyor.", error);
        }
    };

    const handleReset = () => {
        setJobLink('');
        setJobDescription('');
        setSelectedFile(null);
        setShowResults(false);
        setShowAuthWarning(false);
        setJobKeyword('');
        setJobList([]);
        setHasSearchedJobs(false);
        setCurrentPage(1);
        setHasMoreJobs(true);
    };

    const handleCalculateMatch = async () => {
        if (!isLoggedIn) {
            setShowAuthWarning(true);
            toast.error("Henüz giriş yapmadınız. Lütfen öncelikle Giriş Yapın veya Kaydolun.");
            return;
        }

        setShowAuthWarning(false);

        if (!jobLink && !jobDescription) {
            toast.error("Lütfen bir iş ilanı linki girin veya iş tanımı metnini yapıştırın!");
            return;
        }
        if (!selectedFile) {
            toast.error("Lütfen analiz için bir CV dosyası yükleyin!");
            return;
        }

        setShowResults(false);
        setIsAnalyzing(true);

        let extractedCvText = "";
        if (selectedFile.type === "application/pdf") {
            extractedCvText = await extractTextFromPdf(selectedFile);
        } else {
            extractedCvText = "Sadece PDF okuma desteklenmektedir. Lütfen bir PDF yükleyin.";
        }

        const jobContext = jobDescription || `İlan Linki: ${jobLink}`;
        const aiResult = await analyzeWithGemini(extractedCvText, jobContext);

        if (aiResult === "AUTH_REQUIRED") {
            toast.error("Öncelikle hesap oluşturmalısınız veya kayıtlı hesabınıza giriş yapmalısınız.");
            setActivePage('login');
            setIsAnalyzing(false);
            return;
        }

        if (aiResult === "LIMIT_REACHED") {
            setIsAnalyzing(false);
            setActivePage('premium');
            return;
        }

        if (aiResult) {
            setAnalysisResult({
                score: aiResult.score,
                missingSkills: aiResult.missingSkills,
                improvements: aiResult.improvements
            });
            sonuclariVeritabaninaKaydet(selectedFile.name, jobLink, aiResult.score, 0, aiResult.missingSkills.join(" | "));
        } else {
            toast.error("Analiz sırasında bir hata oluştu.");
            setAnalysisResult({
                score: 0,
                missingSkills: ["Analiz motoruna ulaşılamadı."],
                improvements: ["API bağlantınızı gözden geçirin."]
            });
        }
        setIsAnalyzing(false);
        setShowResults(true);
    };

    const handleAtsCheck = async () => {
        if (!isLoggedIn) {
            setShowAuthWarning(true);
            toast.error("Henüz giriş yapmadınız. Lütfen öncelikle Giriş Yapın veya Kaydolun.");
            return;
        }

        setShowAuthWarning(false);

        if (!selectedFile) {
            toast.error("Lütfen ATS analizi için bir CV dosyası yükleyin!");
            return;
        }

        setShowResults(false);
        setIsAnalyzing(true);

        let extractedCvText = "";
        if (selectedFile.type === "application/pdf") {
            extractedCvText = await extractTextFromPdf(selectedFile);
        } else {
            extractedCvText = "Sadece PDF okuma desteklenmektedir.";
            toast.error(extractedCvText);
            setIsAnalyzing(false);
            return;
        }

        try {
            const token = localStorage.getItem('cvscore_jwt');
            const response = await fetch("https://cvscore-backend-production.up.railway.app/api/ai/ats-analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ cvText: extractedCvText })
            });

            if (response.status === 403) {
                toast.error("Öncelikle hesap oluşturmalısınız veya giriş yapmalısınız.");
                setActivePage('login');
                setIsAnalyzing(false);
                return;
            }

            if (response.status === 402) {
                setIsAnalyzing(false);
                setActivePage('premium');
                return;
            }

            if (!response.ok) {
                throw new Error("Sunucu hatası: " + response.status);
            }

            const rawResponse = await response.json();
            let rawText = rawResponse.candidates[0].content.parts[0].text;
            let jsonString = rawText.replace(/```json/ig, '').replace(/```/g, '').trim();
            const finalResult = JSON.parse(jsonString);

            setAtsResult({
                score: finalResult.score || 0,
                fileCheck: finalResult.fileCheck || 'Belirsiz',
                contactCheck: finalResult.contactCheck || 'Belirsiz',
                experienceCheck: finalResult.experienceCheck || 'Belirsiz',
                suggestions: finalResult.suggestions || []
            });

            sonuclariVeritabaninaKaydet(
                selectedFile.name,
                "Bağımsız ATS Analizi",
                0,
                finalResult.score || 0,
                (finalResult.suggestions || []).join(" | ")
            );

            setIsAnalyzing(false);
            setShowResults(true);

        } catch (error) {
            console.error("Gerçek ATS Analiz Hatası:", error);
            toast.error("ATS analizi sırasında bir hata oluştu.");
            setAtsResult({
                score: 0,
                fileCheck: 'Hata',
                contactCheck: 'Hata',
                experienceCheck: 'Hata',
                suggestions: ["Sunucu bağlantısı kurulamadı veya AI yanıtı işlenemedi."]
            });
            setIsAnalyzing(false);
            setShowResults(true);
        }
    };

    const handleJobSearch = async () => {
        if (!isLoggedIn) {
            setShowAuthWarning(true);
            toast.error("Henüz giriş yapmadınız. Lütfen öncelikle Giriş Yapın veya Kaydolun.");
            return;
        }
        setShowAuthWarning(false);

        if (!jobKeyword.trim()) {
            toast.error("Lütfen aranacak hedef pozisyonu girin.");
            return;
        }

        setIsJobSearching(true);
        setHasSearchedJobs(false);
        setJobList([]);
        setCurrentPage(1);
        setHasMoreJobs(true);

        try {
            const token = localStorage.getItem('cvscore_jwt');
            const safeQuery = encodeURIComponent(jobKeyword);
            const response = await fetch(`https://cvscore-backend-production.up.railway.app/api/jobs/search?query=${safeQuery}&page=1`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.status === 403) {
                toast.error("Oturumunuz süresi dolmuş veya geçersiz. Lütfen tekrar giriş yapın.");
                setActivePage('login');
                setIsJobSearching(false);
                return;
            }

            if (!response.ok) {
                throw new Error("İlanlar çekilirken sunucu kaynaklı bir hata oluştu.");
            }

            const data = await response.json();
            setJobList(data);
            setHasSearchedJobs(true);

            if (data.length < 10) {
                setHasMoreJobs(false);
            }

        } catch (error) {
            console.error("İlan Arama Hatası:", error);
            toast.error(error.message || "İlanlar getirilirken bir sorun oluştu.");
        } finally {
            setIsJobSearching(false);
        }
    };

    const handleLoadMore = async () => {
        if (isLoadingMore || !hasMoreJobs) return;
        setIsLoadingMore(true);

        const nextPage = currentPage + 1;

        try {
            const token = localStorage.getItem('cvscore_jwt');
            const safeQuery = encodeURIComponent(jobKeyword);
            const response = await fetch(`https://cvscore-backend-production.up.railway.app/api/jobs/search?query=${safeQuery}&page=${nextPage}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.status === 403) {
                toast.error("Oturumunuz süresi dolmuş veya geçersiz. Lütfen tekrar giriş yapın.");
                setActivePage('login');
                setIsLoadingMore(false);
                return;
            }

            if (!response.ok) {
                throw new Error("İlanlar çekilirken sunucu kaynaklı bir hata oluştu.");
            }

            const data = await response.json();

            if (data && data.length > 0) {
                setJobList(prev => [...prev, ...data]);
                setCurrentPage(nextPage);

                if (data.length < 10) {
                    setHasMoreJobs(false);
                }
            } else {
                setHasMoreJobs(false);
            }

        } catch (error) {
            console.error("Daha fazla ilan çekilirken hata:", error);
            toast.error("Yeni ilanlar getirilirken bir sorun oluştu.");
        } finally {
            setIsLoadingMore(false);
        }
    };

    const getScoreColorHex = score => {
        if (score < 50) return '#b91c1c';
        if (score >= 50 && score < 70) return '#ea580c';
        if (score >= 70 && score < 90) return '#f97316';
        return '#fb923c';
    };

    const radius = 54;
    const circumference = 2 * Math.PI * radius;

    useEffect(() => {
        if (activePage !== 'home') {
            window.history.pushState({ page: activePage }, "", `?sayfa=${activePage}`);
        } else {
            window.history.replaceState({ page: 'home' }, "", "/");
        }
    }, [activePage]);

    useEffect(() => {
        const handleBackButton = () => setActivePage('home');
        window.addEventListener('popstate', handleBackButton);
        return () => window.removeEventListener('popstate', handleBackButton);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('cvscore_jwt');
        toast.success("Başarıyla çıkış yapıldı! Görüşmek üzere.");
        setTimeout(() => {
            window.location.href = "/";
        }, 1500);
    };

    return (
        <div className={`relative text-white flex flex-col justify-between font-sans selection:bg-orange-500/30 ${
            activePage === 'home' ? 'h-screen overflow-hidden md:h-auto md:min-h-screen md:overflow-auto' : 'min-h-screen'
        }`}>
            {/* MOBİL ANA EKRANDA SCROLL'U KİLİTLEYEN DÜZENLEME BURADA */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#0a0404]">
                <div className="absolute top-[10%] -left-[20%] w-[800px] h-[800px] rounded-full border border-red-700/20 bg-red-900/10 blur-[1px] flex items-center justify-center">
                    <div className="w-[600px] h-[600px] rounded-full border border-red-600/30 bg-red-800/10 flex items-center justify-center">
                        <div className="w-[400px] h-[400px] rounded-full border border-red-500/40 shadow-[0_0_120px_rgba(220,38,38,0.2)] bg-transparent"></div>
                    </div>
                </div>

                <div className="absolute top-[20%] -right-[20%] w-[1000px] h-[1000px] rounded-full border border-orange-700/20 bg-orange-900/10 blur-[1px] flex items-center justify-center">
                    <div className="w-[750px] h-[750px] rounded-full border border-orange-600/30 bg-orange-800/10 flex items-center justify-center">
                        <div className="w-[500px] h-[500px] rounded-full border border-orange-500/40 shadow-[0_0_150px_rgba(234,88,12,0.15)] bg-transparent"></div>
                    </div>
                </div>
            </div>

            <div className="print:hidden relative z-[9999]">
                <Toaster
                    position="top-right"
                    reverseOrder={false}
                    toastOptions={{
                        style: {
                            borderRadius: '10px',
                            background: '#160604',
                            color: '#fff',
                            border: '1px solid #7c2d12',
                        },
                    }}
                />
            </div>

            <header className="print:hidden border-b border-red-900/30 bg-[#0a0404]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div
                        onClick={() => { setActivePage('home'); handleReset(); }}
                        className="text-2xl font-black tracking-wider cursor-pointer hover:opacity-80 transition-all flex items-center gap-2"
                    >
                        <img
                            src="/logo.png"
                            alt="CVSCORE Logo"
                            className="h-12 w-auto mix-blend-screen drop-shadow-[0_0_8px_rgba(234,88,12,0.5)]"
                        />
                    </div>

                    <div className="hidden md:flex gap-3">
                        {!isLoggedIn ? (
                            <>
                                {(activePage !== 'login' && activePage !== 'register') && (
                                    <button
                                        onClick={() => { setActivePage('login'); handleReset(); }}
                                        className="text-sm bg-red-700 hover:bg-red-600 text-white px-5 py-2.5 rounded-lg transition-all font-semibold shadow-lg shadow-red-700/30 border border-red-600/50"
                                    >
                                        Giriş Yap / Kayıt Ol
                                    </button>
                                )}
                            </>
                        ) : (
                            <button
                                onClick={handleLogout}
                                className="text-sm bg-[#160604] hover:bg-[#2a0c08] border border-red-900/50 text-stone-300 px-5 py-2.5 rounded-lg transition-all font-semibold"
                            >
                                Çıkış Yap
                            </button>
                        )}

                        {activePage !== 'home' && (
                            <button
                                onClick={() => { setActivePage('home'); handleReset(); }}
                                className="text-sm bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded-lg transition-all font-semibold shadow-lg shadow-orange-600/30 ml-2 border border-orange-500/50"
                            >
                                Ana Menü
                            </button>
                        )}
                    </div>

                    <div className="md:hidden">
                        <MobileMenu
                            isLoggedIn={isLoggedIn}
                            handleLogout={handleLogout}
                            setActivePage={setActivePage}
                            handleReset={handleReset}
                        />
                    </div>
                </div>
            </header>

            <main className="flex-grow flex items-center justify-center p-6 w-full max-w-6xl mx-auto relative z-10">
                {activePage === 'register' && (
                    <div className="w-full max-w-md mx-auto print:hidden">
                        <Register setActivePage={setActivePage} />
                    </div>
                )}

                {activePage === 'login' && (
                    <div className="w-full max-w-md mx-auto print:hidden">
                        <Login setActivePage={setActivePage} />
                    </div>
                )}

                {activePage === 'premium' && (
                    <div className="w-full flex justify-center py-8 print:hidden">
                        <Premium setActivePage={setActivePage} />
                    </div>
                )}

                {activePage === 'ai-jobs' && (
                    <div className="w-full max-w-3xl mx-auto flex flex-col items-center space-y-8 print:block">

                        <div className="text-center space-y-2 w-full mt-4">
                            {/* YILDIZ KALDIRILDI VE ORTALANDI */}
                            <h2 className="text-3xl font-bold text-slate-100 text-center">
                                GELİŞMİŞ İŞ BULMA MOTORU
                            </h2>
                        </div>

                        <div className="w-full relative bg-[#160604]/80 border border-orange-900/40 md:rounded-full rounded-2xl shadow-[0_0_20px_rgba(234,88,12,0.1)] focus-within:border-orange-500 transition-colors flex flex-col md:flex-row items-center p-2 backdrop-blur-sm gap-2 md:gap-0">

                            <div className="flex w-full items-center pl-2 md:pl-4">
                                <div className="text-2xl opacity-50 text-orange-500 shrink-0">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                </div>
                                <input
                                    type="text"
                                    value={jobKeyword}
                                    onChange={e => setJobKeyword(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleJobSearch()}
                                    placeholder="Aradığınız Pozisyon (Örn: Java Developer)"
                                    className="w-full bg-transparent border-none text-slate-200 px-3 md:px-4 py-3 focus:outline-none text-base md:text-lg"
                                />
                            </div>

                            <button
                                onClick={handleJobSearch}
                                disabled={isJobSearching}
                                className="w-full md:w-auto shrink-0 bg-gradient-to-r from-red-700 via-orange-600 to-orange-500 hover:from-red-600 hover:via-orange-500 hover:to-orange-400 text-white font-bold py-3 px-8 rounded-xl md:rounded-full transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                            >
                                {isJobSearching ? "Aranıyor..." : "İlan Bul"}
                            </button>
                        </div>

                        {!isLoggedIn && showAuthWarning && (
                            <div
                                onClick={() => setActivePage('login')}
                                className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl w-full text-center text-sm font-medium cursor-pointer hover:bg-red-900/40 transition-colors backdrop-blur-sm"
                            >
                                Henüz giriş yapmadınız. Lütfen öncelikle Giriş Yapın veya Kaydolun.
                            </div>
                        )}

                        {hasSearchedJobs && (
                            <div className="w-full bg-[#160604]/90 border border-red-900/30 p-6 rounded-3xl flex flex-col transition-all shadow-xl backdrop-blur-md">

                                {isJobSearching ? (
                                    <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4 py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500"></div>
                                        <h3 className="text-lg font-bold text-slate-200">İlanlar Taranıyor</h3>
                                        <p className="text-sm text-stone-400 max-w-xs">En uygun gerçek ilanlar filtreleniyor...</p>
                                    </div>
                                ) : jobList.length > 0 ? (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold text-slate-100 px-2 pb-2 border-b border-red-900/30">
                                            Bulunan İlanlar <span className="text-orange-500">({jobList.length})</span>
                                        </h3>

                                        <div className="space-y-3">
                                            {jobList.map((link, index) => (
                                                <a
                                                    key={index}
                                                    href={link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-between p-4 bg-[#0a0302] border border-orange-900/20 rounded-xl hover:border-orange-500/50 hover:bg-[#1f0a07] transition-all group shadow-sm"
                                                >
                                                    <span className="font-medium text-stone-300 group-hover:text-white flex items-center gap-3 text-sm truncate pr-4">
                                                        <span className="text-orange-500 shrink-0">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                                                        </span> LinkedIn İlanı {index + 1}
                                                    </span>
                                                    <span className="text-orange-400 bg-orange-900/20 px-4 py-1.5 rounded-lg font-bold text-xs shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-colors border border-orange-900/50">
                                                        İlana Git ↗
                                                    </span>
                                                </a>
                                            ))}
                                        </div>

                                        <div className="pt-6 pb-2 text-center">
                                            {hasMoreJobs ? (
                                                <button
                                                    onClick={handleLoadMore}
                                                    disabled={isLoadingMore}
                                                    className="bg-[#0a0302] hover:bg-[#1f0a07] border border-orange-900/40 text-stone-300 px-6 py-2.5 rounded-full transition-all font-semibold disabled:opacity-50 flex items-center justify-center mx-auto gap-2"
                                                >
                                                    {isLoadingMore ? (
                                                        <><div className="animate-spin rounded-full h-4 w-4 border-t-2 border-stone-300"></div> Yükleniyor...</>
                                                    ) : "Daha Fazla Göster ↓"}
                                                </button>
                                            ) : (
                                                <div className="mt-4 p-4 bg-[#0a0302] border border-orange-900/30 rounded-xl text-stone-400 text-sm font-bold uppercase tracking-wider">
                                                    MAALESEF BAŞKA İLAN BULUNAMADI
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                ) : (
                                    <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4 py-12 opacity-70">
                                        <div className="text-5xl opacity-50 text-orange-600">
                                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                        </div>
                                        <h3 className="text-lg font-bold text-stone-300">İlan Bulunamadı</h3>
                                        <p className="text-sm text-stone-500 max-w-sm">
                                            Bu arama kriterine uygun aktif, tıklanabilir bir LinkedIn ilanı bulunamadı. Aramanızı daha genel tutarak tekrar deneyebilirsiniz.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activePage === 'home' && (
                    <div className="max-w-4xl w-full text-center space-y-8 print:hidden">
                        <div className="space-y-4">
                            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-red-500 via-orange-500 to-orange-400 bg-clip-text text-transparent leading-tight drop-shadow-sm">
                                KARİYERİNE ODAKLAN <br />
                                VE <br />
                                CV Nİ ANALİZ ET
                            </h1>
                            <p className="text-stone-400 text-lg md:text-xl max-w-xl mx-auto">
                                CV'nizi ATS standartlarına göre optimize edin ve iş ilanlarına uyumunuzu anında ölçün.
                            </p>
                        </div>

                        <div className="hidden md:grid md:grid-cols-3 gap-6 pt-4">
                            <button
                                onClick={() => { setActivePage('job-match'); handleReset(); }}
                                className="group relative bg-[#160604]/80 backdrop-blur-sm border border-red-900/30 hover:border-red-500/60 p-8 rounded-2xl text-left transition-all duration-300 hover:shadow-[0_0_30px_rgba(239,68,68,0.15)] flex flex-col justify-between min-h-[220px]"
                            >
                                <div className="w-12 h-12 bg-red-900/30 rounded-xl flex items-center justify-center text-red-500 mb-4 border border-red-500/20">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 16a6 6 0 110-12 6 6 0 010 12zm0-9a3 3 0 100 6 3 3 0 000-6z"/>
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-100 mb-2">İş Uyumunu Hesapla</h3>
                                    <p className="text-sm text-stone-400">LinkedIn veya kariyer sitelerindeki ilanlarla CV'nizi karşılaştırın.</p>
                                </div>
                            </button>

                            <button
                                onClick={() => { setActivePage('ats-check'); handleReset(); }}
                                className="group relative bg-[#160604]/80 backdrop-blur-sm border border-orange-900/30 hover:border-orange-500/60 p-8 rounded-2xl text-left transition-all duration-300 hover:shadow-[0_0_30px_rgba(234,88,12,0.15)] flex flex-col justify-between min-h-[220px]"
                            >
                                <div className="w-12 h-12 bg-orange-900/30 rounded-xl flex items-center justify-center text-orange-600 mb-4 border border-orange-600/20">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M4 16h4v4H4zm6-8h4v12h-4zm6-4h4v16h-4z"/>
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-100 mb-2">ATS Skorunu Öğren</h3>
                                    <p className="text-sm text-stone-400">CV'nizin biçimsel hatalarını ve genel ATS puanını analiz edin.</p>
                                </div>
                            </button>

                            <button
                                onClick={() => { setActivePage('ai-jobs'); handleReset(); }}
                                className="group relative bg-[#160604]/80 backdrop-blur-sm border border-orange-700/30 hover:border-orange-400/60 p-8 rounded-2xl text-left transition-all duration-300 hover:shadow-[0_0_30px_rgba(251,146,60,0.15)] flex flex-col justify-between min-h-[220px]"
                            >
                                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-400 mb-4 border border-orange-400/20">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6-6.2-4.5-6.2 4.5 2.4-7.6L2 9.6h7.6z"/>
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-100 mb-2">Gelişmiş İş Bulma Motoru</h3>
                                    <p className="text-sm text-stone-400">Sizin için en uygun iş ilanı linklerini bulun ve eşleşmeleri anında görün.</p>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {activePage === 'job-match' && (
                    <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-start print:block">
                        <div className="print:hidden bg-[#160604]/90 backdrop-blur-md border border-red-900/30 p-6 rounded-2xl space-y-6 flex flex-col justify-between shadow-xl">
                            <div className="space-y-6">
                                <div className="border-b border-red-900/40 pb-4">
                                    <h2 className="text-2xl font-bold text-slate-100">İş Uyumunu Hesapla</h2>
                                    <p className="text-sm text-stone-400 mt-1">İlan detayları ile CV'nizi karşılaştırın</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-stone-300 block">İş İlanı Linki</label>
                                    <input
                                        type="text"
                                        value={jobLink}
                                        onChange={e => setJobLink(e.target.value)}
                                        placeholder="Linkedin, Kariyer.net vb. ilan linkini yapıştırın"
                                        className="w-full bg-[#0a0302] border border-orange-900/40 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-orange-500 transition-colors shadow-inner"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-semibold text-stone-300 block">İş Tanımı / Aranan Nitelikler</label>
                                        <span className="text-[10px] bg-red-900/40 text-red-400 px-2 py-0.5 rounded font-mono border border-red-800/50">CORS Güvencesi</span>
                                    </div>
                                    <textarea
                                        value={jobDescription}
                                        onChange={e => setJobDescription(e.target.value)}
                                        placeholder="İlandaki teknik gereksinimleri doğrudan buraya yapıştırabilirsiniz..."
                                        rows="4"
                                        className="w-full bg-[#0a0302] border border-orange-900/40 rounded-xl px-4 py-3 text-slate-200 text-xs focus:outline-none focus:border-orange-500 transition-colors resize-none font-sans leading-relaxed shadow-inner"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-stone-300 block">CV Dosyası (.pdf)</label>
                                    <div
                                        onDragEnter={handleDrag}
                                        onDragOver={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDrop={handleDrop}
                                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                                            dragActive ? 'border-orange-500 bg-orange-900/20' : 'border-orange-900/40 bg-[#0a0302] hover:border-orange-500/50'
                                        }`}
                                    >
                                        <input type="file" id="file-upload" accept=".pdf" onChange={handleFileChange} className="hidden" />
                                        <label htmlFor="file-upload" className="cursor-pointer space-y-3 block">
                                            <div className="text-4xl drop-shadow-md text-orange-500">
                                                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                            </div>
                                            {selectedFile ? (
                                                <p className="text-orange-400 font-semibold text-sm truncate max-w-xs mx-auto mt-2">{selectedFile.name}</p>
                                            ) : (
                                                <p className="text-stone-400 text-sm mt-2">Dosya seçin veya sürükleyip bırakın</p>
                                            )}
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {!isLoggedIn && showAuthWarning && (
                                <div
                                    onClick={() => setActivePage('login')}
                                    className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mt-4 w-full text-center text-sm font-medium cursor-pointer hover:bg-red-900/40 transition-colors"
                                >
                                    Henüz giriş yapmadınız. Lütfen öncelikle Giriş Yapın veya Kaydolun.
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-4 pt-6">
                                <button onClick={handleReset} className="bg-[#0a0302] border border-red-900/50 hover:bg-[#1f0a07] text-red-500 font-semibold py-3 rounded-xl transition-colors shadow-sm">
                                    Sıfırla
                                </button>
                                <button onClick={handleCalculateMatch} disabled={isAnalyzing} className="col-span-2 bg-gradient-to-r from-red-700 via-orange-600 to-orange-500 hover:from-red-600 hover:via-orange-500 hover:to-orange-400 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-orange-500/20">
                                    {isAnalyzing ? "Uyum Hesaplanıyor..." : "Uyumu Hesapla"}
                                </button>
                            </div>
                        </div>

                        <div className="bg-[#160604]/90 backdrop-blur-md border border-red-900/30 p-6 rounded-2xl flex flex-col justify-between min-h-[500px] print:border-none print:shadow-none shadow-xl">
                            {!showResults ? (
                                <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4 py-12">
                                    {isAnalyzing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500"></div>
                                            <h3 className="text-lg font-bold text-slate-200">Analiz Motoru Çalışıyor</h3>
                                            <p className="text-sm text-stone-400 max-w-xs">CV metni ayıklanıyor ve gereksinimlerle eşleştiriliyor...</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-orange-600 opacity-40 filter drop-shadow-[0_0_8px_rgba(234,88,12,0.5)]">
                                                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 16a6 6 0 110-12 6 6 0 010 12zm0-9a3 3 0 100 6 3 3 0 000-6z"/></svg>
                                            </div>
                                            <h3 className="text-lg font-bold text-stone-300">Sonuç Paneli</h3>
                                            <p className="text-sm text-stone-500 max-w-xs">Bilgileri girdikten sonra "Uyumu Hesapla" butonuna basarak analizi başlatabilirsiniz.</p>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="border-b border-red-900/40 pb-3 flex justify-between items-center">
                                        <h3 className="text-xl font-bold text-slate-100">Analiz Sonucu</h3>

                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => window.print()}
                                                className="print:hidden text-xs bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-red-500/20"
                                            >
                                                <span>📥</span> Raporu İndir
                                            </button>
                                            <span className="text-xs text-orange-400 bg-orange-900/30 px-2 py-1 rounded border border-orange-500/20">Analysis Active</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center justify-center py-4 bg-[#0a0302] rounded-xl border border-orange-900/30 shadow-inner">
                                        <div className="relative flex items-center justify-center">
                                            <svg className="w-32 h-32 transform -rotate-90 drop-shadow-md">
                                                <circle cx="64" cy="64" r={radius} className="stroke-[#2a0c08]" strokeWidth="10" fill="transparent" />
                                                <circle
                                                    cx="64"
                                                    cy="64"
                                                    r={radius}
                                                    strokeWidth="10"
                                                    fill="transparent"
                                                    strokeDasharray={circumference}
                                                    strokeDashoffset={circumference - (analysisResult.score / 100) * circumference}
                                                    strokeLinecap="round"
                                                    style={{
                                                        stroke: getScoreColorHex(analysisResult.score),
                                                        transition: 'stroke-dashoffset 0.8s ease-in-out, stroke 0.5s ease'
                                                    }}
                                                />
                                            </svg>
                                            <div className="absolute text-center">
                                                <span
                                                    className="text-3xl font-black transition-colors duration-500 drop-shadow-sm"
                                                    style={{ color: getScoreColorHex(analysisResult.score) }}
                                                >
                                                    %{analysisResult.score}
                                                </span>
                                                <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">Uyum Oranı</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="bg-red-950/20 border border-red-900/40 p-5 rounded-xl space-y-3">
                                            <h4 className="text-md font-bold text-red-500 flex items-center gap-2">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> CV'nin Eksiklikleri
                                            </h4>
                                            <ul className="text-sm md:text-base text-stone-200 space-y-2 list-disc pl-5 leading-relaxed">
                                                {analysisResult.missingSkills.map((item, idx) => <li key={idx}>{item}</li>)}
                                            </ul>
                                        </div>

                                        <div className="bg-orange-950/20 border border-orange-900/40 p-5 rounded-xl space-y-3">
                                            <h4 className="text-md font-bold text-orange-400 flex items-center gap-2">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> Geliştirilmesi Gerekenler
                                            </h4>
                                            <ul className="text-sm md:text-base text-stone-200 space-y-2 list-disc pl-5 leading-relaxed">
                                                {analysisResult.improvements.map((item, idx) => <li key={idx}>{item}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activePage === 'ats-check' && (
                    <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-start print:block">
                        <div className="print:hidden bg-[#160604]/90 backdrop-blur-md border border-red-900/30 p-6 rounded-2xl space-y-6 flex flex-col justify-between shadow-xl">
                            <div className="space-y-6">
                                <div className="border-b border-red-900/40 pb-4">
                                    <h2 className="text-2xl font-bold text-slate-100">ATS Skorunu Öğren</h2>
                                    <p className="text-sm text-stone-400 mt-1">CV'nizi bağımsız ATS kriterlerine göre puanlayın</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-stone-300 block">CV Dosyası (.pdf)</label>
                                    <div
                                        onDragEnter={handleDrag}
                                        onDragOver={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDrop={handleDrop}
                                        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                                            dragActive ? 'border-orange-500 bg-orange-900/20' : 'border-orange-900/40 bg-[#0a0302] hover:border-orange-500/50'
                                        }`}
                                    >
                                        <input type="file" id="file-upload-ats" accept=".pdf" onChange={handleFileChange} className="hidden" />
                                        <label htmlFor="file-upload-ats" className="cursor-pointer space-y-3 block">
                                            <div className="text-4xl drop-shadow-md text-orange-500">
                                                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                            </div>
                                            {selectedFile ? (
                                                <p className="text-orange-400 font-semibold text-sm truncate max-w-xs mx-auto mt-2">{selectedFile.name}</p>
                                            ) : (
                                                <p className="text-stone-300 text-sm mt-2">Analiz edilecek CV dosyasını seçin veya bırakın</p>
                                            )}
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {!isLoggedIn && showAuthWarning && (
                                <div
                                    onClick={() => setActivePage('login')}
                                    className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mt-4 w-full text-center text-sm font-medium cursor-pointer hover:bg-red-900/40 transition-colors"
                                >
                                    Henüz giriş yapmadınız. Lütfen öncelikle Giriş Yapın veya Kaydolun.
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-4 pt-6">
                                <button onClick={handleReset} className="bg-[#0a0302] border border-red-900/50 hover:bg-[#1f0a07] text-red-500 font-semibold py-3 rounded-xl transition-colors shadow-sm">
                                    Sıfırla
                                </button>
                                <button onClick={handleAtsCheck} disabled={isAnalyzing} className="col-span-2 bg-gradient-to-r from-red-700 via-orange-600 to-orange-500 hover:from-red-600 hover:via-orange-500 hover:to-orange-400 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-orange-500/20">
                                    {isAnalyzing ? "Analiz Ediliyor..." : "ATS Skorunu Hesapla"}
                                </button>
                            </div>
                        </div>

                        <div className="bg-[#160604]/90 backdrop-blur-md border border-red-900/30 p-6 rounded-2xl flex flex-col justify-between min-h-[500px] print:border-none print:shadow-none shadow-xl">
                            {!showResults ? (
                                <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4 py-12">
                                    {isAnalyzing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500"></div>
                                            <h3 className="text-lg font-bold text-slate-200">ATS Motoru Taraması Başladı</h3>
                                            <p className="text-sm text-stone-400 max-w-xs">Biçimsel hatalar, anahtar kelimeler ve yerleşim inceleniyor...</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-orange-600 opacity-40 filter drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]">
                                                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M4 16h4v4H4zm6-8h4v12h-4zm6-4h4v16h-4z"/></svg>
                                            </div>
                                            <h3 className="text-lg font-bold text-stone-300">ATS Kontrol Merkezi</h3>
                                            <p className="text-sm text-stone-500 max-w-xs">Sol panelden CV'nizi yükleyerek bağımsız ATS karnenizi oluşturun.</p>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="border-b border-red-900/40 pb-3 flex justify-between items-center">
                                        <h3 className="text-xl font-bold text-slate-100">Genel ATS Analizi</h3>

                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => window.print()}
                                                className="print:hidden text-xs bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-red-500/20"
                                            >
                                                <span>📥</span> Raporu İndir
                                            </button>
                                            <span className="text-xs text-orange-400 bg-orange-900/30 px-2 py-1 rounded border border-orange-500/20">ATS Guard Active</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center justify-center py-4 bg-[#0a0302] rounded-xl border border-orange-900/30 shadow-inner">
                                        <div className="relative flex items-center justify-center">
                                            <svg className="w-32 h-32 transform -rotate-90 drop-shadow-md">
                                                <circle cx="64" cy="64" r={radius} className="stroke-[#2a0c08]" strokeWidth="10" fill="transparent" />
                                                <circle
                                                    cx="64"
                                                    cy="64"
                                                    r={radius}
                                                    strokeWidth="10"
                                                    fill="transparent"
                                                    strokeDasharray={circumference}
                                                    strokeDashoffset={circumference - (atsResult.score / 100) * circumference}
                                                    strokeLinecap="round"
                                                    style={{
                                                        stroke: getScoreColorHex(atsResult.score),
                                                        transition: 'stroke-dashoffset 0.8s ease-in-out, stroke 0.5s ease'
                                                    }}
                                                />
                                            </svg>
                                            <div className="absolute text-center">
                                                <span
                                                    className="text-3xl font-black transition-colors duration-500 drop-shadow-sm"
                                                    style={{ color: getScoreColorHex(atsResult.score) }}
                                                >
                                                    %{atsResult.score}
                                                </span>
                                                <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">ATS Skoru</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 text-sm">
                                        <div className="bg-[#0a0302] border border-orange-900/30 p-4 rounded-xl space-y-3">
                                            <h4 className="text-stone-300 font-bold border-b border-red-900/40 pb-2">📂 CV Genel Karnesi</h4>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <span className="text-stone-400">Dosya Biçimi:</span>
                                                <span className="text-orange-500 text-right font-semibold">{atsResult.fileCheck}</span>

                                                <span className="text-stone-400">İletişim Bilgileri:</span>
                                                <span className="text-orange-500 text-right font-semibold">{atsResult.contactCheck}</span>

                                                <span className="text-stone-400">Deneyim & Proje Anlatımı:</span>
                                                <span className="text-orange-400 text-right font-semibold">{atsResult.experienceCheck}</span>
                                            </div>
                                        </div>

                                        <div className="bg-orange-950/20 border border-orange-900/40 p-5 rounded-xl space-y-3">
                                            <h4 className="text-md font-bold text-orange-400 flex items-center gap-2">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> CV Geliştirme Önerileri
                                            </h4>
                                            <ul className="text-sm text-stone-200 space-y-2 list-disc pl-5 leading-relaxed">
                                                {atsResult.suggestions.map((item, idx) => <li key={idx}>{item}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </main>

            <footer className="print:hidden border-t border-red-900/30 bg-[#0a0404]/90 backdrop-blur-md py-4 text-center text-xs text-stone-500 relative z-10">
                © 2026 CVSCORE - Gelişmiş CV Analiz Platformu
            </footer>
        </div>
    );
}

export default App;