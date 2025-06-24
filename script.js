document.addEventListener('DOMContentLoaded', function() {
    
    document.getElementById('salary-form').addEventListener('submit', function(e) {
        e.preventDefault();

        // --- Get User Inputs ---
        const grossInput = parseFloat(document.getElementById('gross-salary').value);
        const period = document.getElementById('period').value;
        const taxClass = parseInt(document.getElementById('tax-class').value);
        const hasChurchTax = document.getElementById('church-tax').value === 'yes';
        const state = document.getElementById('state').value;
        const children = parseInt(document.getElementById('children').value);
        const healthInsuranceAdditionalRate = parseFloat(document.getElementById('health-insurance-additional-rate').value) / 100;

        const annualGrossSalary = period === 'month' ? grossInput * 12 : grossInput;

        // --- Constants for 2024 (use for 2025 estimation) ---
        const PENSION_RATE = 0.186; // Rentenversicherung
        const UNEMPLOYMENT_RATE = 0.026; // Arbeitslosenversicherung
        const HEALTH_RATE = 0.146; // Krankenversicherung
        
        // Pflegeversicherung: Rate depends on children. Surcharge for childless.
        const CARE_RATE_DEFAULT = 0.034;
        const CARE_SURCHARGE_CHILDLESS = 0.006; // Beitragszuschlag für Kinderlose
        let careRate = (children > 0) ? CARE_RATE_DEFAULT : CARE_RATE_DEFAULT + CARE_SURCHARGE_CHILDLESS;
        
        // Contribution Ceilings (Beitragsbemessungsgrenzen) 2024 West
        const PENSION_UNEMPLOYMENT_CEILING = 90600;
        const HEALTH_CARE_CEILING = 62100;

        const CHURCH_TAX_RATE = (state === 'BY' || state === 'BW') ? 0.08 : 0.09;

        // --- Social Security Calculations ---
        const pensionBase = Math.min(annualGrossSalary, PENSION_UNEMPLOYMENT_CEILING);
        const unemploymentBase = Math.min(annualGrossSalary, PENSION_UNEMPLOYMENT_CEILING);
        const healthCareBase = Math.min(annualGrossSalary, HEALTH_CARE_CEILING);

        const employeePension = (pensionBase * PENSION_RATE) / 2;
        const employeeUnemployment = (unemploymentBase * UNEMPLOYMENT_RATE) / 2;
        const employeeHealth = (healthCareBase * (HEALTH_RATE + healthInsuranceAdditionalRate)) / 2;
        
        let employeeCare = (healthCareBase * careRate) / 2;
        // Saxony (SN) special rule: Employee pays a higher share of care insurance
        if (state === 'SN') {
            employeeCare = (healthCareBase * (careRate + 0.01)) / 2 + (healthCareBase * (careRate - 0.01)) / 2;
        }

        const totalSocialSecurity = employeePension + employeeUnemployment + employeeHealth + employeeCare;

        // --- Income Tax Calculation ---
        const pauschbetrag = 1230; // Arbeitnehmerpauschbetrag
        const sonderausgabenpauschbetrag = 36;
        const taxableIncome = annualGrossSalary - totalSocialSecurity - pauschbetrag - sonderausgabenpauschbetrag;

        const incomeTax = calculateIncomeTax(taxableIncome, taxClass);
        
        // Solidarity Surcharge: Abolished for most. Threshold on tax liability.
        const soliThreshold = (taxClass === 3) ? 36260 : 18130;
        const solidaritySurcharge = (incomeTax > soliThreshold) ? (incomeTax * 0.055) : 0;
        
        const churchTax = hasChurchTax ? (incomeTax * CHURCH_TAX_RATE) : 0;
        
        const totalTaxes = incomeTax + solidaritySurcharge + churchTax;

        // --- Net Salary ---
        const annualNetSalary = annualGrossSalary - totalSocialSecurity - totalTaxes;

        // --- Display Results ---
        displayResults({
            annualGrossSalary, totalTaxes, incomeTax, solidaritySurcharge, churchTax,
            totalSocialSecurity, employeePension, employeeUnemployment, employeeHealth, employeeCare,
            annualNetSalary
        });
    });

    /**
     * Calculates the German income tax (Lohnsteuer) for a given taxable income and tax class.
     * Based on the 2024 tax formula.
     * @param {number} zvE - zu versteuerndes Einkommen (taxable income)
     * @param {number} taxClass - Steuerklasse
     * @returns {number} - Annual income tax
     */
    function calculateIncomeTax(zvE, taxClass) {
        let taxFreeAllowance = 11604; // Grundfreibetrag 2024
        if (taxClass === 3) {
            taxFreeAllowance *= 2;
        } else if (taxClass === 6) {
            taxFreeAllowance = 0;
        }
        
        if (zvE <= taxFreeAllowance) {
            return 0;
        }

        let y, z;
        let tax;

        if (zvE <= 17005) { // Zone 2
            y = (zvE - taxFreeAllowance) / 10000;
            tax = (1008.7 * y + 1400) * y;
        } else if (zvE <= 66760) { // Zone 3
            z = (zvE - 17005) / 10000;
            tax = (187.07 * z + 2397) * z + 1025.38;
        } else if (zvE <= 277825) { // Zone 4
            tax = 0.42 * zvE - 10253.31;
        } else { // Zone 5
            tax = 0.45 * zvE - 18588.24;
        }
        
        return Math.floor(tax); // Tax is always rounded down
    }

    /**
     * Formats a number as German currency string.
     * @param {number} value - The number to format
     * @returns {string} - Formatted currency string
     */
    function formatCurrency(value) {
        return `${value.toFixed(2).replace('.', ',')} €`;
    }

    /**
     * Displays all calculated values in the result table.
     * @param {object} data - An object containing all calculated values.
     */
    function displayResults(data) {
        document.getElementById('result').classList.remove('hidden');

        // Gross
        document.getElementById('gross-salary-yearly').textContent = formatCurrency(data.annualGrossSalary);
        document.getElementById('gross-salary-monthly').textContent = formatCurrency(data.annualGrossSalary / 12);

        // Taxes
        document.getElementById('income-tax-yearly').textContent = formatCurrency(-data.incomeTax);
        document.getElementById('income-tax-monthly').textContent = formatCurrency(-data.incomeTax / 12);
        document.getElementById('solidarity-tax-yearly').textContent = formatCurrency(-data.solidaritySurcharge);
        document.getElementById('solidarity-tax-monthly').textContent = formatCurrency(-data.solidaritySurcharge / 12);
        document.getElementById('church-tax-yearly').textContent = formatCurrency(-data.churchTax);
        document.getElementById('church-tax-monthly').textContent = formatCurrency(-data.churchTax / 12);

        // Social Security
        document.getElementById('pension-insurance-yearly').textContent = formatCurrency(-data.employeePension);
        document.getElementById('pension-insurance-monthly').textContent = formatCurrency(-data.employeePension / 12);
        document.getElementById('unemployment-insurance-yearly').textContent = formatCurrency(-data.employeeUnemployment);
        document.getElementById('unemployment-insurance-monthly').textContent = formatCurrency(-data.employeeUnemployment / 12);
        document.getElementById('health-insurance-yearly').textContent = formatCurrency(-data.employeeHealth);
        document.getElementById('health-insurance-monthly').textContent = formatCurrency(-data.employeeHealth / 12);
        document.getElementById('care-insurance-yearly').textContent = formatCurrency(-data.employeeCare);
        document.getElementById('care-insurance-monthly').textContent = formatCurrency(-data.employeeCare / 12);
        
        // Net
        document.getElementById('net-salary-yearly').textContent = formatCurrency(data.annualNetSalary);
        document.getElementById('net-salary-monthly').textContent = formatCurrency(data.annualNetSalary / 12);
    }
});