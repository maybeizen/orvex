require("dotenv").config();
const { Collection, REST, Routes } = require("discord.js");
const { readdirSync, statSync } = require("fs");
const { join } = require("path");
const logger = require("@lib/Logger");

const readCommands = (client, dir) => {
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      readCommands(client, filePath);
    } else if (file.startsWith("!")) {
      logger.warn(`Skipping "${file}" as it is marked as an exclusion.`);
    } else if (file.endsWith(".js")) {
      const command = require(filePath);

      if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
        logger.info(`Registered command "${command.data.name}"`);
      } else {
        logger.warn(
          `Command "${file}" is missing a required "data" or "execute" property.`
        );
      }
    }
  }
};

const registerSlashCommands = async (client, commands, token) => {
  const rest = new REST({ version: "10" }).setToken(token);

  try {
    if (commands.length === 0) {
      logger.warn("No commands found. Skipping registration.");
      return;
    }

    await rest.put(Routes.applicationCommands(client.user.id), {
      body: commands,
    });
    logger.info(`Successfully registered ${commands.length} command(s).`);
  } catch (error) {
    logger.error(error);
  }
};

function setupCommands(client) {
  client.commands = new Collection();
  const commandsDir = join(__dirname, "../commands");

  readCommands(client, commandsDir);

  const commands = Array.from(client.commands.values()).map(
    (command) => command.data
  );
  logger.info(`Loaded ${commands.length} commands.`);

  client.once("ready", () => {
    registerSlashCommands(client, commands, process.env.TOKEN);
  });
}

module.exports = setupCommands;
