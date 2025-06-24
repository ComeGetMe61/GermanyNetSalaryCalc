// Wait for the entire HTML document to be fully loaded and parsed
document.addEventListener('DOMContentLoaded', function() {
    
    const salaryForm = document.getElementById('salary-form');

    // Make sure the form actually exists before adding a listener
    if (salaryForm) {
        salaryForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Prevent the form from reloading the page

            // --- Get User Inputs ---
            const grossSalaryInput = parseFloat(document.getElementById('gross-salary').value);
            const period = document.getElementById('period').value;
            const taxClass = parseInt(document.getElementById('tax-class').value);
            const hasChurchTax = document.getElementById('church-tax').value === 'yes';
            const state = document.getElementById('state').value;
            const children = parseInt(document.getElementById('children').value);
            const healthInsuranceAdditionalRate = parseFloat(document.getElementById('health-insurance-additional-rate').value) / 100;

            // --- Normalize Gross Salary to Annual ---
            const grossSalary = period === 'month' ? grossSalaryInput * 12 : grossSalaryInput;

            // --- 2025 Constants (Estimates based on 2024, update when official numbers are available) ---
            const PENSION_INSURANCE_RATE = 0.186;
            const UNEMPLOYMENT_INSURANCE_RATE = 0.026;
            const HEALTH_INSURANCE_RATE = 0.146;
            const CARE_INSURANCE_RATE = children > 0 ? 0.034 : 0.04; // Simplified, doesn't account for multiple children discount yet

            const PENSION_UNEMPLOYMENT_CEILING = 90600; // Annual estimate for West Germany
            const HEALTH_CARE_CEILING = 62100; // Annual estimate

            const CHURCH_TAX_RATE = (state === 'BY' || state === 'BW') ? 0.08 : 0.09;

            // --- Social Security Contributions (Employee's Share) ---
            const pensionBase = Math.min(grossSalary, PENSION_UNEMPLOYMENT_CEILING);
            const unemploymentBase = Math.min(grossSalary, PENSION_UNEMPLOYMENT_CEILING);
            const healthCareBase = Math.min(grossSalary, HEALTH_CARE_CEILING);

            const employeePension = (pensionBase * PENSION_INSURANCE_RATE) / 2;
            const employeeUnemployment = (unemploymentBase * UNEMPLOYMENT_INSURANCE_RATE) / 2;
            const employeeHealth = (healthCareBase * (HEALTH_INSURANCE_RATE + healthInsuranceAdditionalRate)) / 2;
            
            let employeeCare = (healthCareBase * CARE_INSURANCE_RATE) / 2;
            // Special rule for Saxony (Sachsen): employees pay a higher share of care insurance.
            if (state === 'SN') {
                const saxonySurcharge = healthCareBase * 0.01;
                employeeCare = ((healthCareBase * 0.034) / 2) + saxonySurcharge;
            }

            const totalSocialSecurity = employeePension + employeeUnemployment + employeeHealth + employeeCare;

            // --- Tax Calculation (Simplified Progressive Model) ---
            // This remains a simplified model. A precise calculation requires the complex official formulas.
            const pauschbetrag = 1230; // Arbeitnehmer-Pauschbetrag
            const sonderausgabenpauschbetrag = 36;
            const taxableIncome = grossSalary - totalSocialSecurity - pauschbetrag - sonderausgabenpauschbetrag;

            let incomeTax = 0;
            const grundfreibetrag = 11784; // Basic tax-free amount (estimate for 2025)

            // Simplified progressive tax calculation
            if (taxableIncome > grundfreibetrag) {
                // This is a highly simplified formula and does not represent the real German tax brackets
                incomeTax = (taxableIncome - grundfreibetrag) * (0.14 + (taxableIncome / 100000));
            }
            incomeTax = Math.max(0, incomeTax); // Ensure tax is not negative

            // Solidarity Surcharge (Soli) is effectively abolished for 96.5% of taxpayers.
            const solidaritySurcharge = 0; 
            
            const churchTax = hasChurchTax ? incomeTax * CHURCH_TAX_RATE : 0;
            
            const totalTaxes = incomeTax + solidaritySurcharge + churchTax;

            // --- Net Salary Calculation ---
            const netSalary = grossSalary - totalSocialSecurity - totalTaxes;

            // --- Display Results ---
            const resultDiv = document.getElementById('result');
            resultDiv.classList.remove('hidden');

            document.getElementById('gross-salary-result').textContent = `${grossSalary.toFixed(2)} €`;
            document.getElementById('income-tax-result').textContent = `- ${incomeTax.toFixed(2)} €`;
            document.getElementById('solidarity-tax-result').textContent = `- ${solidaritySurcharge.toFixed(2)} €`;
            document.getElementById('church-tax-result').textContent = `- ${churchTax.toFixed(2)} €`;
            document.getElementById('pension-insurance-result').textContent = `- ${employeePension.toFixed(2)} €`;
            document.getElementById('unemployment-insurance-result').textContent = `- ${employeeUnemployment.toFixed(2)} €`;
            document.getElementById('health-insurance-result').textContent = `- ${employeeHealth.toFixed(2)} €`;
            document.getElementById('care-insurance-result').textContent = `- ${employeeCare.toFixed(2)} €`;
            document.getElementById('net-salary-result').textContent = `${netSalary.toFixed(2)} €`;
            document.getElementById('net-salary-monthly-result').textContent = `${(netSalary / 12).toFixed(2)} €`;
        });
    } else {
        // This message will appear in the browser's developer console if the form can't be found.
        console.error("Error: The form with ID 'salary-form' was not found.");
    }
});