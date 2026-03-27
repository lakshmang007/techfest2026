// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {

    // --- Smooth Scrolling for Navigation Links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // Account for fixed header
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
  
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // --- Decrypted Text Logo Effect ---
    const decryptElements = document.querySelectorAll('.decrypt-text');
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+';
    
    const animateDecrypt = (el, maxShuffles = 2, speed = 50) => {
        if (el.isAnimatingDecrypt) return;
        el.isAnimatingDecrypt = true;
        
        const originalText = el.getAttribute('data-text');
        let revealedCount = 0;
        let iter = 0;
        
        const shuffleText = (len) => {
            let res = '';
            for (let i = 0; i < originalText.length; i++) {
                if (i < len) res += originalText[i];
                else res += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            return res;
        };

        const interval = setInterval(() => {
            iter++;
            if (iter % maxShuffles === 0) revealedCount++;
            
            if (revealedCount > originalText.length) {
                clearInterval(interval);
                el.textContent = originalText;
                el.isAnimatingDecrypt = false;
            } else {
                el.textContent = shuffleText(revealedCount);
            }
        }, speed);
    };

    // Trigger immediately on load
    decryptElements.forEach(el => animateDecrypt(el, 5, 80));

    // Trigger on logo hover
    const mainLogo = document.querySelector('.pill-logo');
    if (mainLogo) {
        mainLogo.addEventListener('mouseenter', () => {
            decryptElements.forEach(el => animateDecrypt(el, 3, 60));
        });
    }

    // --- Intersection Observer for Scroll Animations ---
    // Elements with .fade-in or .slide-up will animate when they enter the viewport
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 // Trigger when 15% of element is visible
    };

    const animateOnScroll = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add visible class to trigger CSS transition
                entry.target.classList.add('visible');
                // Optional: Stop observing once animated if you only want it to happen once
                // observer.unobserve(entry.target); 
            }
        });
    }, observerOptions);

    // Get all elements we want to animate
    const elementsToAnimate = document.querySelectorAll('.fade-in, .slide-up');
    
    // Start observing them
    elementsToAnimate.forEach(el => {
        animateOnScroll.observe(el);
    });

    // --- Pill Nav GSAP Logic ---
    document.querySelectorAll('.pill').forEach(pill => {
        const circle = pill.querySelector('.hover-circle');
        const label = pill.querySelector('.pill-label');
        const hoverLabel = pill.querySelector('.pill-label-hover');
        
        // Layout calculation handler
        const layout = () => {
            const rect = pill.getBoundingClientRect();
            const w = rect.width;
            const h = rect.height;
            
            // Calculate circle size to cover the pill
            const R = ((w * w) / 4 + h * h) / (2 * h);
            const D = Math.ceil(2 * R) + 2;
            const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
            const originY = D - delta;

            circle.style.width = `${D}px`;
            circle.style.height = `${D}px`;
            circle.style.bottom = `-${delta}px`;

            gsap.set(circle, {
                xPercent: -50,
                scale: 0,
                transformOrigin: `50% ${originY}px`
            });

            gsap.set(label, { y: 0 });
            gsap.set(hoverLabel, { y: h + 12, opacity: 0 });
            
            // Re-create timeline based on new dimensions
            if (pill._tl) pill._tl.kill();
            
            const tl = gsap.timeline({ paused: true });
            tl.to(circle, { scale: 1.2, xPercent: -50, duration: 0.4, ease: 'power2.easeOut', overwrite: 'auto' }, 0);
            tl.to(label, { y: -(h + 8), duration: 0.4, ease: 'power2.easeOut', overwrite: 'auto' }, 0);
            
            gsap.set(hoverLabel, { y: Math.ceil(h + 100), opacity: 0 });
            tl.to(hoverLabel, { y: 0, opacity: 1, duration: 0.4, ease: 'power2.easeOut', overwrite: 'auto' }, 0);
            
            pill._tl = tl;
        };

        // Initialize layout on load
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(layout);
        } else {
            layout();
        }

        window.addEventListener('resize', layout);

        pill.addEventListener('mouseenter', () => pill._tl && pill._tl.play());
        pill.addEventListener('mouseleave', () => pill._tl && pill._tl.reverse());
    });

    // Logo spin interaction
    const pillLogo = document.querySelector('.pill-logo');
    if (pillLogo) {
        pillLogo.addEventListener('mouseenter', () => {
            gsap.fromTo(pillLogo, { rotate: 0 }, { rotate: 360, duration: 0.5, ease: 'power2.easeOut', overwrite: 'auto' });
        });
    }

    // --- Modal Logic ---
    const modal = document.getElementById('register-modal');
    const registerBtn = document.getElementById('register-btn');
    const closeBtn = document.querySelector('.close-btn');

    // Open modal
    if (registerBtn && modal) {
        registerBtn.addEventListener('click', () => {
            modal.classList.add('show');
        });
    }

    // Close modal
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });

    // --- Image Lightbox Modal Logic ---
    const imageModal = document.getElementById('image-modal');
    const fullImage = document.getElementById('full-image');
    const closeImageBtn = document.querySelector('.close-image-btn');
    const eventImages = document.querySelectorAll('.event-img');

    eventImages.forEach(img => {
        img.addEventListener('click', function() {
            // Check if the image has a defined source and is not empty
            const src = this.getAttribute('src');
            if (src && src.trim() !== '') {
                if (imageModal && fullImage) {
                    imageModal.classList.add('show');
                    fullImage.src = src;
                }
            }
        });
    });

    // Close image modal
    if(closeImageBtn && imageModal) {
        closeImageBtn.addEventListener('click', () => {
            imageModal.classList.remove('show');
        });
    }

    // Close image modal when clicking outside the image
    window.addEventListener('click', (e) => {
        if (e.target === imageModal) {
            imageModal.classList.remove('show');
        }
    });

    // --- Theme Toggle Logic ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            if (currentTheme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'light');
                themeToggleBtn.innerHTML = '🌙';
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                themeToggleBtn.innerHTML = '☀';
            }
        });
    }

});
