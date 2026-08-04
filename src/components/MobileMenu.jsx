import React, { useState } from 'react';
import './MobileMenu.css';

const MobileMenu = () => {
    const [isOpen, setIsOpen] = useState(false);

    // Bu state'i projenizdeki gerçek yetkilendirme (auth) mekanizmasına bağlayabilirsiniz.
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <>
            {/* Sağ üstteki Hamburger İkonu */}
            <button className="hamburger-btn" onClick={toggleMenu} aria-label="Menüyü Aç">
                &#9776;
            </button>

            {/* Overlay (Karanlık Arka Plan Katmanı) */}
            <div
                className={`menu-overlay ${isOpen ? 'open' : ''}`}
                onClick={toggleMenu} // Dışarı tıklandığında menüyü kapatır
            ></div>

            {/* Sağdan Kayarak Açılan Drawer Menü */}
            <div className={`drawer-menu ${isOpen ? 'open' : ''}`}>
                <div className="menu-content">
                    {/* Çarpı İkonu (Kapatma) */}
                    <button className="close-btn" onClick={toggleMenu}>&times;</button>

                    <ul className="menu-links">
                        {/* Dinamik Giriş/Çıkış Butonu */}
                        <li className="auth-link">
                            {isLoggedIn ? (
                                <button onClick={() => setIsLoggedIn(false)}>Çıkış</button>
                            ) : (
                                <button onClick={() => setIsLoggedIn(true)}>Giriş yap / Kayıt ol</button>
                            )}
                        </li>

                        {/* Menü Seçenekleri */}
                        <li><a href="/">Ana Sayfa</a></li>
                        <li><a href="/uyum-hesapla">İş Uyumunu Hesapla</a></li>
                        <li><a href="/ats-skoru">ATS Skorunu Öğren</a></li>
                        <li><a href="/is-bulma-motoru">Gelişmiş İş Bulma Motorunu Kullan</a></li>
                    </ul>
                </div>
            </div>
        </>
    );
};

export default MobileMenu;