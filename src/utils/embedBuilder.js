import { EmbedBuilder } from 'discord.js';
import { EMBED_COLOR, REROLL_EMOJI, NUMBER_EMOJIS } from './constants.js';

/**
 * 武器選出結果のEmbedを作成
 * @param {Array} assignments メンバーと武器の割り当て配列
 * @param {number} disabledCount 除外武器数
 * @param {string} weaponType 武器種別（オプション）
 * @param {boolean} isReroll 再抽選かどうか
 * @param {boolean} isExpired 再抽選期限切れかどうか
 */
export function createWeaponEmbed(assignments, disabledCount, weaponType = null, isReroll = false, isExpired = false) {
  const typeText = weaponType ? `（${weaponType}）` : '';
  const rerollText = isReroll ? '（再抽選）' : '';
  const title = `🎲 ランダム武器選出${typeText}${rerollText}`;
  
  const description = assignments
    .map((a, i) => {
      const emoji = i < NUMBER_EMOJIS.length ? NUMBER_EMOJIS[i] : `**${i + 1}.**`;
      return `${emoji} <@${a.member.id}> → **${a.weapon}**`;
    })
    .join('\n');
  
  const baseFooter = `参加者: ${assignments.length}人 | 除外中: ${disabledCount}個`;
  const rerollInfo = isExpired ? '番号で除外' : isReroll ? '' : `${REROLL_EMOJI}で再抽選(20秒以内) | 番号で除外`;
  const footerText = rerollInfo ? `${baseFooter} | ${rerollInfo}` : baseFooter;
  
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
  const description = weapons.map((weapon, i) => `**${i + 1}.** ${weapon}`).join('\n');
  
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle('🎲 ランダム武器選出（再抽選）')
    .setFooter({ text: `除外中: ${disabledCount}個` });
  
  if (description) {
    embed.setDescription(description);
  }
  
  return embed;
}
