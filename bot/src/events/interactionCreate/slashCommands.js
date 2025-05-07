const logger = require('../../lib/Logger');

module.exports = async (client, interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    logger.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction, client);
    logger.info(`${interaction.user.username} executed command /${interaction.commandName}`);
  } catch (error) {
    logger.error(error);
    if (error.stack) {
      logger.debug(error.stack);
    }

    const errorMessage = 'An internal error has occurred. Please try again later';

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
};
