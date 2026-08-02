import logo from './assets/logo2.png';
import React, { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import Register from './Register';
import Login from './Login';
import Premium from './Premium';
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

    // Yapay Zeka İş Bulma Modülü İçin State'ler
    const [jobKeyword, setJobKeyword] = useState('');
    const [jobList, setJobList] = useState([]);
    const [isJobSearching, setIsJobSearching] = useState(false);
    // YENİ: Aramanın bitip bitmediğini takip etmek için
    const [hasSearchedJobs, setHasSearchedJobs] = useState(false);

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
                toast.success(`Backend PDF'i başarıyla okudu! Uzunluk: ${data.fullTextLength} karakter`);
            } else {
                toast.error("Backend PDF okuma hatası: " + (data.error || "Bilinmeyen hata"));
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
            console.error("Yapay Zeka Analiz Hatası:", error);
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
        setHasSearchedJobs(false); // Sıfırlamada bunu da temizliyoruz
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
            toast.error("Yapay zeka analizi sırasında bir hata oluştu.");
            setAnalysisResult({
                score: 0,
                missingSkills: ["AI motoruna ulaşılamadı."],
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

        if (!selectedFile) {
            toast.error("Lütfen ilan aramadan önce CV'nizi yükleyin.");
            return;
        }

        if (!jobKeyword.trim()) {
            toast.error("Lütfen aranacak hedef pozisyonu girin.");
            return;
        }

        setIsJobSearching(true);
        setHasSearchedJobs(false); // Yeni arama başladığında durumu sıfırla
        setJobList([]);

        try {
            const token = localStorage.getItem('cvscore_jwt');
            const response = await fetch(`https://cvscore-backend-production.up.railway.app/api/jobs/search?query=${jobKeyword}`, {
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
            setHasSearchedJobs(true); // Veri boş gelse bile arama işlemi başarıyla tamamlandı

        } catch (error) {
            console.error("İlan Arama Hatası:", error);
            toast.error(error.message || "İlanlar getirilirken bir sorun oluştu.");
        } finally {
            setIsJobSearching(false);
        }
    };

    const getScoreColorHex = score => {
        if (score < 50) return '#f43f5e';
        if (score >= 50 && score < 70) return '#f59e0b';
        if (score >= 70 && score < 90) return '#34d399';
        return '#10b981';
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
        <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between font-sans">
            <div className="print:hidden">
                <Toaster
                    position="top-right"
                    reverseOrder={false}
                    toastOptions={{
                        style: {
                            borderRadius: '10px',
                            background: '#1e293b',
                            color: '#fff',
                            border: '1px solid #334155',
                        },
                    }}
                />
            </div>

            <header className="print:hidden border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div
                        onClick={() => { setActivePage('home'); handleReset(); }}
                        className="text-2xl font-black tracking-wider cursor-pointer hover:opacity-80 transition-all flex items-center gap-2"
                    >
                        <img src={logo} alt="CVSCORE Logo" className="h-12 w-auto" />
                    </div>

                    <div className="flex gap-3">
                        {!isLoggedIn ? (
                            <>
                                {(activePage !== 'login' && activePage !== 'register') && (
                                    <button
                                        onClick={() => { setActivePage('login'); handleReset(); }}
                                        className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition-all font-semibold shadow-lg shadow-blue-500/30"
                                    >
                                        Giriş Yap / Kayıt Ol
                                    </button>
                                )}
                            </>
                        ) : (
                            <button
                                onClick={handleLogout}
                                className="text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-5 py-2.5 rounded-lg transition-all font-semibold"
                            >
                                Çıkış Yap
                            </button>
                        )}

                        {activePage !== 'home' && (
                            <button
                                onClick={() => { setActivePage('home'); handleReset(); }}
                                className="text-sm bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg transition-all font-semibold shadow-lg shadow-red-500/30 ml-2"
                            >
                                Ana Menü
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-grow flex items-center justify-center p-6 w-full max-w-6xl mx-auto">
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
                    <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-start print:block">

                        {/* SOL PANEL */}
                        <div className="print:hidden bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6 flex flex-col justify-between">
                            <div className="space-y-6">
                                <div className="border-b border-slate-800 pb-4">
                                    <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                                        <span className="text-indigo-400">✨</span> YAPAY ZEKA İLE İŞ BUL
                                    </h2>
                                    <p className="text-sm text-slate-400 mt-1">Sıfır halüsinasyon, %100 çalışan ve doğrulanmış gerçek LinkedIn ilanları.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-300 block">CV Dosyası (.pdf)</label>
                                    <div
                                        onDragEnter={handleDrag}
                                        onDragOver={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDrop={handleDrop}
                                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                                            dragActive ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                                        }`}
                                    >
                                        <input type="file" id="file-upload-jobs" accept=".pdf" onChange={handleFileChange} className="hidden" />
                                        <label htmlFor="file-upload-jobs" className="cursor-pointer space-y-3 block">
                                            <div className="text-4xl">📄</div>
                                            {selectedFile ? (
                                                <p className="text-indigo-400 font-semibold text-sm truncate max-w-xs mx-auto">{selectedFile.name}</p>
                                            ) : (
                                                <p className="text-slate-300 text-sm">İş eşleştirmesi için CV'nizi seçin veya sürükleyin</p>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-300 block">Aradığınız Pozisyon</label>
                                    <input
                                        type="text"
                                        value={jobKeyword}
                                        onChange={e => setJobKeyword(e.target.value)}
                                        placeholder="Örn: Backend Developer"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                                    />
                                </div>
                            </div>

                            {!isLoggedIn && showAuthWarning && (
                                <div
                                    onClick={() => setActivePage('login')}
                                    className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mt-4 w-full text-center text-sm font-medium cursor-pointer hover:bg-red-500/20 transition-colors"
                                >
                                    Henüz giriş yapmadınız. Lütfen öncelikle Giriş Yapın veya Kaydolun.
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-4 pt-6">
                                <button onClick={handleReset} className="bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold py-3 rounded-xl transition-colors">
                                    Sıfırla
                                </button>
                                <button onClick={handleJobSearch} disabled={isJobSearching} className="col-span-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50">
                                    {isJobSearching ? "Aranıyor..." : "İlan Bul"}
                                </button>
                            </div>
                        </div>

                        {/* SAĞ PANEL GÜNCELLENDİ (Empty state mantığı) */}
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between min-h-[500px] print:border-none print:shadow-none">

                            {!hasSearchedJobs && !isJobSearching ? (
                                // 1. Başlangıç Ekranı
                                <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4 py-12 opacity-70">
                                    <div className="text-5xl opacity-50">💼</div>
                                    <h3 className="text-lg font-bold text-slate-400">Sizin İçin Uygun İlanlar</h3>
                                    <p className="text-sm text-slate-500 max-w-xs">CV'nizi yükleyip taramayı başlattığınızda gerçek LinkedIn ilan linkleri burada listelenecektir.</p>
                                </div>
                            ) : isJobSearching ? (
                                // 2. Yükleniyor Ekranı
                                <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4 py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div>
                                    <h3 className="text-lg font-bold text-slate-300">CV ve Pozisyon Analizi</h3>
                                    <p className="text-sm text-slate-500 max-w-xs">En uygun gerçek ilanlar filtreleniyor...</p>
                                </div>
                            ) : jobList.length > 0 ? (
                                // 3. Sonuç Bulundu Ekranı
                                <div className="space-y-6">
                                    <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                                        <h3 className="text-xl font-bold text-slate-100">
                                            Bulunan İlanlar <span className="text-indigo-400">({jobList.length})</span>
                                        </h3>
                                    </div>
                                    <div className="overflow-y-auto max-h-[400px] pr-2 space-y-3 custom-scrollbar">
                                        {jobList.map((link, index) => (
                                            <a
                                                key={index}
                                                href={link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-xl hover:border-[#0a66c2]/50 hover:bg-slate-900 transition-all group"
                                            >
                                                <span className="font-medium text-slate-300 group-hover:text-white flex items-center gap-3 text-sm">
                                                    <span className="text-xl">🔗</span> LinkedIn İlanı {index + 1}
                                                </span>
                                                <span className="text-[#0a66c2] bg-[#0a66c2]/10 px-4 py-1.5 rounded-lg font-bold text-xs group-hover:bg-[#0a66c2] group-hover:text-white transition-colors">
                                                    İlana Git ↗
                                                </span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                // 4. Sonuç Bulunamadı Ekranı (Eksik Olan Kısım Buydu)
                                <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4 py-12 opacity-70">
                                    <div className="text-5xl opacity-50">🔍</div>
                                    <h3 className="text-lg font-bold text-slate-400">İlan Bulunamadı</h3>
                                    <p className="text-sm text-slate-500 max-w-xs">Bu arama kriterine uygun aktif, tıklanabilir bir LinkedIn ilanı bulunamadı. Aramanızı örneğin sadece "Bilgisayar Mühendisi" olarak güncelleyerek tekrar deneyebilirsiniz.</p>
                                </div>
                            )}

                        </div>
                    </div>
                )}

                {activePage === 'home' && (
                    <div className="max-w-4xl w-full text-center space-y-8 print:hidden">
                        <div className="space-y-4">
                            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                                Yapay Zeka Destekli CV Analizi
                            </h1>
                            <p className="text-slate-400 text-lg md:text-xl max-w-xl mx-auto">
                                CV'nizi ATS standartlarına göre optimize edin ve iş ilanlarına uyumunuzu anında ölçün.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6 pt-4">
                            <button
                                onClick={() => { setActivePage('job-match'); handleReset(); }}
                                className="group relative bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-8 rounded-2xl text-left transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] flex flex-col justify-between min-h-[220px]"
                            >
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 text-2xl mb-4">🎯</div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-100 mb-2">İŞE UYUMUNU HESAPLA</h3>
                                    <p className="text-sm text-slate-400">LinkedIn veya kariyer sitelerindeki ilanlarla CV'nizi karşılaştırın.</p>
                                </div>
                            </button>

                            <button
                                onClick={() => { setActivePage('ats-check'); handleReset(); }}
                                className="group relative bg-slate-900 border border-slate-800 hover:border-teal-500/50 p-8 rounded-2xl text-left transition-all duration-300 hover:shadow-[0_0_30px_rgba(20,184,166,0.1)] flex flex-col justify-between min-h-[220px]"
                            >
                                <div className="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-400 text-2xl mb-4">📊</div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-100 mb-2">ATS SKORUNU ÖĞREN</h3>
                                    <p className="text-sm text-slate-400">CV'nizin biçimsel hatalarını ve genel ATS puanını analiz edin.</p>
                                </div>
                            </button>

                            <button
                                onClick={() => { setActivePage('ai-jobs'); handleReset(); }}
                                className="group relative bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-8 rounded-2xl text-left transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] flex flex-col justify-between min-h-[220px]"
                            >
                                <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 text-2xl mb-4">✨</div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-100 mb-2">YAPAY ZEKA İLE İŞ BUL</h3>
                                    <p className="text-sm text-slate-400">Sizin için en uygun 10 iş ilanı linkini bulun ve eşleşmeleri anında görün.</p>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {activePage === 'job-match' && (
                    <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-start print:block">
                        <div className="print:hidden bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6 flex flex-col justify-between">
                            <div className="space-y-6">
                                <div className="border-b border-slate-800 pb-4">
                                    <h2 className="text-2xl font-bold text-slate-100">İŞE UYUMUNU HESAPLA</h2>
                                    <p className="text-sm text-slate-400 mt-1">İlan detayları ile CV'nizi karşılaştırın</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-300 block">İş İlanı Linki</label>
                                    <input
                                        type="text"
                                        value={jobLink}
                                        onChange={e => setJobLink(e.target.value)}
                                        placeholder="Linkedin, Kariyer.net vb. ilan linkini yapıştırın"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-semibold text-slate-300 block">İş Tanımı / Aranan Nitelikler</label>
                                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">CORS Güvencesi</span>
                                    </div>
                                    <textarea
                                        value={jobDescription}
                                        onChange={e => setJobDescription(e.target.value)}
                                        placeholder="İlandaki teknik gereksinimleri doğrudan buraya yapıştırabilirsiniz..."
                                        rows="4"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition-colors resize-none font-sans leading-relaxed"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-300 block">CV Dosyası (.pdf)</label>
                                    <div
                                        onDragEnter={handleDrag}
                                        onDragOver={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDrop={handleDrop}
                                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                                            dragActive ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                                        }`}
                                    >
                                        <input type="file" id="file-upload" accept=".pdf" onChange={handleFileChange} className="hidden" />
                                        <label htmlFor="file-upload" className="cursor-pointer space-y-3 block">
                                            <div className="text-4xl">📄</div>
                                            {selectedFile ? (
                                                <p className="text-emerald-400 font-semibold text-sm truncate max-w-xs mx-auto">{selectedFile.name}</p>
                                            ) : (
                                                <p className="text-slate-300 text-sm">Dosya seçin veya sürükleyip bırakın</p>
                                            )}
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {!isLoggedIn && showAuthWarning && (
                                <div
                                    onClick={() => setActivePage('login')}
                                    className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mt-4 w-full text-center text-sm font-medium cursor-pointer hover:bg-red-500/20 transition-colors"
                                >
                                    Henüz giriş yapmadınız. Lütfen öncelikle Giriş Yapın veya Kaydolun.
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-4 pt-6">
                                <button onClick={handleReset} className="bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold py-3 rounded-xl transition-colors">
                                    Sıfırla
                                </button>
                                <button onClick={handleCalculateMatch} disabled={isAnalyzing} className="col-span-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold py-3 rounded-xl transition-all disabled:opacity-50">
                                    {isAnalyzing ? "Uyum Hesaplanıyor..." : "Uyumu Hesapla"}
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between min-h-[500px] print:border-none print:shadow-none">
                            {!showResults ? (
                                <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4 py-12">
                                    {isAnalyzing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500"></div>
                                            <h3 className="text-lg font-bold text-slate-300">Yapay Zeka Çalışıyor</h3>
                                            <p className="text-sm text-slate-500 max-w-xs">CV metni ayıklanıyor ve gereksinimlerle eşleştiriliyor...</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-5xl opacity-30">📊</div>
                                            <h3 className="text-lg font-bold text-slate-400">Sonuç Paneli</h3>
                                            <p className="text-sm text-slate-500 max-w-xs">Bilgileri girdikten sonra "Uyumu Hesapla" butonuna basarak analizi başlatabilirsiniz.</p>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                                        <h3 className="text-xl font-bold text-slate-100">Analiz Sonucu</h3>

                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => window.print()}
                                                className="print:hidden text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                                            >
                                                <span>📥</span> Raporu İndir
                                            </button>
                                            <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">AI Active</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center justify-center py-4 bg-slate-950/40 rounded-xl border border-slate-800/60">
                                        <div className="relative flex items-center justify-center">
                                            <svg className="w-32 h-32 transform -rotate-90">
                                                <circle cx="64" cy="64" r={radius} className="stroke-slate-800" strokeWidth="10" fill="transparent" />
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
                                                    className="text-3xl font-black transition-colors duration-500"
                                                    style={{ color: getScoreColorHex(analysisResult.score) }}
                                                >
                                                    %{analysisResult.score}
                                                </span>
                                                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Uyum Oranı</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="bg-rose-500/5 border border-rose-500/10 p-5 rounded-xl space-y-3">
                                            <h4 className="text-md font-bold text-rose-400 flex items-center gap-2">
                                                <span>⚠️</span> CV'nin Eksiklikleri
                                            </h4>
                                            <ul className="text-sm md:text-base text-slate-200 space-y-2 list-disc pl-5 leading-relaxed">
                                                {analysisResult.missingSkills.map((item, idx) => <li key={idx}>{item}</li>)}
                                            </ul>
                                        </div>

                                        <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-xl space-y-3">
                                            <h4 className="text-md font-bold text-amber-400 flex items-center gap-2">
                                                <span>💡</span> Geliştirilmesi Gerekenler
                                            </h4>
                                            <ul className="text-sm md:text-base text-slate-200 space-y-2 list-disc pl-5 leading-relaxed">
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
                        <div className="print:hidden bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6 flex flex-col justify-between">
                            <div className="space-y-6">
                                <div className="border-b border-slate-800 pb-4">
                                    <h2 className="text-2xl font-bold text-slate-100">ATS SKORUNU ÖĞREN</h2>
                                    <p className="text-sm text-slate-400 mt-1">CV'nizi bağımsız ATS kriterlerine göre puanlayın</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-300 block">CV Dosyası (.pdf)</label>
                                    <div
                                        onDragEnter={handleDrag}
                                        onDragOver={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDrop={handleDrop}
                                        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                                            dragActive ? 'border-teal-500 bg-teal-500/5' : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                                        }`}
                                    >
                                        <input type="file" id="file-upload-ats" accept=".pdf" onChange={handleFileChange} className="hidden" />
                                        <label htmlFor="file-upload-ats" className="cursor-pointer space-y-3 block">
                                            <div className="text-4xl">📊</div>
                                            {selectedFile ? (
                                                <p className="text-teal-400 font-semibold text-sm truncate max-w-xs mx-auto">{selectedFile.name}</p>
                                            ) : (
                                                <p className="text-slate-300 text-sm">Analiz edilecek CV dosyasını seçin veya bırakın</p>
                                            )}
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {!isLoggedIn && showAuthWarning && (
                                <div
                                    onClick={() => setActivePage('login')}
                                    className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mt-4 w-full text-center text-sm font-medium cursor-pointer hover:bg-red-500/20 transition-colors"
                                >
                                    Henüz giriş yapmadınız. Lütfen öncelikle Giriş Yapın veya Kaydolun.
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-4 pt-6">
                                <button onClick={handleReset} className="bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold py-3 rounded-xl transition-colors">
                                    Sıfırla
                                </button>
                                <button onClick={handleAtsCheck} disabled={isAnalyzing} className="col-span-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-bold py-3 rounded-xl transition-all disabled:opacity-50">
                                    {isAnalyzing ? "Analiz Ediliyor..." : "ATS Skorunu Hesapla"}
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between min-h-[500px] print:border-none print:shadow-none">
                            {!showResults ? (
                                <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4 py-12">
                                    {isAnalyzing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-teal-500"></div>
                                            <h3 className="text-lg font-bold text-slate-300">ATS Motoru Taraması Başladı</h3>
                                            <p className="text-sm text-slate-500 max-w-xs">Biçimsel hatalar, anahtar kelimeler ve yerleşim inceleniyor...</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-5xl opacity-30">🎯</div>
                                            <h3 className="text-lg font-bold text-slate-400">ATS Kontrol Merkezi</h3>
                                            <p className="text-sm text-slate-500 max-w-xs">Sol panelden CV'nizi yükleyerek bağımsız ATS karnenizi oluşturun.</p>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                                        <h3 className="text-xl font-bold text-slate-100">Genel ATS Analizi</h3>

                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => window.print()}
                                                className="print:hidden text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                                            >
                                                <span>📥</span> Raporu İndir
                                            </button>
                                            <span className="text-xs text-teal-400 bg-teal-400/10 px-2 py-1 rounded">ATS Guard Active</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center justify-center py-4 bg-slate-950/40 rounded-xl border border-slate-800/60">
                                        <div className="relative flex items-center justify-center">
                                            <svg className="w-32 h-32 transform -rotate-90">
                                                <circle cx="64" cy="64" r={radius} className="stroke-slate-800" strokeWidth="10" fill="transparent" />
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
                                                    className="text-3xl font-black transition-colors duration-500"
                                                    style={{ color: getScoreColorHex(atsResult.score) }}
                                                >
                                                    %{atsResult.score}
                                                </span>
                                                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">ATS Skoru</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 text-sm">
                                        <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl space-y-3">
                                            <h4 className="text-slate-300 font-bold border-b border-slate-800 pb-2">📂 CV Genel Karnesi</h4>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <span className="text-slate-400">Dosya Biçimi:</span>
                                                <span className="text-emerald-400 text-right font-semibold">{atsResult.fileCheck}</span>

                                                <span className="text-slate-400">İletişim Bilgileri:</span>
                                                <span className="text-emerald-400 text-right font-semibold">{atsResult.contactCheck}</span>

                                                <span className="text-slate-400">Deneyim & Proje Anlatımı:</span>
                                                <span className="text-amber-400 text-right font-semibold">{atsResult.experienceCheck}</span>
                                            </div>
                                        </div>

                                        <div className="bg-teal-500/5 border border-teal-500/10 p-5 rounded-xl space-y-3">
                                            <h4 className="text-md font-bold text-teal-400 flex items-center gap-2">
                                                <span>🚀</span> CV Geliştirme Önerileri
                                            </h4>
                                            <ul className="text-sm text-slate-200 space-y-2 list-disc pl-5 leading-relaxed">
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

            <footer className="print:hidden border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-600">
                © 2026 CVSCORE - Yapay Zeka Destekli CV Analiz Platformu
            </footer>
        </div>
    );
}

export default App;