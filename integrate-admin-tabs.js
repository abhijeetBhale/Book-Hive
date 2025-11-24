/**
 * Script to integrate Organizer Applications and Events tabs into AdminDashboard.jsx
 * Run with: node integrate-admin-tabs.js
 */

const fs = require('fs');
const path = require('path');

const ADMIN_DASHBOARD_PATH = path.join(__dirname, 'client', 'src', 'pages', 'AdminDashboard.jsx');

// Read the file
let content = fs.readFileSync(ADMIN_DASHBOARD_PATH, 'utf8');

// 1. Add imports after line with TopBooks import
const importToAdd = `import OrganizerApplicationsTab from '../components/admin/OrganizerApplicationsTab';
import EventsTab from '../components/admin/EventsTab';`;

content = content.replace(
  "import TopBooks from '../components/admin/TopBooks';",
  `import TopBooks from '../components/admin/TopBooks';
${importToAdd}`
);

// 2. Add navigation tabs after Book Clubs button
const navTabsToAdd = `
            <button
              onClick={() => setActiveTab('organizer-applications')}
              className={\`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors \${activeTab === 'organizer-applications'
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }\`}
            >
              <UserCheck className="w-4 h-4 mr-3" />
              Organizer Applications
            </button>

            <button
              onClick={() => setActiveTab('events')}
              className={\`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors \${activeTab === 'events'
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }\`}
            >
              <Calendar className="w-4 h-4 mr-3" />
              Events
            </button>
`;

// Find the Book Clubs button and add after it
content = content.replace(
  /(<button[^>]*onClick=\{[^}]*setActiveTab\('clubs'\)[^}]*\}[^>]*>[\s\S]*?Book Clubs[\s\S]*?<\/button>)/,
  `$1${navTabsToAdd}`
);

// 3. Add render calls
const renderCallsToAdd = `          {activeTab === 'organizer-applications' && <OrganizerApplicationsTab />}
          {activeTab === 'events' && <EventsTab />}`;

content = content.replace(
  "{activeTab === 'help' && renderHelp()}",
  `{activeTab === 'help' && renderHelp()}
${renderCallsToAdd}`
);

// Write the modified content back
fs.writeFileSync(ADMIN_DASHBOARD_PATH, content, 'utf8');

console.log('✅ Successfully integrated Organizer Applications and Events tabs!');
console.log('📝 Changes made:');
console.log('   - Added component imports');
console.log('   - Added navigation tabs in sidebar');
console.log('   - Added render calls for new tabs');
console.log('\n🚀 The admin dashboard now has two new tabs:');
console.log('   1. Organizer Applications');
console.log('   2. Events');
console.log('\n💡 Restart your dev server if changes don\'t appear immediately.');
