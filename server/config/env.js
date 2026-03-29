// Suppress dotenv verbose output
process.env.DOTENV_CONFIG_SILENT = 'true';

import dotenv from 'dotenv';

// Load environment variables silently
dotenv.config({ silent: true });

export default dotenv;