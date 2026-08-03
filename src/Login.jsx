import React, { useState } from 'react';
import toast from 'react-hot-toast';

const Login = ({ setActivePage }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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

                toast.success("Giriş başarılı!");
                setActivePage('home');
            } else {
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
        <div className="bg-[#160604]/90 backdrop-blur-md border border-red-900/30 p-8 rounded-2xl shadow-xl w-full max-w-md mx-auto mt-10">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-100">Tekrar Hoş Geldiniz</h2>
                <p className="text-stone-400 mt-2 text-sm">CV analizi yapmak için hesabınıza giriş yapın</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-stone-300 block">E-posta Adresi</label>
                    <div className="relative flex items-center">
                        <svg className="w-5 h-5 absolute left-3.5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-[#0a0302] border border-orange-900/40 rounded-xl pl-11 pr-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-orange-500 transition-colors shadow-inner"
                            placeholder="E-posta adresinizi girin"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-stone-300 block">Şifre</label>
                    <div className="relative flex items-center">
                        <svg className="w-5 h-5 absolute left-3.5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-[#0a0302] border border-orange-900/40 rounded-xl pl-11 pr-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-orange-500 transition-colors shadow-inner"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-red-700 via-orange-600 to-orange-500 hover:from-red-600 hover:via-orange-500 hover:to-orange-400 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 mt-4"
                >
                    {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                </button>
            </form>

            <div className="mt-6 text-center text-sm text-stone-400">
                Hesabınız yok mu? <span onClick={() => setActivePage('register')} className="text-orange-500 hover:text-orange-400 cursor-pointer font-semibold transition-colors">Hemen Kayıt Olun</span>
            </div>
        </div>
    );
};

export default Login;