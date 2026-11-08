// 0. STOP BROWSER FROM REMEMBERING SCROLL POSITION
if (history.scrollRestoration) {
    history.scrollRestoration = 'manual';
}

// 1. COMPONENT INJECTOR (Nav/Footer)
async function loadComponents() {
    const components = [
        { id: 'nav-placeholder', file: 'nav.html' },
        { id: 'footer-placeholder', file: 'footer.html' }
    ];

    for (const comp of components) {
        const el = document.getElementById(comp.id);
        if (el) {
            try {
                const response = await fetch(comp.file);
                const text = await response.text();
                el.innerHTML = text;
            } catch (err) { console.error(`Failed to load ${comp.file}`); }
        }
    }
    initNavLogic(); 
    updateFooterTime();
    setInterval(updateFooterTime, 1000);
}

// 2. SMOOTH SCROLL (LENIS)
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
});
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);

// 3. PRELOADER & SCROLL RESET (Restored from your good version)
window.addEventListener('load', () => {
    // Force scroll to top IMMEDIATELY
    window.scrollTo(0, 0);
    lenis.scrollTo(0, { immediate: true });

    const tl = gsap.timeline();

    tl.to(".p-word", {
        display: "block",
        duration: 0.2, 
        stagger: { each: 0.4, repeat: 1, yoyo: true }
    });

    tl.to(".preloader", {
        yPercent: -100,
        duration: 0.8,
        ease: "power4.inOut",
        onComplete: () => {
            const preloader = document.querySelector('.preloader');
            if (preloader) preloader.style.display = 'none';
            // Sync all ScrollTriggers after page layout is locked
            ScrollTrigger.refresh();
        }
    });

    // Fade in whatever first section exists (Hero on Home, or Project Header on others)
    const firstSection = document.querySelector('section');
    if (firstSection) {
        tl.from(firstSection, { y: 100, opacity: 0, duration: 0.6 }, "-=0.4");
    }
});

// 4. HUGE NAME MARQUEE (Index Page Only)
const nameMove = document.querySelector(".huge-name-move");
if (nameMove) {
    const nameLoop = gsap.to(".huge-name-move", {
        xPercent: -50,
        repeat: -1,
        duration: 20,
        ease: "none"
    });

    gsap.to(nameLoop, {
        timeScale: 4, 
        scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: 1
        }
    });
}

// 5. UNIVERSAL NAVIGATION LOGIC (The "All Pages" Scroll Fix)
function initNavLogic() {
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mainNav = document.querySelector('nav');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            const isOpen = menuToggle.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            if (isOpen) {
                gsap.to(".menu-item a", { y: 0, stagger: 0.1, duration: 1, ease: "power4.out", delay: 0.2 });
                lenis.stop();
            } else {
                gsap.to(".menu-item a", { y: "100%", duration: 0.5, ease: "power4.in" });
                lenis.start();
            }
        });

        // Scroll Transformation: Works by distance (Universal)
        if (window.innerWidth > 1024) {
            gsap.set(menuToggle, { scale: 0 }); // Ensure it starts hidden

            ScrollTrigger.create({
                trigger: "body",
                start: "200px top", // Pops out after 200px scroll on ANY page
                onEnter: () => {
                    gsap.to(menuToggle, { scale: 1, duration: 0.4, ease: "back.out(1.7)" });
                    if (mainNav) gsap.to(mainNav, { opacity: 0, pointerEvents: "none", duration: 0.3 });
                },
                onLeaveBack: () => {
                    gsap.to(menuToggle, { scale: 0, duration: 0.4, ease: "power2.in" });
                    if (mainNav) gsap.to(mainNav, { opacity: 1, pointerEvents: "auto", duration: 0.3 });
                }
            });
        } else {
            gsap.set(menuToggle, { scale: 1, opacity: 1 });
        }
    }
}

// 6. WORK HOVER PREVIEW
const workItems = document.querySelectorAll('.work-item');
const reveal = document.querySelector('.hover-reveal');
const revealImg = reveal ? reveal.querySelector('img') : null;

if (workItems.length > 0 && reveal) {
    workItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            const imgPath = item.getAttribute('data-img');
            if (revealImg && imgPath) revealImg.src = imgPath;
            gsap.to(reveal, { opacity: 1, scale: 1, duration: 0.4 });
        });
        item.addEventListener('mouseleave', () => {
            gsap.to(reveal, { opacity: 0, scale: 0.8, duration: 0.4 });
        });
        item.addEventListener('mousemove', (e) => {
            gsap.to(reveal, { x: e.clientX + 20, y: e.clientY - 150, duration: 0.8, ease: "power3.out" });
        });
    });
}

// 7. CAROUSEL ANIMATIONS
const setupRowAnimation = (selector, moveX, startX = "0%") => {
    const container = document.querySelector(selector);
    if (!container) return;
    const track = container.querySelector(".carousel-track");
    if (!track) return;
    track.innerHTML += track.innerHTML; 
    gsap.set(track, { x: startX });
    const tl = gsap.to(track, { x: moveX, duration: 40, ease: "none", repeat: -1 });
    container.addEventListener("mouseenter", () => gsap.to(tl, { timeScale: 0, duration: 0.5 }));
    container.addEventListener("mouseleave", () => gsap.to(tl, { timeScale: 1, duration: 0.5 }));
};
setupRowAnimation(".row-ltr", "-50%", "0%");
setupRowAnimation(".row-rtl", "0%", "-50%");

// 8. PENCIL EFFECT
const canvas = document.getElementById('pencilCanvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let points = [];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    resize();
    const handleMove = (e) => {
        const x = e.touches ? e.touches[0].clientX : e.clientX;
        const y = e.touches ? e.touches[0].clientY : e.clientY;
        points.push({ x, y, age: 0 });
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove, { passive: true });
    function animatePencil() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (points.length > 1) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) { 
                ctx.lineTo(points[i].x, points[i].y); 
                points[i].age++; 
            }
            ctx.stroke();
        }
        points = points.filter(p => p.age < 25);
        requestAnimationFrame(animatePencil);
    }
    animatePencil();
}

// 9. LOCAL TIME
function updateFooterTime() {
    const timeElement = document.getElementById('local-time');
    if (timeElement) {
        const now = new Date();
        const options = { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata', timeZoneName: 'short' };
        timeElement.textContent = now.toLocaleTimeString('en-IN', options);
    }
}

loadComponents();