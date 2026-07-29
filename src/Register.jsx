import React, { useState } from 'react';

const Register = ({ setActivePage }) => {
    const [email, setEmail] = useState(''); // username yerine email yapıldı
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch("http://localhost:8080/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // JSON gövdesine e-posta olarak gönderiliyor
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                setSuccess(true);
                // 2 saniye sonra otomatik olarak giriş ekranına yönlendir
                setTimeout(() => {
                    if (setActivePage) setActivePage('login');
                }, 2000);
            } else {
                setError("Kayıt işlemi başarısız oldu. E-posta adresi kullanımda olabilir."); // Mesaj güncellendi
            }
        } catch (err) {
            console.error("Kayıt Hatası:", err);
            setError("Sunucu bağlantısında bir sorun oluştu.");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl w-full mt-10 text-center">
                <div className="text-emerald-400 text-5xl mb-4">✓</div>
                <h2 className="text-2xl font-bold text-slate-100 mb-2">Kayıt Başarılı!</h2>
                <p className="text-slate-400 text-sm">Hesabınız oluşturuldu. Giriş sayfasına yönlendiriliyorsunuz...</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl w-full mt-10">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-100">CVScore'a Kayıt Ol</h2>
                <p className="text-slate-400 mt-2 text-sm">Hemen bir hesap oluşturun ve CV analizi yapmaya başlayın</p>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-6 text-center">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300 block">E-posta Adresi</label>
                    <input
                        type="email" // E-posta doğrulaması eklendi
                        value={email} // email state'i bağlandı
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="E-posta adresinizi girin"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300 block">Şifre</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="••••••••"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 mt-4"
                >
                    {isLoading ? 'Hesap Oluşturuluyor...' : 'Hesap Oluştur'}
                </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-400">
                Zaten hesabınız var mı?{' '}
                <span
                    onClick={() => setActivePage && setActivePage('login')}
                    className="text-blue-400 hover:text-blue-300 cursor-pointer font-semibold"
                >
                    Giriş Yapın
                </span>
            </div>
        </div>
    );
};

export default Register;