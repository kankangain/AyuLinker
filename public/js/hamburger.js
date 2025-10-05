document.addEventListener("DOMContentLoaded", () => {
    const navToggle = document.querySelector(".nav-toggle");
    const navLinks = document.querySelector(".nav-links");

    if (!navToggle || !navLinks) return;

    navToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        navLinks.classList.toggle("active");
        document.body.style.overflow = navLinks.classList.contains("active")
            ? "hidden"
            : "";
    });

    document.addEventListener("click", (e) => {
        if (
            navLinks.classList.contains("active") &&
            !navLinks.contains(e.target) &&
            !navToggle.contains(e.target)
        ) {
            navLinks.classList.remove("active");
            document.body.style.overflow = "";
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && navLinks.classList.contains("active")) {
            navLinks.classList.remove("active");
            document.body.style.overflow = "";
        }
    });

    navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("active");
            document.body.style.overflow = "";
        });
    });
});