/**
 * True Concept - Client-side JavaScript
 */

(function() {
    'use strict';

    // ========================================
    // Navigation
    // ========================================
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');

    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    const navLinks = document.getElementById('navLinks');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }

    // ========================================
    // Scroll Reveal Animation
    // ========================================
    const revealElements = document.querySelectorAll('.reveal');

    function revealOnScroll() {
        revealElements.forEach(el => {
            const elementTop = el.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;

            if (elementTop < windowHeight - 100) {
                el.classList.add('visible');
            }
        });
    }

    window.addEventListener('scroll', revealOnScroll);
    window.addEventListener('load', revealOnScroll);

    // ========================================
    // Utility Functions
    // ========================================
    window.getStoredToken = function() {
        return localStorage.getItem('token');
    };

    window.setStoredToken = function(token) {
        localStorage.setItem('token', token);
    };

    window.clearStoredToken = function() {
        localStorage.removeItem('token');
    };


    // ========================================
    // Sign Out & Language Toggle
    // ========================================
    const signOutBtnMobile = document.getElementById('signOutBtnMobile');
    if (signOutBtnMobile) {
        signOutBtnMobile.addEventListener('click', (e) => {
            e.preventDefault();
            window.clearStoredToken();
            window.location.reload();
        });
    }

    const langToggleBtn = document.getElementById('langToggle');
    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const currentLang = localStorage.getItem('language') || 'en';
            const newLang = currentLang === 'en' ? 'ar' : 'en';
            localStorage.setItem('language', newLang);
            window.location.reload();
        });
    }

    // Apply language on load
    const savedLang = localStorage.getItem('language') || 'en';
    document.documentElement.lang = savedLang;
    document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';

})();