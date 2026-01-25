const translations = require('./translations.js');
console.log('Loaded:', typeof translations);
console.log('Constructor:', translations.constructor.name);
console.log('Is empty?', Object.keys(translations).length === 0);

// Try to access directly
console.log('Direct access - en?', translations.en);
console.log('Direct access - fr?', translations.fr);
