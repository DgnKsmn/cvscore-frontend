import React from 'react';

export default function Premium({ setActivePage }) {
    return (
        <div className="w-full max-w-4xl mx-auto animate-fade-in-up">
            <div className="text-center space-y-4 mb-12">
                <div className="inline-block bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-1.5 rounded-full text-sm font-semibold mb-2">
                    Ücretsiz Analiz Hakkınız Doldu
                </div>
                <h2 className="text-4xl font-extrabold text-slate-100">
                    Kariyerinize <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Sınır Koymayın</span>
                </h2>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                    CVScore'un tüm yapay zeka gücünü kısıtlamalar olmadan kullanmak ve ATS sistemlerinde her zaman bir adım önde olmak için Premium'a geçin.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                {/* Ücretsiz Plan (Mevcut Durum) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 opacity-75">
                    <h3 className="text-2xl font-bold text-slate-300 mb-2">Standart</h3>
                    <div className="text-3xl font-black text-slate-500 mb-6">Ücretsiz</div>
                    <ul className="space-y-4 text-slate-400 text-sm mb-8">
                        <li className="flex items-center gap-3">
                            <span className="text-rose-500">•</span> Kullanıcı başına sınırlı kullanım
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="text-rose-500">•</span> Sınırlı Temel İş Uyumu Analizi
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="text-emerald-500">•</span> Sınırsız Temel ATS Skoru Analizi
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="text-emerald-500">•</span> Detaylı Gelişim Raporları
                        </li>
                    </ul>
                    <button
                        disabled
                        className="w-full bg-slate-800 text-slate-500 font-semibold py-3 rounded-xl cursor-not-allowed"
                    >
                        Mevcut Planınız
                    </button>
                </div>

                {/* Premium Plan */}
                <div className="bg-slate-900 border-2 border-emerald-500 rounded-2xl p-8 relative shadow-[0_0_40px_rgba(16,185,129,0.15)] transform md:-translate-y-4">
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold px-4 py-1 rounded-full text-sm">
                        En Popüler
                    </div>
                    <h3 className="text-2xl font-bold text-slate-100 mb-2">PRO Sürüm</h3>
                    <div className="text-3xl font-black text-emerald-400 mb-1">
                        ₺99 <span className="text-lg text-slate-500 font-medium">/ay</span>
                    </div>

                    <p className="text-xs text-slate-400 mb-6">ÜCRETSİZ  KULLANIMDAKİLERE  EK  OLARAK</p>


                    <ul className="space-y-4 text-slate-200 text-sm mb-8 font-medium">
                        <li className="flex items-center gap-3">
                            <span className="text-emerald-400 text-lg">🚀</span> Sınırsız CV & İş İlanı Analizi
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="text-emerald-400 text-lg">🎯</span> Tam Kapsamlı ATS Raporu
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="text-emerald-400 text-lg">⚡</span> Öncelikli Sunucu İşlem Gücü
                        </li>
                    </ul>
                    <button
                        onClick={() => alert("Ödeme altyapısı (Iyzico / Stripe) entegre edilecek!")}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/25"
                    >
                        Hemen Yükselt
                    </button>
                </div>
            </div>

            <div className="mt-12 text-center">
                <button
                    onClick={() => setActivePage('home')}
                    className="text-slate-400 hover:text-slate-200 text-sm transition-colors border-b border-transparent hover:border-slate-400 pb-0.5"
                >
                    Şimdilik atla ve ana sayfaya dön
                </button>
            </div>
        </div>
    );
}