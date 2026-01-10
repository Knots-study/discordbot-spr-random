import { EmbedBuilder } from 'discord.js';
import weaponRepository from '../repositories/WeaponRepository.js';
import { sendInfo } from '../utils/messageHelper.js';

/**
 * 除外リスト表示コマンド
 * Dependency Injection を使用してリポジトリに依存
 */
class ListCommand {
  constructor(weaponRepository) {
    this.weaponRepository = weaponRepository;
  }

  async execute(message, args) {
    const disabledWeapons = await this.weaponRepository.getDisabledWeapons();
    
    if (disabledWeapons.length === 0) {
      return sendInfo(message, '現在、除外されている武器はありません。');
    }

    const embed = new EmbedBuilder()
      .setColor('#FF6B6B')
      .setTitle('🚫 除外中の武器一覧')
      .setDescription(disabledWeapons.map((w, i) => `**${i + 1}.** ${w}`).join('\n'))
      .setFooter({ text: `合計: ${disabledWeapons.length}個` });

    return message.reply({ embeds: [embed] });
  }
}

// コマンド定義（DIでインスタンス化）
const listCommand = new ListCommand(weaponRepository);

export default {
  name: 'list',
  description: '除外中の武器一覧を表示',
  execute: (message, args) => listCommand.execute(message, args)
};
