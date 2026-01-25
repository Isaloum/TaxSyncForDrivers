# Quick Start Guide - User Documentation

## Overview

The TaxSyncForDrivers Quick Start Guide is an interactive onboarding experience designed to help rideshare and taxi drivers quickly understand and use the tax planning application. This guide takes approximately 5 minutes to complete and covers all essential features.

## Features

### 🚀 Interactive Walkthrough
- **5-Step Process**: Guides users through profile setup, document upload, vehicle tracking, income tracking, and tax form generation
- **Progress Tracking**: Visual progress bar showing current step and completion status
- **Bilingual Support**: Full French and English translations
- **Skip/Resume Capability**: Users can pause and continue later
- **Local Storage Persistence**: Progress is automatically saved

### 💡 Contextual Help
- **Tax Concept Tooltips**: Hover over info icons to learn about Canadian tax concepts
- **CRA Compliance Tips**: Understand requirements like the $75 receipt rule, 90% business use scrutiny, etc.
- **Learn More Links**: Direct links to official CRA/Revenu Québec resources

### 📊 Sample Scenarios
- **Pre-built Examples**: Load realistic data for full-time, part-time, and multi-platform drivers
- **Province-Specific**: Scenarios for Quebec, Ontario, and Alberta
- **Educational Purpose**: Helps users understand features without entering personal data

## Quick Start Guide Steps

### Step 1: Welcome & Profile Setup (30 seconds)
- Select your province
- Choose driver type (Uber, Lyft, Taxi, Multiple)
- Enter estimated annual income range

**Purpose**: Configures tax calculations based on your location and circumstances.

### Step 2: Document Upload Tutorial (1 minute)
- Learn how AI extracts data from receipts
- See a sample receipt processing demo
- Understand CRA receipt requirements (>$75 rule)

**Purpose**: Shows how to efficiently track expenses using document automation.

### Step 3: Vehicle Expenses Walkthrough (2 minutes)
- Enter odometer readings
- Add fuel and maintenance costs
- Calculate business use percentage
- Preview deduction amount

**Purpose**: Demonstrates the largest tax deduction category for most drivers.

### Step 4: Income Tracking Demo (1 minute)
- Upload sample Uber/Lyft statement
- See income parsing in action
- Understand gross vs. net income
- Learn about platform fees

**Purpose**: Shows how to track income across multiple platforms.

### Step 5: Tax Forms Preview (1 minute)
- Generate sample T2125 (Business Income & Expenses)
- View TP-80-V (Quebec self-employment)
- Preview GST/QST calculations
- See CCA (Capital Cost Allowance) schedule
- Export options for accountant

**Purpose**: Demonstrates the final output and professional tax forms.

## Tooltip System

### Available Tax Tooltips

#### GST/HST Registration Threshold
**When to use**: Near income tracking or GST warnings
- Explains the $30,000 registration requirement
- Links to CRA registration guide

#### CRA 90% Business Use Rule
**When to use**: Near vehicle business use percentage input
- Warns about CRA scrutiny on >90% claims
- Emphasizes mileage log importance

#### CCA Class 10 - Vehicle Depreciation
**When to use**: Near vehicle cost or CCA calculator
- Explains 30% declining balance depreciation
- Notes $37,000 luxury vehicle limit for 2026

#### Receipt $75 Rule
**When to use**: Near expense tracking or receipt upload
- Clarifies when receipts are mandatory
- Explains record-keeping requirements

#### T2125 Form
**When to use**: Near business expense section
- Describes Statement of Business Activities
- Links to CRA form guide

#### TP-80-V Form (Quebec)
**When to use**: For Quebec users only
- Explains FSS and QPP contributions
- Links to Revenu Québec resources

#### Mileage Log Requirements
**When to use**: Near vehicle expense tracking
- Details required log information
- Suggests acceptable logging methods

#### QPP Contributions (Quebec)
**When to use**: For Quebec self-employed users
- Explains dual employer/employee contributions
- Links to RRQ information

#### FSS Contributions (Quebec)
**When to use**: For Quebec self-employed users
- Describes Health Services Fund obligation
- Provides calculation guidance

### Using Tooltips in UI

```html
<!-- Add tooltip to any element -->
<span id="myTooltip"></span>

<script>
  // Populate tooltip on page load
  document.getElementById('myTooltip').innerHTML = createTooltip('gst-threshold', 'right');
</script>
```

## Sample Scenarios

### Scenario 1: Full-Time Uber Driver (Quebec)
**Profile**:
- Province: Quebec
- Platform: Uber
- Annual Income: $65,000
- Vehicle: 2024, $28,000 cost
- Business Use: 90%

**Expenses**: 15 sample expenses including fuel, insurance, maintenance
**Income**: Q1 and Q2 2025 Uber statements

### Scenario 2: Part-Time Lyft Driver (Ontario)
**Profile**:
- Province: Ontario
- Platform: Lyft
- Annual Income: $25,000
- Vehicle: 2023, $22,000 cost
- Business Use: 70%

**Expenses**: 10 sample expenses
**Income**: Q1 and Q2 2025 Lyft statements

### Scenario 3: Multi-Platform Taxi Driver (Alberta)
**Profile**:
- Province: Alberta
- Platforms: Uber + Lyft + Traditional Taxi
- Annual Income: $55,000
- Vehicle: 2024, $32,000 cost
- Business Use: 87%

**Expenses**: 15 sample expenses
**Income**: Q1 and Q2 2025 from all three platforms

### Loading Sample Scenarios

```javascript
// Load a scenario programmatically
loadSampleScenario('fulltime-uber-qc', 'fr');

// Get list of available scenarios
const scenarios = getAvailableScenarios('en');
console.log(scenarios);
```

## UI Integration

### Header Quick Start Button

Located in the top-right of the page header, the Quick Start button launches the interactive guide.

```html
<button class="btn-quick-start" onclick="startQuickGuide()">
  🚀 Guide de démarrage rapide
</button>
```

### Getting Started Section

Prominent section at the top of the main content area with 4 step cards:
1. **Set Your Profile** → Scrolls to province selector
2. **Upload Documents** → Scrolls to document AI
3. **Track Vehicle** → Scrolls to vehicle expenses
4. **Generate Forms** → Scrolls to business expenses

Each card includes:
- Step number badge
- Title and description
- Action button

### Quick Actions

Two large buttons for easy access:
1. **Launch Interactive Guide (5 min)** - Starts the walkthrough
2. **Load Sample Data** - Populates with example scenario

## Technical Implementation

### Files

- `quick-start-guide.js` - Main guide component and step rendering
- `tooltip-helper.js` - Tooltip system and tax concept definitions
- `sample-scenarios.js` - Pre-built driver scenarios
- `tests/quick-start-guide.test.js` - Comprehensive test suite (35+ tests)

### Dependencies

- No external dependencies
- Uses ES6 modules
- Compatible with modern browsers
- Requires localStorage for progress saving

### Browser Compatibility

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility

### Features
- **Keyboard Navigation**: Tab through steps, Enter to advance
- **Screen Reader Support**: ARIA labels on interactive elements
- **Color Contrast**: WCAG AA compliant
- **Focus Indicators**: Visible focus states
- **Language Attribute**: Sets `lang` attribute for assistive tech

### Best Practices
- Tooltips can be dismissed with Escape key
- Modal overlay can be closed by clicking outside
- Progress is always visible
- Clear visual hierarchy

## Customization

### Changing Guide Content

Edit `GUIDE_STEPS` in `quick-start-guide.js`:

```javascript
const GUIDE_STEPS = [
  {
    id: 'welcome',
    title: { en: 'Welcome', fr: 'Bienvenue' },
    description: { en: 'Let\'s begin', fr: 'Commençons' },
    duration: 30,
    component: 'WelcomeStep',
    sampleData: null
  },
  // ... more steps
];
```

### Adding New Tooltips

Add to `TAX_TOOLTIPS` in `tooltip-helper.js`:

```javascript
'my-tooltip': {
  en: {
    title: 'My Tooltip Title',
    content: 'Explanation here...',
    learnMore: 'https://link-to-resource.com'
  },
  fr: {
    title: 'Mon titre',
    content: 'Explication ici...',
    learnMore: 'https://lien-vers-ressource.com'
  }
}
```

### Creating New Scenarios

Add to `SAMPLE_SCENARIOS` in `sample-scenarios.js`:

```javascript
'my-scenario': {
  id: 'my-scenario',
  name: { en: 'Scenario Name', fr: 'Nom du scénario' },
  description: { en: 'Description', fr: 'Description' },
  profile: { /* ... */ },
  vehicle: { /* ... */ },
  expenses: [ /* ... */ ],
  income: [ /* ... */ ]
}
```

## Testing

### Running Tests

```bash
npm test tests/quick-start-guide.test.js
```

### Test Coverage

- ✅ Guide step configuration (5 tests)
- ✅ QuickStartGuide class methods (12 tests)
- ✅ Tooltip system (8 tests)
- ✅ Sample scenarios validation (10+ tests)
- ✅ Integration flows (3 tests)
- ✅ Edge cases and error handling (3 tests)

**Total: 35+ comprehensive tests**

## Troubleshooting

### Guide Not Appearing
- Check browser console for JavaScript errors
- Verify all script files are loaded (check Network tab)
- Ensure `startQuickGuide()` function is available globally

### Progress Not Saving
- Check if localStorage is enabled in browser
- Try clearing localStorage: `localStorage.removeItem('taxsync_guide_progress')`
- Check for quota exceeded errors

### Tooltips Not Showing
- Verify `initializeTooltips()` was called
- Check if tooltips are being created with valid keys
- Inspect CSS for `.tooltip-content` visibility

### Sample Scenario Not Loading
- Verify scenario ID is correct
- Check console for validation errors
- Ensure form fields exist in the DOM

## Future Enhancements

Potential improvements for future versions:

1. **Video Tutorials**: Embed short videos in each step
2. **Interactive Simulations**: Allow users to interact with sample data
3. **Personalized Recommendations**: AI-driven suggestions based on profile
4. **Multi-Step Forms**: Break complex inputs into wizards
5. **Guided Tours**: Highlight specific UI elements with spotlight
6. **Analytics**: Track which steps users skip or spend time on
7. **Export Progress**: Allow users to email their guide progress
8. **Gamification**: Add badges or achievements for completion

## Support

For issues or questions:
- Check this documentation first
- Review test file for usage examples
- Inspect browser console for errors
- Check GitHub issues for known problems

## License

MIT License - See LICENSE file for details

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Maintained by**: TaxSyncForDrivers Team
