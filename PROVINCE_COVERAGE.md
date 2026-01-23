# Canadian Province and Territory Tax Calculator Coverage

## Complete Coverage Summary

TaxSyncForDrivers provides **complete tax calculation coverage** for all 10 Canadian provinces and 3 territories.

### ✅ All 10 Provinces Covered

| Province | Tax Calculator File | Status | Key Features |
|----------|-------------------|--------|--------------|
| **Alberta** | `alberta-tax-calculator.js` | ✅ Complete | Lowest provincial rates (10-15%), highest BPA ($21,885) |
| **British Columbia** | `bc-tax-calculator.js` | ✅ Complete | 7 tax brackets (5.06-20.5%), no health premium |
| **Manitoba** | `manitoba-tax-calculator.js` | ✅ Complete | Education property tax credit, 3 brackets (10.8-17.4%) |
| **New Brunswick** | `atlantic-provinces-tax-calculator.js` | ✅ Complete | 4 brackets (9.4-19.5%), part of Atlantic group |
| **Newfoundland & Labrador** | `atlantic-provinces-tax-calculator.js` | ✅ Complete | 5 brackets (8.7-21.8%), tied for highest top rate |
| **Nova Scotia** | `atlantic-provinces-tax-calculator.js` | ✅ Complete | 5 brackets (8.79-21%), highest top rate in Canada |
| **Ontario** | `ontario-tax-calculator.js` | ✅ Complete | 5 brackets (5.05-13.16%), includes surtax & health premium |
| **Prince Edward Island** | `atlantic-provinces-tax-calculator.js` | ✅ Complete | 4 brackets (9.8-16.7%), includes 10% surtax |
| **Quebec** | `quebec-tax-calculator.js` | ✅ Complete | 4 brackets (14-25.75%), highest BPA ($18,952), QPP integration |
| **Saskatchewan** | `saskatchewan-tax-calculator.js` | ✅ Complete | 3 brackets (10.5-14.5%), low-income credit, graduate retention |

### ✅ All 3 Territories Covered

| Territory | Tax Calculator File | Status | Key Features |
|-----------|-------------------|--------|--------------|
| **Yukon** | `territories-tax-calculator.js` | ✅ Complete | 5 brackets (6.4-15%), Zone A northern deduction |
| **Northwest Territories** | `territories-tax-calculator.js` | ✅ Complete | 4 brackets (5.9-14.05%), Zone A northern deduction |
| **Nunavut** | `territories-tax-calculator.js` | ✅ Complete | 4 brackets (4-11.5%), **lowest rates in Canada**, Zone A |

## 2026 Tax Year Features

All tax calculators are updated for the **2026 tax year** with:

- ✅ Indexed tax brackets (~2% inflation adjustment)
- ✅ Updated basic personal amounts
- ✅ Province-specific credits and deductions
- ✅ Accurate marginal and effective rate calculations
- ✅ Bracket breakdown for detailed analysis

## Special Provincial Features

### Quebec (`quebec-tax-calculator.js`)
- **Work Premium (Prime au travail)**: $728 single, $1,456 family
- **Solidarity Tax Credit**: $531 single, $1,062 couple
- **Quebec Pension Plan (QPP)**: 13.8% base + 2% QPP2 for high earners
- **Highest Basic Personal Amount**: $18,952 (vs. federal $16,452)
- **Separate tax system**: Not integrated with federal (unlike other provinces)

### Ontario (`ontario-tax-calculator.js`)
- **Provincial surtax**: 20% on tax over $5,315, 36% over $6,802
- **Ontario Health Premium**: Up to $900 based on income
- **Ontario Trillium Benefit**: Energy + property tax credits

### Alberta (`alberta-tax-calculator.js`)
- **Lowest provincial rates**: 10-15%
- **Highest Basic Personal Amount**: $21,885
- **No PST**: Only 5% GST (lowest in Canada)
- **Alberta Family Employment Tax Credit**: Up to $2,336

### Atlantic Provinces (`atlantic-provinces-tax-calculator.js`)
- **Nova Scotia**: Highest top rate (21%)
- **Newfoundland**: Second highest top rate (21.8%)
- **PEI**: 10% surtax on provincial tax over $12,500
- **New Brunswick**: 4 brackets with moderate rates

### Territories (`territories-tax-calculator.js`)
- **Northern Residents Deduction**:
  - Zone A (territories): $22/day residency ($8,030/year)
  - Zone B (northern provinces): $11/day residency ($4,015/year)
  - Travel deduction: Up to $2,400 (2 trips × $1,200)
- **Nunavut**: Lowest rates in Canada (4-11.5%)

## Testing Coverage

All provincial and territorial tax calculators have comprehensive test suites:

- ✅ Basic tax calculations at various income levels
- ✅ Marginal tax rate calculations
- ✅ Province-specific credits and deductions
- ✅ Edge cases (zero income, negative income, very high income)
- ✅ Bracket breakdown validation
- ✅ Integration with federal tax system

### Test Files
- `tests/quebec-tax-calculator.test.js` - 47 tests for Quebec
- `tests/provincial-tax-calculators.test.js` - Tests for MB, SK, Atlantic, Territories
- `tests/alberta-calculators.test.js` - Tests for Alberta
- `tests/bc-calculators.test.js` - Tests for BC
- `tests/ontario-calculators.test.js` - Tests for Ontario

## Usage Examples

### Calculate Quebec Provincial Tax
```javascript
import { calculateQuebecTax, calculateQPPContributions } from './quebec-tax-calculator.js';

const income = 75000;
const taxResult = calculateQuebecTax(income);
console.log(`Provincial tax: $${taxResult.provincialTax}`);
console.log(`Effective rate: ${taxResult.effectiveRate}%`);

const qppResult = calculateQPPContributions(income);
console.log(`QPP contributions: $${qppResult.totalContribution}`);
console.log(`Deductible (employer portion): $${qppResult.deductibleAmount}`);
```

### Calculate Combined Federal + Quebec Rate
```javascript
import { getCombinedMarginalRate } from './quebec-tax-calculator.js';

const income = 120000;
const combinedRate = getCombinedMarginalRate(income);
console.log(`Combined marginal rate: ${combinedRate}%`); // 50%
```

### Calculate Atlantic Province Tax
```javascript
import { 
  calculateNovaScotiaTax,
  calculateNewBrunswickTax,
  calculatePEITax,
  calculateNewfoundlandTax 
} from './atlantic-provinces-tax-calculator.js';

const income = 60000;
console.log(`Nova Scotia: $${calculateNovaScotiaTax(income).provincialTax}`);
console.log(`New Brunswick: $${calculateNewBrunswickTax(income).provincialTax}`);
console.log(`PEI: $${calculatePEITax(income).totalTax}`); // Includes surtax
console.log(`Newfoundland: $${calculateNewfoundlandTax(income).provincialTax}`);
```

## Documentation Sources

All tax rates and calculations are based on official government sources:

### Federal
- [Canada Revenue Agency - Tax Rates](https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html)

### Provincial
- **Quebec**: [Revenu Québec](https://www.revenuquebec.ca/en/citizens/income-tax-return/)
- **Ontario**: [Ontario Ministry of Finance](https://www.ontario.ca/page/personal-income-tax)
- **Alberta**: [Government of Alberta](https://www.alberta.ca/personal-income-tax)
- **BC**: [Government of BC](https://www2.gov.bc.ca/gov/content/taxes/income-taxes)
- And official sources for all other provinces and territories

## Changelog

### January 2026
- ✅ Added dedicated `quebec-tax-calculator.js` for consistency with other provinces
- ✅ Consolidated all Quebec-specific calculations (Work Premium, Solidarity Credit, QPP)
- ✅ Added comprehensive test suite (47 tests) for Quebec tax calculations
- ✅ All 10 provinces + 3 territories now have dedicated tax calculator coverage

### Previous Updates
- All provinces and territories updated for 2026 tax year
- Federal tax rate reduced to 14% (from 15% in 2025)
- Quebec second bracket rate reduced to 19% (from 20% in 2025)
- All brackets indexed for inflation (~2% across Canada)

---

**Last Updated**: January 2026  
**Tax Year**: 2026  
**Coverage**: 100% of Canadian provinces and territories ✅
