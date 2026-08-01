import React, { useState } from 'react';
import toast from 'react-hot-toast'; // Tost kütüphanesi içeri aktarıldı

const Login = ({ setActivePage }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    // error state'i tamamen kaldırıldı, artık tüm hataları toast ile göstereceğiz.

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch("https://cvscore-backend-production.up.railway.app/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('cvscore_jwt', data.token);

                // Eski çirkin alert() yerine modern bildirim eklendi
                toast.success("Giriş başarılı! ");
                setActivePage('home');
            } else {
                // Sayfa içi div yerine sağ üstten gelen şık hata mesajı
                toast.error("E-posta veya şifre hatalı!");
            }
        } catch (err) {
            console.error("Giriş Hatası:", err);
            toast.error("Sunucu bağlantısında bir sorun oluştu.");
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

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300 block">E-posta Adresi</label>
                    <input
                        type="email"
                        value={email}
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