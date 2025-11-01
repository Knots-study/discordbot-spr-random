import { EmbedBuilder } from 'discord.js';
import { EMBED_COLOR, REROLL_EMOJI, NUMBER_EMOJIS } from './constants.js';

/**
 * 武器選出結果のEmbedを作成
 * @param {Array} assignments メンバーと武器の割り当て配列
 * @param {number} disabledCount 除外武器数
 * @param {string} weaponType 武器種別（オプション）
 * @param {boolean} isReroll 再抽選かどうか
 */
export function createWeaponEmbed(assignments, disabledCount, weaponType = null, isReroll = false) {
  const typeText = weaponType ? `（${weaponType}）` : '';
  const title = isReroll ? `🎲 ランダム武器選出${typeText}（再抽選）` : `🎲 ランダム武器選出${typeText}`;
  const count = assignments.length;
  
  const description = assignments
    .map((a, i) => {
      const emoji = i < NUMBER_EMOJIS.length ? NUMBER_EMOJIS[i] : `**${i + 1}.**`;
      return `${emoji} <@${a.member.id}> → **${a.weapon}**`;
    })
    .join('\n');
  
  const footerText = isReroll
    ? `参加者: ${count}人 | 除外中: ${disabledCount}個`
    : `参加者: ${count}人 | 除外中: ${disabledCount}個 | ${REROLL_EMOJI}で再抽選 | 番号で除外`;
  
  return new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: footerText });
}

/**
 * シンプルな武器リストEmbedを作成（ボイスチャンネルなし用）
 */
export function createSimpleWeaponEmbed(weapons, disabledCount) {
  const description = weapons
    .map((weapon, i) => `**${i + 1}.** ${weapon}`)
    .join('\n');
  
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle('🎲 ランダム武器選出（再抽選）')
    .setFooter({ text: `除外中: ${disabledCount}個` });
  
  // 空文字はsetDescriptionでエラーになるので条件分岐
  if (description) {
    embed.setDescription(description);
  }
  
  return embed;
}
