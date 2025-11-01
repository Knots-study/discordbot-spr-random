import { EmbedBuilder } from 'discord.js';
import { getAllWeapons } from '../database.js';

export default {
  name: 'all',
  description: '全武器リストを表示',
  
  async execute(message, args) {
    const weapons = getAllWeapons();
    const chunks = [];
    
    for (let i = 0; i < weapons.length; i += 30) {
      chunks.push(weapons.slice(i, i + 30));
    }

    for (let i = 0; i < chunks.length; i++) {
      const embed = new EmbedBuilder()
        .setColor('#4A90E2')
        .setTitle(i === 0 ? '📜 全武器リスト' : '📜 全武器リスト（続き）')
        .setDescription(chunks[i].map((w, j) => `**${i * 30 + j + 1}.** ${w}`).join('\n'))
        .setFooter({ text: `合計: ${weapons.length}個` });

      await message.reply({ embeds: [embed] });
    }
  }
};
