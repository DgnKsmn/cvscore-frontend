import React, { useState } from 'react';
import './MobileMenu.css';

const MobileMenu = ({ isLoggedIn, handleLogout, setActivePage, handleReset }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    // Bu fonksiyon hem sayfayı değiştirir, hem formları sıfırlar, hem de menüyü kapatır
    const handleNavigation = (pageName) => {
        setActivePage(pageName);
        if (handleReset) handleReset();
        setIsOpen(false); // Tıkladıktan sonra menüyü kapat
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
                                <button onClick={() => { handleLogout(); setIsOpen(false); }}>Çıkış Yap</button>
                            ) : (
                                <button onClick={() => handleNavigation('login')}>Giriş yap / Kayıt ol</button>
                            )}
                        </li>

                        {/* Menü Seçenekleri - Artık state üzerinden sayfayı değiştiriyor */}
                        <li><button onClick={() => handleNavigation('home')}>Ana Sayfa</button></li>
                        <li><button onClick={() => handleNavigation('job-match')}>İş Uyumunu Hesapla</button></li>
                        <li><button onClick={() => handleNavigation('ats-check')}>ATS Skorunu Öğren</button></li>
                        <li><button onClick={() => handleNavigation('ai-jobs')}>Gelişmiş İş Bulma Motorunu Kullan</button></li>
                    </ul>
                </div>
            </div>
        </>
    );
};

export default MobileMenu;