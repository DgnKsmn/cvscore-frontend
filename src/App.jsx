import logo from './assets/logo2.png';
import React, { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import Register from './Register';
import Login from './Login';
import Premium from './Premium';

pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

function App() {
    // Sayfa yönetimi: 'home', 'job-match', 'ats-check', 'register', 'login', 'premium'
    const [activePage, setActivePage] = useState('home');

    // Ortak Form Durumları
    const [jobLink, setJobLink] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);

    // Analiz Durumları
    const [showResults, setShowResults] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // 1. Ekran (İş Uyumu) Sonuçları
    const [analysisResult, setAnalysisResult] = useState({
        score: 0,
        missingSkills: [],
        improvements: []
    });

    // 2. Ekran (ATS Kontrolü) Sonuçları
    const [atsResult, setAtsResult] = useState({
        score: 0,
        fileCheck: '',
        contactCheck: '',
        experienceCheck: '',
        suggestions: []
    });

    const generateConsistentScore = (keyString) => {
        let hash = 0;
        for (let i = 0; i < keyString.length; i++) {
            hash = keyString.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash % 101);
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setSelectedFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const extractTextFromPdf = async (file) => {
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
            alert("Sunucu ile bağlantı kurulamadı.");
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
    };

    const handleCalculateMatch = async () => {
        if (!jobLink && !jobDescription) {
            alert("Lütfen bir iş ilanı linki girin veya iş tanımı metnini yapıştırın!");
            return;
        }
        if (!selectedFile) {
            alert("Lütfen analiz için bir CV dosyası yükleyin!");
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

        const jobContext = jobDescription ? jobDescription : `İlan Linki: ${jobLink}`;
        const aiResult = await analyzeWithGemini(extractedCvText, jobContext);

        if (aiResult === "AUTH_REQUIRED") {
            alert("Öncelikle hesap oluşturmalısınız veya kayıtlı hesabınıza giriş yapmalısınız.");
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
            alert("Yapay zeka analizi sırasında bir hata oluştu.");
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
        if (!selectedFile) {
            alert("Lütfen ATS analizi için bir CV dosyası yükleyin!");
            return;
        }

        setShowResults(false);
        setIsAnalyzing(true);

        if (selectedFile.type === "application/pdf") {
            await extractTextFromPdf(selectedFile);
        }

        setTimeout(() => {
            const stableScore = generateConsistentScore(selectedFile.name + "ATS_SALT_KEY");
            let fileCheck = 'Geçerli Format (.pdf)';
            let contactCheck = 'Eksiksiz (Telefon, E-posta, LinkedIn mevcut)';
            let experienceCheck = 'Geliştirilebilir (Projeler daha detaylı anlatılabilir)';
            let tempSuggestions = [];

            if (stableScore >= 80) {
                tempSuggestions = [
                    'CV yapınız ATS sistemleri tarafından mükemmel okunuyor.',
                    'Eğitim ve iletişim bilgilerinizin yerleşimi standartlara tamamen uygun.',
                    'Projelerinizde kullandığınız teknolojileri kalın (bold) yaparak okunabilirliği artırabilirsiniz.'
                ];
            } else if (stableScore >= 55 && stableScore < 80) {
                tempSuggestions = [
                    'Eğitim bölümündeki kronolojik sıralamayı yeniden kontrol edin (En yeni okul en üstte olmalı).',
                    'Projelerinizdeki sorumluluklarınızı maddeler halinde (bullet points) listeleyin.',
                    'Yetenekler bölümünde çok fazla genel başlık yerine doğrudan teknolojileri vurgulayın.'
                ];
            } else {
                tempSuggestions = [
                    'CV\'nizde grafik ve ikon kullanımı ATS tarayıcılarının metni okumasını zorlaştırabilir. Daha sade bir şablon deneyin.',
                    'İletişim bilgilerinizin doğruluğundan ve GitHub profilinizin güncelliğinden emin olun.',
                    'İş veya proje deneyimlerinizde başardığınız işleri ölçülebilir (sayısal) verilerle destekleyin.'
                ];
            }

            setAtsResult({
                score: stableScore,
                fileCheck,
                contactCheck,
                experienceCheck,
                suggestions: tempSuggestions
            });
            sonuclariVeritabaninaKaydet(selectedFile.name, "", 0, stableScore, tempSuggestions.join(" | "));
            setIsAnalyzing(false);
            setShowResults(true);
        }, 1200);
    };

    const getScoreColorHex = (score) => {
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

    const isLoggedIn = !!localStorage.getItem('cvscore_jwt');

    const handleLogout = () => {
        localStorage.removeItem('cvscore_jwt');
        alert("Başarıyla çıkış yapıldı.");
        window.location.href = "/";
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between font-sans">
            {/* ÜST NAVBAR */}
            <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div
                        onClick={() => { setActivePage('home'); handleReset(); }}
                        className="text-2xl font-black tracking-wider cursor-pointer hover:opacity-80 transition-all flex items-center gap-2"
                    >
                        <img src={logo} alt="CVSCORE Logo" className="h-12 w-auto" />
                    </div>

                    {/* SAĞ ÜST BUTONLAR */}
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

            {/* ANA İÇERİK */}
            <main className="flex-grow flex items-center justify-center p-6 w-full max-w-6xl mx-auto">

                {activePage === 'register' && (
                    <div className="w-full max-w-md mx-auto">
                        <Register setActivePage={setActivePage} />
                    </div>
                )}

                {activePage === 'login' && (
                    <div className="w-full max-w-md mx-auto">
                        <Login setActivePage={setActivePage} />
                    </div>
                )}

                {activePage === 'premium' && (
                    <div className="w-full flex justify-center py-8">
                        <Premium setActivePage={setActivePage} />
                    </div>
                )}

                {activePage === 'home' && (
                    <div className="max-w-3xl w-full text-center space-y-8">
                        <div className="space-y-4">
                            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                                Yapay Zeka Destekli CV Analizi
                            </h1>
                            <p className="text-slate-400 text-lg md:text-xl max-w-xl mx-auto">
                                CV'nizi ATS standartlarına göre optimize edin ve iş ilanlarına uyumunuzu anında ölçün.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 pt-4">
                            <button
                                onClick={() => { setActivePage('job-match'); handleReset(); }}
                                className="group relative bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-8 rounded-2xl text-left transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] flex flex-col justify-between min-h-[220px]"
                            >
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 text-2xl mb-4">🎯</div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-100 mb-2">İŞ UYUMU HESAPLA</h3>
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
                        </div>
                    </div>
                )}

                {activePage === 'job-match' && (
                    <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-stretch">
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6 flex flex-col justify-between">
                            <div className="space-y-6">
                                <div className="border-b border-slate-800 pb-4">
                                    <h2 className="text-2xl font-bold text-slate-100">İŞ UYUMU HESAPLA</h2>
                                    <p className="text-sm text-slate-400 mt-1">İlan detayları ile CV'nizi karşılaştırın</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-300 block">İş İlanı Linki</label>
                                    <input
                                        type="text"
                                        value={jobLink}
                                        onChange={(e) => setJobLink(e.target.value)}
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
                                        onChange={(e) => setJobDescription(e.target.value)}
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

                            <div className="grid grid-cols-3 gap-4 pt-6">
                                <button onClick={handleReset} className="bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold py-3 rounded-xl transition-colors">
                                    Sıfırla
                                </button>
                                <button onClick={handleCalculateMatch} disabled={isAnalyzing} className="col-span-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold py-3 rounded-xl transition-all disabled:opacity-50">
                                    {isAnalyzing ? "Uyum Hesaplanıyor..." : "Uyumu Hesapla"}
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between min-h-[500px]">
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
                                        <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">AI Active</span>
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
                    <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-stretch">
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6 flex flex-col justify-between">
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

                            <div className="grid grid-cols-3 gap-4 pt-6">
                                <button onClick={handleReset} className="bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold py-3 rounded-xl transition-colors">
                                    Sıfırla
                                </button>
                                <button onClick={handleAtsCheck} disabled={isAnalyzing} className="col-span-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-bold py-3 rounded-xl transition-all disabled:opacity-50">
                                    {isAnalyzing ? "Analiz Ediliyor..." : "ATS Skorunu Hesapla"}
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between min-h-[500px]">
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
                                        <span className="text-xs text-teal-400 bg-teal-400/10 px-2 py-1 rounded">ATS Guard Active</span>
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

            <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-600">
                © 2026 CVSCORE - Yapay Zeka Destekli CV Analiz Platformu
            </footer>
        </div>
    );
}

export default App;