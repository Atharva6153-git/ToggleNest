// Root entry point for the ToggleNest backend.
// Changes to the backend directory so environment variables and
// dependencies resolve correctly, then starts the Express server.
process.chdir(require('path').join(__dirname, 'backend'));
require('./backend/server.js');