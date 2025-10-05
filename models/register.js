let otpVerified = false;
const sendOtpBtn = document.getElementById("sendOtpBtn");
let otpTimer;

// ================== OTP FUNCTIONS ==================

// ✅ Send OTP (with cooldown)
sendOtpBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    if (!email) {
        alert("Please enter email first!");
        return;
    }

    try {
        const res = await fetch("/user/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });
        const data = await res.json();

        if (res.ok) {
            alert(data.message || "OTP sent!");
            document.getElementById("otpSection").style.display = "block";
            startOtpCooldown(300); // 5 minutes
        } else {
            alert(data.error || "Failed to send OTP");
        }
    } catch (err) {
        console.error(err);
        alert("Error sending OTP");
    }
});

// 🔄 Start OTP cooldown
function startOtpCooldown(seconds) {
    clearInterval(otpTimer);
    let remaining = seconds;

    sendOtpBtn.disabled = true;
    sendOtpBtn.innerText = `Resend OTP in ${remaining}s`;

    otpTimer = setInterval(() => {
        remaining--;
        if (remaining > 0) {
            sendOtpBtn.innerText = `Resend OTP in ${remaining}s`;
        } else {
            clearInterval(otpTimer);
            sendOtpBtn.disabled = false;
            sendOtpBtn.innerText = "Send OTP Again";
        }
    }, 1000);
}

// ✅ Verify OTP
document.getElementById("verifyOtpBtn").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const otp = document.getElementById("otp").value;

    if (!otp) {
        alert("Enter OTP first!");
        return;
    }

    try {
        const res = await fetch("/user/verify-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp })
        });
        const data = await res.json();
        if (res.ok) {
            otpVerified = true;
            document.getElementById("otpStatus").innerText = "✅ OTP Verified!";
            document.getElementById("registerBtn").disabled = false;
        } else {
            otpVerified = false;
            document.getElementById("otpStatus").innerText = (data.error || "Invalid OTP");
        }
    } catch (err) {
        console.error(err);
        alert("Error verifying OTP");
    }
});

// ================== REGISTRATION SUBMIT ==================

document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault(); // stop normal form submit

    // 1️⃣ Check OTP verified
    if (!otpVerified) {
        document.getElementById("registerMessage").style.color = "red";
        document.getElementById("registerMessage").innerText = "Please verify your OTP before registering.";
        return;
    }

    // 4️⃣ Send registration request
    const formData = new FormData(e.target);
    const body = Object.fromEntries(formData.entries());

    try {
        const res = await fetch("/user/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const text = await res.text();

        if (res.ok) {
            document.getElementById("registerMessage").style.color = "green";
            document.getElementById("registerMessage").innerText ="Registered successfully your credentials has been sent to your email id... Redirecting to login...";

            setTimeout(() => {
                window.location.href = "/login";
            }, 2000);
        } else {
            document.getElementById("registerMessage").style.color = "red";
            document.getElementById("registerMessage").innerText = text;
        }
    } catch (err) {
        console.error("Registration error:", err);
        document.getElementById("registerMessage").style.color = "red";
        document.getElementById("registerMessage").innerText = "Something went wrong!";
    }
});
