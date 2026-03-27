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

    // --- Navbar Scroll Effect ---
    // Make navbar background more opaque when scrolling down
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(13, 14, 21, 0.95)';
            navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
        } else {
            navbar.style.background = 'rgba(13, 14, 21, 0.8)';
            navbar.style.boxShadow = 'none';
        }
    });

    // --- Modal Logic ---
    const modal = document.getElementById('register-modal');
    const registerBtn = document.querySelector('.nav-btn');
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

});
