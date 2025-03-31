document.addEventListener("DOMContentLoaded", () => {

    let currentBalance = 0;
    let aprRate = 0;
    let monthlyPaymentAmount = 0;
    let totalSubscriptionSavings = 0;
    let newMonthlyPayment = 0;
    let monthsLogged = 0;
    let totalInterestPaid = 0;

    // Placeholder for sync functionality

    document.querySelector('.sync-button').addEventListener('click', () => {
        alert("Syncing data...");
    });
    
    // Chat button function

    document.querySelector('.chat-button').addEventListener('click', () => {
        alert("Chat support is currently unavailable.");
    });
    
    // Get App button function

    const appButton = document.querySelector('.get-app-button');
    if (appButton) {
        appButton.addEventListener('click', () => {
            alert("Redirecting to app download page...");
        });
    }
    
    // Function to calculate the payoff time

    function calculatePayoffTime(balance, monthlyPayment, apr) {
        let monthlyInterestRate = apr / 12 / 100;
        let months = 0;
        let currentBalance = balance;
    
        while (currentBalance > 0) {
            let interest = currentBalance * monthlyInterestRate;
            currentBalance = currentBalance + interest - monthlyPayment;
            months++;
            if (currentBalance < 0) {
                currentBalance = 0; // No negative balance
            }
            if (months > 600) break; // Prevent infinite loop
        }
        return months;
    }
    
    // Document Object Model Elements

    const balanceInput = document.getElementById('balance');
    const monthlyPaymentInput = document.getElementById('monthlyPayment');
    const aprInput = document.getElementById('apr');
    const calculateButton = document.getElementById('calculatePayoff');
    const logPaymentButton = document.getElementById('logPayment');
    const resultDiv = document.getElementById('result');
    const scheduleTable = document.getElementById('scheduleTable');
    const interestSummary = document.getElementById('interestSummary');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    // State

    let totalBalance = 0;
    let totalPaid = 0;

    // Event Listeners

    calculateButton.addEventListener('click', calculatePayoff);
    logPaymentButton.addEventListener('click', logPayment);

    // Calculates payoff time and creates schedule
    // This will break down each months payments and stores it in the schedule array

    function calculatePayoff() {
        const balance = parseFloat(balanceInput.value);
        const monthlyPayment = parseFloat(monthlyPaymentInput.value);
        const apr = parseFloat(aprInput.value) / 100;
        const monthlyRate = apr / 12;

        if (!balance || !monthlyPayment || !apr) {
            alert('Please fill in all fields');
            return;
        }

        if (monthlyPayment <= balance * monthlyRate) {
            alert('Monthly payment is too low to pay off the debt');
            return;
        }

        let remainingBalance = balance;
        let totalMonths = 0;
        let totalInterest = 0;
        let schedule = [];

        while (remainingBalance > 0) {

            const interestPayment = remainingBalance * monthlyRate;
            const principalPayment = monthlyPayment - interestPayment;
            remainingBalance = remainingBalance - principalPayment;
            totalInterest += interestPayment;
            totalMonths++;

            schedule.push({
                month: totalMonths,
                payment: monthlyPayment,
                principal: principalPayment,
                interest: interestPayment,
                remaining: Math.max(0, remainingBalance)
            });

            if (totalMonths > 600) { // 50 years max
                alert('Payoff time exceeds 50 years. Please increase monthly payment.');
                return;
            }
        }

        displayResults(totalMonths, totalInterest, schedule);
        updateProgressBar(balance, 0);
    }

    // Displays the results and creates the schedule table

    function displayResults(months, totalInterest, schedule) {

        // This part of the function is to calculate the remaining years and months that are left

        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        let timeString = years > 0 ? `${years} year${years > 1 ? 's' : ''} ` : '';
        timeString += remainingMonths > 0 ? `${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : '';

        resultDiv.innerHTML = `
            <h3>Payoff Summary</h3>
            <p>Time to pay off: ${timeString}</p>
            <p>Total interest paid: $${totalInterest.toFixed(2)}</p>
        `;

        // Create schedule table

        let tableHTML = `
            <table>
                <tr>
                    <th>Month</th>
                    <th>Payment</th>
                    <th>Principal</th>
                    <th>Interest</th>
                    <th>Remaining Balance</th>
                </tr>
        `;
            // This section just adds each months data into the table

        schedule.forEach(row => {
            tableHTML += `
                <tr>
                    <td>${row.month}</td>
                    <td>$${row.payment.toFixed(2)}</td>
                    <td>$${row.principal.toFixed(2)}</td>
                    <td>$${row.interest.toFixed(2)}</td>
                    <td>$${row.remaining.toFixed(2)}</td>
                </tr>
            `;
        });

        tableHTML += '</table>';
        scheduleTable.innerHTML = tableHTML;
    }

    // Log a payment and update progress
    function logPayment() {
        const monthlyPayment = parseFloat(monthlyPaymentInput.value);
        if (!monthlyPayment) {
            alert('Please enter a monthly payment amount');
            return;
        }

        totalPaid += monthlyPayment;
        updateProgressBar(totalBalance, totalPaid);
    }

    // Update progress bar
    function updateProgressBar(total, paid) {
        totalBalance = total;
        const percentage = Math.min((paid / total) * 100, 100);
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `You have paid off $${paid.toFixed(2)} of $${total.toFixed(2)} (${percentage.toFixed(1)}%)`;
    }

    // Handle subscription checkboxes
    document.querySelectorAll('.subscription').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const amount = parseFloat(this.dataset.amount);
            if (this.checked) {
                totalBalance += amount;
            } else {
                totalBalance -= amount;
            }
            updateProgressBar(totalBalance, totalPaid);
        });
    });

    // Event listener for the calculate button
    
    document.getElementById('calculatePayoff').addEventListener('click', () => {
        currentBalance = parseFloat(document.getElementById('balance').value);
        monthlyPaymentAmount = parseFloat(document.getElementById('monthlyPayment').value);
        aprRate = parseFloat(document.getElementById('apr').value);

        // Collect all subscriptions that are checked

        const subscriptions = Array.from(document.querySelectorAll('.subscription:checked')).map(sub => {
            return parseFloat(sub.getAttribute('data-amount'));
        });

        // Calculate the current payoff time

        const originalPayoffTime = calculatePayoffTime(currentBalance, monthlyPaymentAmount, aprRate);

        // Simulate subscription cancellation: Add the savings to the monthly payment

        const totalSubscriptionSavings = subscriptions.reduce((sum, amount) => sum + amount, 0);
        const newMonthlyPayment = monthlyPaymentAmount + totalSubscriptionSavings;
        const newPayoffTime = calculatePayoffTime(currentBalance, newMonthlyPayment, aprRate);

        // Display results

        const resultDiv = document.getElementById('result');
        resultDiv.innerHTML = `
            <p>Original Payoff Time: ${originalPayoffTime} months</p>
            <p>New Payoff Time (after cancelling subscriptions): ${newPayoffTime} months</p>
        `;
        const paidOff = currentBalance - (newPayoffTime * newMonthlyPayment);
        ProgressTrackerUpdate(currentBalance, Math.max(0, paidOff));
    });

    // This fuction updates the progress bar and updates yhe amount of debt paid and still left to pay

    function ProgressTrackerUpdate(totalDebt, paidOff) {
        const progress = totalDebt > 0 ? (paidOff / totalDebt) * 100 : 0;
        const fill = document.getElementById('progressFill');
        const text = document.getElementById('progressText');

        if (fill && text) {
            fill.style.width = `${progress}%`;
            text.textContent = `You've paid off $${paidOff.toLocaleString()} of $${totalDebt.toLocaleString()} (${progress.toFixed(1)}%)`;
        }
    }

    function generateSchedule(balance, apr, monthlyPayment) {
        const monthlyRate = apr / 12 / 100;
        let currentBalance = balance;
        let month = 1;
        let totalInterest = 0;
        let scheduleHTML = `
            <table>
                <tr>
                    <th>Month</th>
                    <th>Payment</th>
                    <th>Interest</th>
                    <th>Principal</th>
                    <th>Remaining Balance</th>
                </tr>
        `;

        while (currentBalance > 0 && month <= 600) {
            const interest = currentBalance * monthlyRate;
            const principal = monthlyPayment - interest;
            currentBalance = currentBalance + interest - monthlyPayment;
            if (currentBalance < 0) currentBalance = 0;

            scheduleHTML += `
                <tr>
                    <td>${month}</td>
                    <td>$${monthlyPayment.toFixed(2)}</td>
                    <td>$${interest.toFixed(2)}</td>
                    <td>$${principal.toFixed(2)}</td>
                    <td>$${currentBalance.toFixed(2)}</td>
                </tr>
            `;
            totalInterest += interest;
            month++;
        }

        scheduleHTML += `</table>`;

        document.getElementById('scheduleTable').innerHTML = scheduleHTML;
        document.getElementById('interestSummary').innerText =
            `📊 Total interest paid: $${totalInterest.toFixed(2)} over ${month - 1} months.`;
    }
});
