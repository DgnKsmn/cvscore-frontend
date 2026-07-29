import React, { useState } from 'react';

const Login = ({ setActivePage }) => {
    const [email, setEmail] = useState(''); // username yerine email yapıldı
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch("https://cvscore-backend-production.up.railway.app/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // JSON gövdesine e-posta olarak gönderiliyor
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                // Backend'den dönen JSON nesnesini alıp içindeki token'ı çıkarıyoruz
                const data = await response.json();

                // Token'ı tarayıcının hafızasına (localStorage) kaydediyoruz
                localStorage.setItem('cvscore_jwt', data.token);

                alert("Giriş başarılı! Yönlendiriliyorsunuz...");
                setActivePage('home'); // Başarılı girişte ana sayfaya at
            } else {
                setError("E-posta veya şifre hatalı!"); // Mesaj güncellendi
            }
        } catch (err) {
            console.error("Giriş Hatası:", err);
            setError("Sunucu bağlantısında bir sorun oluştu.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md mx-auto mt-10">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-100">Tekrar Hoş Geldiniz</h2>
                <p className="text-slate-400 mt-2 text-sm">CV analizi yapmak için hesabınıza giriş yapın</p>
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
                        type="email" // E-posta doğrulaması için eklendi
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
                    {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-400">
                Hesabınız yok mu? <span onClick={() => setActivePage('register')} className="text-blue-400 hover:text-blue-300 cursor-pointer font-semibold">Hemen Kayıt Olun</span>
            </div>
        </div>
    );
};

export default Login;