const navLinks = document.getElementById('nav-links');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const closeMenuBtn = document.getElementById('close-menu-btn');

mobileMenuBtn.addEventListener('click', () => {
    navLinks.classList.add('active');
});

closeMenuBtn.addEventListener('click', () => {
    navLinks.classList.remove('active');
});

document.addEventListener('click', (e) => {
    if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        navLinks.classList.remove('active');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const intervalTime = 4000;
    const track = document.getElementById('slidesTrack');
    const slides = Array.from(track.children);
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const indicatorsContainer = document.getElementById('indicators');

    let currentIndex = 0;
    let slideInterval;

    // 1. Create Dots
    slides.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(index));
        indicatorsContainer.appendChild(dot);
    });

    const dots = Array.from(indicatorsContainer.children);

    // 2. Core Navigation Function
    function goToSlide(index) {
        if (index < 0) currentIndex = slides.length - 1;
        else if (index >= slides.length) currentIndex = 0;
        else currentIndex = index;

        track.style.transform = `translateX(-${currentIndex * 100}%)`;

        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });

        startAutoPlay();
    }

    // 3. Timer Logic
    function startAutoPlay() {
        clearInterval(slideInterval);
        slideInterval = setInterval(() => {
            goToSlide(currentIndex + 1);
        }, intervalTime);
    }

    // --- Event Listeners ---

    nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));
    prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') goToSlide(currentIndex - 1);
        if (e.key === 'ArrowRight') goToSlide(currentIndex + 1);
    });

    startAutoPlay();
});

document.addEventListener('DOMContentLoaded', () => {

    const observerOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Stop observing once animated
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Select elements
    const header = document.querySelector('.section-header');
    const cards = document.querySelectorAll('.feature-card');

    // Observe
    if (header) observer.observe(header);
    cards.forEach(card => observer.observe(card));
});