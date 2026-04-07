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
            if (iter % maxShuffles === 0) revealedCount += 3;
            
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

    // (Logo Decrypt logic remains, but specific interaction moved to Navigation section)

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

    // --- Staggered Menu Logic ---
    const menuWrapper = document.querySelector('.staggered-menu-wrapper');
    const menuToggle = document.getElementById('menu-toggle');
    const menuPanel = document.getElementById('staggered-menu-panel');
    const preLayers = document.querySelectorAll('.sm-prelayer');
    const menuItems = document.querySelectorAll('.sm-panel-itemLabel');
    const qrContainer = document.querySelector('.sm-qr-container');
    const textInner = document.querySelector('.sm-toggle-textInner');
    const icon = document.querySelector('.sm-icon');
    
    let isMenuOpen = false;
    let isBusy = false;

    const toggleMenu = () => {
        if (isBusy) return;
        isBusy = true;
        isMenuOpen = !isMenuOpen;
        
        menuToggle.setAttribute('aria-expanded', isMenuOpen);
        menuPanel.setAttribute('aria-hidden', !isMenuOpen);
        
        if (isMenuOpen) {
            menuWrapper.classList.add('fixed-wrapper');
            openMenu();
        } else {
            closeMenu();
        }
    };

    const openMenu = () => {
        const tl = gsap.timeline({
            onComplete: () => { isBusy = false; }
        });

        // 1. Animate Pre-layers
        tl.to(preLayers, {
            xPercent: -100,
            duration: 0.5,
            ease: "power4.out",
            stagger: 0.1
        }, 0);

        // 2. Animate Main Panel
        tl.to(menuPanel, {
            xPercent: -100,
            duration: 0.6,
            ease: "power4.out"
        }, 0.15);

        // 3. Animate Menu Items (Staggered)
        tl.to(menuItems, {
            yPercent: -140, 
            rotate: 0,
            duration: 0.8,
            ease: "power4.out",
            stagger: 0.1
        }, 0.3);

        // 4. Animate QR Container
        if (qrContainer) {
            tl.to(qrContainer, {
                y: 0,
                opacity: 1,
                duration: 0.6,
                ease: "power2.out"
            }, 0.5);
        }

        // 5. Animate Toggle Text and Icon
        gsap.to(textInner, { yPercent: -50, duration: 0.4, ease: "power4.out" });
        gsap.to(icon, { rotate: 225, duration: 0.4, ease: "power4.out" });
    };

    const closeMenu = () => {
        const tl = gsap.timeline({
            onComplete: () => {
                menuWrapper.classList.remove('fixed-wrapper');
                isBusy = false;
                // Reset positions for next open
                gsap.set(menuItems, { yPercent: 0, rotate: 10 });
                if (qrContainer) gsap.set(qrContainer, { y: 20, opacity: 0 });
            }
        });

        tl.to([menuPanel, ...preLayers], {
            xPercent: 0,
            duration: 0.4,
            ease: "power2.in",
            stagger: {
                each: 0.05,
                from: "end"
            }
        });

        gsap.to(textInner, { yPercent: 0, duration: 0.4, ease: "power4.out" });
        gsap.to(icon, { rotate: 0, duration: 0.4, ease: "power4.out" });
    };

    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMenu);
    }

    // Close menu when links are clicked
    document.querySelectorAll('.sm-panel-item').forEach(link => {
        link.addEventListener('click', () => {
            if (isMenuOpen) toggleMenu();
        });
    });

    // Handle clicks outside the panel
    window.addEventListener('mousedown', (e) => {
        if (isMenuOpen && !menuPanel.contains(e.target) && !menuToggle.contains(e.target)) {
            toggleMenu();
        }
    });

    // Fix for the register button in the menu (it's an <a> now but it might be picked up by general register logic)
    // Actually, I'll update the register button selector in the modal logic.
    // Trigger on logo hover
    const mainLogo = document.querySelector('.sm-logo');
    if (mainLogo) {
        mainLogo.addEventListener('mouseenter', () => {
            decryptElements.forEach(el => animateDecrypt(el, 3, 60));
            gsap.fromTo(mainLogo, { rotate: 0 }, { rotate: 360, duration: 0.5, ease: 'power2.easeOut', overwrite: 'auto' });
        });
    }

    // --- Modal Logic ---
    const modal = document.getElementById('register-modal');
    const registerButtons = document.querySelectorAll('#register-btn, #register-btn-mobile');
    const closeBtn = document.querySelector('.close-btn');

    // Open modal
    registerButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.classList.add('show');
            if (isMenuOpen) toggleMenu(); // Close menu if opening register from mobile
        });
    });

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

    // Close image modal when clicking outside
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
                themeToggleBtn.textContent = '🌙';
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                themeToggleBtn.textContent = '☀';
            }
        });
    }

    // --- Scroll Velocity Parallax Effect ---
    const wrap = (min, max, v) => {
        const range = max - min;
        const mod = (((v - min) % range) + range) % range;
        return mod + min;
    };

    document.querySelectorAll('.parallax').forEach((parallax, index) => {
        const scroller = parallax.querySelector('.scroller');
        if (!scroller) return;
        
        const baseText = scroller.getAttribute('data-text') || scroller.textContent.trim();
        scroller.innerHTML = "";
        const numCopies = window.innerWidth > 768 ? 10 : 6;
        
        for(let i = 0; i < numCopies; i++) {
            const span = document.createElement('span');
            span.textContent = baseText + " \u00A0"; // trailing space
            scroller.appendChild(span);
        }
        
        let baseX = 0;
        let lastScrollY = window.scrollY;
        let velocity = 0;
        const baseVelocity = index % 2 === 0 ? 100 : -100;
        let directionFactor = 1;
        let lastTime = performance.now();
        
        const updatePhysics = (time) => {
            const delta = time - lastTime;
            lastTime = time;
            
            const currentScrollY = window.scrollY;
            const diff = currentScrollY - lastScrollY;
            lastScrollY = currentScrollY;
            
            velocity = velocity * 0.9 + diff * 0.1; 
            let moveBy = directionFactor * baseVelocity * (delta / 1000);
            
            if (velocity < -0.5) directionFactor = -1;
            else if (velocity > 0.5) directionFactor = 1;
            
            let velocityFactor = Math.min(Math.abs(velocity) * 0.3, 5); 
            moveBy += directionFactor * moveBy * velocityFactor;
            
            baseX += moveBy;
            
            const firstChild = scroller.firstElementChild;
            if(firstChild && firstChild.offsetWidth > 0) {
                const wrappedX = wrap(-firstChild.offsetWidth, 0, baseX);
                scroller.style.transform = `translate3d(${wrappedX}px, 0, 0)`;
            }
            
            requestAnimationFrame(updatePhysics);
        };
        requestAnimationFrame(updatePhysics);
    });

});
