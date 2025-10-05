
// Create a timeline for coordinated animations
const tl = gsap.timeline({ paused: true });

// Set initial states to prevent flash of unstyled content
gsap.set(".navbar", { y: -100, opacity: 0 });
gsap.set(".nav-brand", { opacity: 0, scale: 0.8 });
gsap.set(".nav-links a", { opacity: 0, y: -20 });

// Cards initial states are now set in CSS to prevent flash

// Build the animation timeline
tl.to(".navbar", {
    y: 0,
    opacity: 1,
    duration: 0.8,
    ease: "power3.out",
})
    .to(
        ".nav-brand",
        {
            opacity: 1,
            scale: 1,
            duration: 0.6,
            ease: "back.out(1.7)",
        },
        "-=0.4"
    )
    .to(
        ".nav-links a",
        {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: "power2.out",
        },
        "-=0.3"
    );

// Check if 3D model exists
const modelViewer = document.querySelector("model-viewer");

function startAnimations() {
    // Small delay to ensure smooth performance
    setTimeout(() => {
        tl.play();
    }, 100);
}

if (modelViewer) {
    // Wait for 3D model to load before starting animations
    let modelLoaded = false;

    const modelLoadHandler = () => {
        if (!modelLoaded) {
            modelLoaded = true;
            console.log("🎉 3D Model loaded, starting animations...");
            startAnimations();
        }
    };

    // Listen for model load event
    modelViewer.addEventListener("load", modelLoadHandler);

    // Fallback: Start animations after 3 seconds even if model doesn't load
    setTimeout(() => {
        if (!modelLoaded) {
            console.log("⏰ Timeout reached, starting animations anyway...");
            startAnimations();
        }
    }, 3000);
} else {
    // No 3D model found, start animations immediately
    startAnimations();
}

// Add smooth hover effects for nav links
document.querySelectorAll(".nav-links a").forEach((link) => {
    // Create underline element
    const underline = document.createElement("div");
    underline.style.cssText = `
            position: absolute;
            bottom: 5px;
            left: 0;
            width: 0%;
            height: 2px;
            background: var(--primary-blue);
            transition: none;
        `;

    // Make link position relative and add underline
    link.style.position = "relative";
    link.appendChild(underline);

    link.addEventListener("mouseenter", () => {
        gsap.to(link, {
            duration: 0.2,
            ease: "power2.out",
        });
        gsap.to(underline, {
            width: "100%",
            duration: 0.3,
            ease: "power2.out",
        });
    });

    link.addEventListener("mouseleave", () => {
        gsap.to(link, {
            scale: 1,
            duration: 0.2,
            ease: "power2.out",
        });
        gsap.to(underline, {
            width: "0%",
            duration: 0.3,
            ease: "power2.out",
        });
    });
});


tl2 = gsap.timeline({ paused: false });

tl2.fromTo(".title-head", { y: -20, opacity: 0 }, { duration: 1, y: 0, opacity: 1, ease: "power3.out" });

// Animate cards from their preset positions
gsap.to(".first-card", {
    duration: 1,
    x: 0,
    opacity: 1,
    ease: "power3.out",
    delay: 0.2,
});
gsap.to(".second-card", {
    duration: 1,
    x: 0,
    opacity: 1,
    ease: "power3.out",
    delay: 0.2,
});


