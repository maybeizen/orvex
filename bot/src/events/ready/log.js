const logger = require('@lib/Logger');
const cache = require('@lib/Cache');

module.exports = (client) => {
  logger.success(`${client.user?.username} is online!`);
  cache.set('ready', true);

  setInterval(() => {
    cache.cleanUp();
  }, process.env.CACHE_CLEANUP_INTERVAL);
};
