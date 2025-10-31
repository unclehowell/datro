import { YearlyFinancials } from './types';

const csvData = `Code,Description,2024,2025,2026,2027,2028,2029
############# Lenders / Income (Interest payments) #############
3200,Capital Fund (bond cash in/out incl. interest),1000,800,400,0,0,0
3400,Interest Received (bank),0,82.5,110,115,120,125
############# Assets (Owned Value) #############################
0000,Bank Balance (+),0,200,450,700,950,1200
1200,Vehicle Values (gross cost),220,830,1350,1680,2200,2600
1300,Contracts / Receivables,50,210,450,700,950,1200
############# Liabilities (Owed Value) #########################
1600,Other (Office, Setup, etc.),-80,-180,-250,-310,-350,-400
2000,Loan / Bond Payable,-1000,-800,-400,0,0,0
2100,Accounts Payable,0,-25,-65,-105,-150,-190
2300,Accumulated Depreciation (Vehicles),0,-110,-260,-430,-640,-870
2400,Taxes,0,-20,-41,-63,-88,-115
2500,Other,0,-10,-20,-35,-40,-42
############# Expenses (Operational & Financing) ###############
4000,Suppliers & Drivers,0,-120,-175,-220,-310,-400
4500,Other (Admin/Overheads),0,-37,-45,-53,-67,-79`;

const USD_MULTIPLIER = 1000;
const START_YEAR = 2024;

function parseFinancialData(csv: string): YearlyFinancials[] {
    const lines = csv.split('\n').filter(line => line.trim() !== '' && !line.toLowerCase().startsWith('code,description'));
    const years = [0, 1, 2, 3, 4, 5];
    const labels = years.map((year, index) => {
        const currentYear = START_YEAR + year;
        return index === 0 ? `${currentYear} (Startup)` : `${currentYear}`;
    });

    const rawData: { [key: string]: { code: string; description: string; values: number[] }[] } = {
        income: [],
        assets: [],
        liabilities: [],
        expenses: [],
    };

    let currentQuadrantKey: keyof typeof rawData | null = null;

    for (const line of lines) {
        if (line.startsWith('#############')) {
            const header = line.toLowerCase();
            if (header.includes('lenders / income')) currentQuadrantKey = 'income';
            else if (header.includes('assets')) currentQuadrantKey = 'assets';
            else if (header.includes('liabilities')) currentQuadrantKey = 'liabilities';
            else if (header.includes('expenses')) currentQuadrantKey = 'expenses';
            continue;
        }

        if (currentQuadrantKey) {
            const parts = line.split(',');
            const code = parts[0];
            const description = parts[1];
            const values = parts.slice(2).map(v => (parseFloat(v) || 0) * USD_MULTIPLIER);
            rawData[currentQuadrantKey].push({ code, description, values });
        }
    }

    const liabilities = rawData.liabilities;
    const depreciationIndex = liabilities.findIndex(item => item.description.toLowerCase().includes('accumulated depreciation'));
    if (depreciationIndex > -1) {
        const [depreciationItem] = liabilities.splice(depreciationIndex, 1);
        rawData.assets.push(depreciationItem);
    }

    const yearlyData: YearlyFinancials[] = years.map((_, index) => {
        const yearEntry: YearlyFinancials = {
            year: START_YEAR + index,
            label: labels[index],
            income: { total: 0, nominals: [] },
            assets: { total: 0, nominals: [] },
            liabilities: { total: 0, nominals: [] },
            expenses: { total: 0, nominals: [] },
        };

        for (const key of Object.keys(rawData) as (keyof typeof rawData)[]) {
            const quadrantData = rawData[key];
            const nominalsForYear = quadrantData.map(item => ({
                code: item.code,
                description: item.description,
                value: item.values[index] || 0,
            }));

            const totalForYear = nominalsForYear.reduce((sum, nominal) => sum + nominal.value, 0);

            yearEntry[key].nominals = nominalsForYear;
            yearEntry[key].total = totalForYear;
        }
        return yearEntry;
    });

    // Special override for the 2024 "Startup" view to show total plan potential
    if (yearlyData.length > 0) {
        // Total capital from business plan: $1M (short) + $1M (medium) + $3M (long)
        const totalCapitalFundFromPlan = 5_000_000;

        // Calculate total receivables by summing across all years from the CSV data
        const receivablesLine = lines.find(line => line.includes('Contracts / Receivables'));
        let totalReceivables = 0;
        if (receivablesLine) {
            const values = receivablesLine.split(',').slice(2).map(v => parseFloat(v) || 0);
            totalReceivables = values.reduce((sum, val) => sum + val, 0) * USD_MULTIPLIER;
        }

        const startupFrame = yearlyData[0];

        // Update Capital Fund nominal value for 2024
        const capitalFundNominal = startupFrame.income.nominals.find(n => n.code === '3200');
        if (capitalFundNominal) {
            capitalFundNominal.value = totalCapitalFundFromPlan;
        }

        // Update Contracts / Receivables nominal value for 2024
        const receivablesNominal = startupFrame.assets.nominals.find(n => n.code === '1300');
        if (receivablesNominal) {
            receivablesNominal.value = totalReceivables;
        }

        // Recalculate totals for the affected quadrants
        startupFrame.income.total = startupFrame.income.nominals.reduce((sum, n) => sum + n.value, 0);
        startupFrame.assets.total = startupFrame.assets.nominals.reduce((sum, n) => sum + n.value, 0);
    }

    return yearlyData;
}


export const battleshipData: YearlyFinancials[] = parseFinancialData(csvData);