window.addEventListener('unload', () => {
  navigator.sendBeacon('/logout');
});
document.addEventListener("DOMContentLoaded", function () {
  // Create a timeline for coordinated animations
  const tl = gsap.timeline({ paused: true });

  // Set initial states to prevent flash of unstyled content
  gsap.set(".navbar", { y: -100, opacity: 0 });
  gsap.set(".nav-brand", { opacity: 0, scale: 0.8 });
  gsap.set(".nav-links a", { opacity: 0, y: -20 });

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
});

function navHamburger() {
  var x = document.getElementsByClassName("nav-links-ham")[0];
  var y = document.getElementsByClassName("nav-ham-i")[0];
  var tl = gsap.timeline();
  if (x.style.opacity === 1 || x.style.opacity === "1") {
    x.style.pointerEvents = "none";
    x.style.opacity = "0";
    gsap.fromTo(y, { rotate: 90 }, { rotate: 0, duration: 0.5, ease: "power2.out" });
    gsap.to(".nav-links-ham a", { opacity: 0, y: -20, duration: 0.5, stagger: 0.1, ease: "power2.out" });
  } else {
    x.style.opacity = "1";
    x.style.pointerEvents = "auto";
    gsap.fromTo(y, { rotate: 0 }, { rotate: 90, duration: 0.5, ease: "power2.out" });
    tl.fromTo(".nav-links-ham", { x: 20 }, { x: 0, duration: 1, ease: "power2.out" });
    tl.to(".nav-links-ham a", { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" });
  }
}