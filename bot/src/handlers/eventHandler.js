require('dotenv').config();
const { readdirSync, lstatSync } = require('fs');
const { join } = require('path');
const logger = require('@lib/Logger');

const handleEvent = (client, eventDir, eventName) => {
  if (!lstatSync(eventDir).isDirectory()) {
    return;
  }

  const eventFiles = readdirSync(eventDir).filter((file) => file.endsWith('.js'));

  for (const file of eventFiles) {
    try {
      const handler = require(join(eventDir, file));

      client.on(eventName, async (...args) => {
        try {
          await handler(client, ...args);
        } catch (error) {
          logger.error(`Error in event ${eventName}: ${error}`);
        }
      });
    } catch (error) {
      logger.error(`Error loading event ${eventName}: ${error}`);
    }
  }
};

function setupEvents(client) {
  const eventsDir = join(__dirname, '../events');

  const eventFolders = readdirSync(eventsDir);

  for (const folder of eventFolders) {
    const eventDir = join(eventsDir, folder);
    if (lstatSync(eventDir).isDirectory()) {
      handleEvent(client, eventDir, folder);
    }
  }
}

module.exports = setupEvents;
