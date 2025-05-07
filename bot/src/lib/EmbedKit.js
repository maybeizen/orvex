const { EmbedBuilder } = require("discord.js");

class EmbedKit extends EmbedBuilder {
  constructor(data) {
    super(data);
  }

  success(title, description, fields = []) {
    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle(title)
      .setDescription(description);
    if (fields.length > 0) {
      embed.addFields(...fields);
    }
    return embed;
  }

  error(error) {
    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle("Error")
      .setDescription(error);
    return embed;
  }

  warning(info) {
    const embed = new EmbedBuilder()
      .setColor("Yellow")
      .setTitle("Warning")
      .setDescription(info);
    return embed;
  }
}

module.exports = new EmbedKit();
