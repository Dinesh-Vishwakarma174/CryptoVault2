document.addEventListener('DOMContentLoaded', () => {
    // Check if the credentials data exists
    if (typeof credentials === 'undefined') {
        console.error('Credentials data not found. Make sure data.js is loaded.');
        return;
    }

    const scoreCircle = document.getElementById('scoreCircle');
    const scoreText = document.getElementById('scoreText');
    const scoreSummary = document.getElementById('scoreSummary');
    const compromisedCard = document.getElementById('compromisedCard');
    const reusedCard = document.getElementById('reusedCard');
    const weakCard = document.getElementById('weakCard');
    const vulnerableListContainer = document.querySelector('.vulnerable-list .list-container');

    const analyzeVault = () => {
        const totalPasswords = credentials.length;
        if (totalPasswords === 0) return { score: 100, compromised: [], reused: {}, weak: [] };

        // 1. Find Compromised Passwords
        const compromised = credentials.filter(c => c.compromised);

        // 2. Find Reused Passwords
        const passwordCounts = {};
        credentials.forEach(c => {
            passwordCounts[c.password] = (passwordCounts[c.password] || 0) + 1;
        });
        const reusedPasswords = Object.keys(passwordCounts).filter(p => passwordCounts[p] > 1);
        const reused = credentials.filter(c => reusedPasswords.includes(c.password));

        // 3. Find Weak Passwords
        const weak = credentials.filter(c => isWeak(c.password));

        // 4. Calculate Score
        let score = 100;
        score -= compromised.length * 15; // High penalty
        score -= reused.length * 5;      // Medium penalty
        score -= weak.length * 5;        // Medium penalty
        score = Math.max(0, Math.floor(score)); // Ensure score is not negative

        return { score, compromised, reused, weak };
    };

    const isWeak = (password) => {
        // Simple weakness check: less than 8 chars or just letters/numbers
        return password.length < 8 || /^[a-zA-Z]+$/.test(password) || /^[0-9]+$/.test(password);
    };

    const renderDashboard = (analysis) => {
        // Update score circle
        setTimeout(() => {
            scoreCircle.style.setProperty('--score', analysis.score);
        }, 100);
        scoreText.textContent = `${analysis.score}%`;
        
        // Update summary text
        if(analysis.score > 90) scoreSummary.textContent = "Excellent! Your vault is very secure.";
        else if(analysis.score > 70) scoreSummary.textContent = "Good, but there's room for improvement.";
        else scoreSummary.textContent = "Your vault needs attention. Please review the items below.";

        // Update summary cards
        compromisedCard.querySelector('.count').textContent = analysis.compromised.length;
        reusedCard.querySelector('.count').textContent = analysis.reused.length;
        weakCard.querySelector('.count').textContent = analysis.weak.length;

        // Render vulnerable items list
        vulnerableListContainer.innerHTML = '';
        let hasVulnerabilities = false;

        const renderItem = (cred, type, reason) => {
            hasVulnerabilities = true;
            const item = document.createElement('div');
            item.className = 'vulnerable-item';
            const icon = type === 'Compromised' ? '🔥' : type === 'Reused' ? '🔁' : '🩹';
            item.innerHTML = `
                <div class="vulnerable-icon">${icon}</div>
                <div class="vulnerable-details">
                    <h4>${cred.title}</h4>
                    <p><strong>Reason:</strong> ${type} - ${reason}</p>
                </div>
                <div class="vulnerable-action">
                    <a href="vault.html" class="button secondary">Go to Vault</a>
                </div>
            `;
            vulnerableListContainer.appendChild(item);
        };
        
        analysis.compromised.forEach(c => renderItem(c, 'Compromised', 'Found in a data breach. Change it immediately.'));
        analysis.reused.forEach(c => renderItem(c, 'Reused', 'This password is used on multiple sites.'));
        analysis.weak.forEach(c => renderItem(c, 'Weak', 'Password is too simple or short.'));

        if (!hasVulnerabilities) {
            vulnerableListContainer.innerHTML = '<p class="all-good-message">Your vault is looking secure. Great job!</p>';
        }
    };

    // Run analysis and render the page
    const analysisResults = analyzeVault();
    renderDashboard(analysisResults);
});
