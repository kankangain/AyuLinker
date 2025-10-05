gsap.set(".container", {y: -80, opacity: 0});
gsap.to(".container", {duration: 1, y: 0, opacity: 1 , ease: "power2.out"})