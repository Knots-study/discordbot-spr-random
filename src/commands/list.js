import { EmbedBuilder } from 'discord.js';
import { getDisabledWeapons } from '../database.js';
import { sendInfo } from '../utils/messageHelper.js';

export default {
  name: 'list',
  description: '除外中の武器一覧を表示',
  
  async execute(message, args) {
    const disabledWeapons = await getDisabledWeapons();
    
    if (disabledWeapons.length === 0) {
      return sendInfo(message, '現在、除外されている武器はありません。');
    }

    const embed = new EmbedBuilder()
      .setColor('#FF6B6B')
      .setTitle('🚫 除外中の武器一覧')
      .setDescription(disabledWeapons.map((w, i) => `**${i + 1}.** ${w}`).join('\n'))
      .setFooter({ text: `合計: ${disabledWeapons.length}個` });

    await message.reply({ embeds: [embed] });
  }
};
