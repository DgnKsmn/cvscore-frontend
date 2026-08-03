import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

const JobSearch = ({ isLoggedIn, setActivePage }) => {
    const [jobKeyword, setJobKeyword] = useState('');
    const [jobList, setJobList] = useState([]);
    const [isJobSearching, setIsJobSearching] = useState(false);
    const [hasSearchedJobs, setHasSearchedJobs] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMoreJobs, setHasMoreJobs] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const handleJobSearch = async () => {
        if (!isLoggedIn) {
            toast.error("Henüz giriş yapmadınız. Lütfen öncelikle Giriş Yapın veya Kaydolun.");
            return;
        }

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
            const response = await fetch(`https://cvscore-backend-production.up.railway.app/api/jobs/search?query=${jobKeyword}&page=1`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.status === 403) {
                toast.error("Oturumunuz süresi dolmuş veya geçersiz. Lütfen tekrar giriş yapın.");
                setActivePage('login');
                return;
            }

            if (!response.ok) throw new Error("İlanlar çekilirken bir hata oluştu.");

            const data = await response.json();
            setJobList(data);
            setHasSearchedJobs(true);

            if (data.length < 10) setHasMoreJobs(false);

        } catch (error) {
            toast.error("İlanlar getirilirken bir sorun oluştu.");
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
            const response = await fetch(`https://cvscore-backend-production.up.railway.app/api/jobs/search?query=${jobKeyword}&page=${nextPage}`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.status === 403) {
                toast.error("Oturumunuz süresi dolmuş veya geçersiz.");
                setActivePage('login');
                return;
            }

            if (!response.ok) throw new Error("İlanlar çekilirken bir hata oluştu.");

            const data = await response.json();
            if (data && data.length > 0) {
                setJobList(prev => [...prev, ...data]);
                setCurrentPage(nextPage);
                if (data.length < 10) setHasMoreJobs(false);
            } else {
                setHasMoreJobs(false);
            }
        } catch (error) {
            toast.error("Yeni ilanlar getirilirken sorun oluştu.");
        } finally {
            setIsLoadingMore(false);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto flex flex-col items-center pt-10 print:block">
            {/* Google Tarzı Arama Başlığı */}
            <div className="text-center space-y-3 w-full mb-8">
                <h2 className="text-4xl md:text-5xl font-black text-slate-100 flex items-center justify-center gap-3 tracking-tight">
                    <span className="text-blue-500">İş</span>
                    <span className="text-red-500">İlanı</span>
                    <span className="text-yellow-500">Bulucu</span>
                </h2>
                <p className="text-slate-400 text-base">Aradığınız pozisyonu yazın, ilan linklerini saniyeler içinde listeleyelim.</p>
            </div>

            {/* Google Tarzı Arama Çubuğu */}
            <div className="w-full relative bg-white rounded-full shadow-lg flex items-center p-2 mb-10 transition-all hover:shadow-xl focus-within:shadow-blue-500/20 focus-within:ring-2 ring-blue-400">
                <div className="pl-4 text-xl opacity-40">🔍</div>
                <input
                    type="text"
                    value={jobKeyword}
                    onChange={e => setJobKeyword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleJobSearch()}
                    placeholder="Örn: Java Developer, Frontend, Veri Analisti..."
                    className="flex-grow bg-transparent border-none text-slate-800 px-4 py-3 focus:outline-none text-lg placeholder-slate-400"
                />
                <button
                    onClick={handleJobSearch}
                    disabled={isJobSearching}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full transition-all disabled:opacity-50 flex items-center gap-2"
                >
                    {isJobSearching ? "Aranıyor..." : "Arama Yap"}
                </button>
            </div>

            {/* Sonuç Alanı */}
            {hasSearchedJobs && (
                <div className="w-full bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col transition-all shadow-xl text-left">
                    {isJobSearching ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div>
                        </div>
                    ) : jobList.length > 0 ? (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-400 mb-4">
                                Yaklaşık {jobList.length} sonuç bulundu.
                            </p>
                            <ul className="space-y-4">
                                {jobList.map((link, index) => (
                                    <li key={index} className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 hover:border-slate-600 transition-colors">
                                        <a
                                            href={link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 hover:underline break-all text-base"
                                        >
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>

                            {hasMoreJobs && (
                                <div className="pt-4 text-center">
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={isLoadingMore}
                                        className="text-blue-400 hover:text-blue-300 font-semibold transition-colors disabled:opacity-50"
                                    >
                                        {isLoadingMore ? "Yükleniyor..." : "Daha Fazla Sonuç Göster"}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-400">
                            Bu arama kriterine uygun ilan bulunamadı.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default JobSearch;