import { getEnabledWeapons, getDisabledWeapons, getWeaponTypes } from '../database.js';
import { selectRandomWeapons, getHumanMembers } from '../utils/weaponSelector.js';
import { createWeaponEmbed } from '../utils/embedBuilder.js';
import { sendError } from '../utils/messageHelper.js';
import { REROLL_EMOJI, NUMBER_EMOJIS } from '../utils/constants.js';
import { registerMessageCreationTime } from '../events/reactionAdd.js';
import { ErrorHandler } from '../utils/errorHandler.js';

/**
 * リアクションを追加
 */
async function addReactions(message, assignmentCount) {
  await message.react(REROLL_EMOJI);
  
  const reactionCount = Math.min(assignmentCount, NUMBER_EMOJIS.length);
  for (let i = 0; i < reactionCount; i++) {
    await message.react(NUMBER_EMOJIS[i]);
  }
}

/**
 * 20秒後に再抽選を期限切れにする
 */
function scheduleRerollExpiration(message, assignments, disabledCount, weaponTypeFilter) {
  setTimeout(async () => {
    try {
      const rerollReaction = message.reactions.cache.get(REROLL_EMOJI);
      if (rerollReaction) {
        await rerollReaction.remove();
      }

      const updatedEmbed = createWeaponEmbed(assignments, disabledCount, weaponTypeFilter, false, true);
      await message.edit({ embeds: [updatedEmbed] });
    } catch (error) {
      ErrorHandler.log(error, 'Reroll expiration');
    }
  }, 20000);
}

export default {
  name: 'random',
  description: 'ボイスチャンネル参加者に武器を選出（武器種別指定可）',
  
  async execute(message, args) {
    const voiceChannel = message.member.voice.channel;
    
    if (!voiceChannel) {
      return sendError(message, 'ボイスチャンネルに参加してから実行してください！');
    }

    const members = getHumanMembers(voiceChannel);
    
    if (members.size === 0) {
      return sendError(message, 'ボイスチャンネルに参加者がいません！');
    }

    const weaponTypeFilter = args.join(' ') || null;
    
    if (weaponTypeFilter && !getWeaponTypes().includes(weaponTypeFilter)) {
      return sendError(message, `武器種別 "${weaponTypeFilter}" は存在しません！\n有効な種別: ${getWeaponTypes().join(', ')}`);
    }

    const [availableWeapons, disabledWeapons] = await Promise.all([
      getEnabledWeapons(weaponTypeFilter),
      getDisabledWeapons()
    ]);
    
    if (availableWeapons.length === 0) {
      if (weaponTypeFilter) {
        return sendError(message, `${weaponTypeFilter}の武器が全て除外されているか、存在しません！`);
      }
      return sendError(message, '全ての武器が除外されています！`!clear`で除外リストをクリアしてください。');
    }

    if (members.size > availableWeapons.length) {
      return sendError(message, `利用可能な武器は${availableWeapons.length}個です。参加者が多すぎます。`);
    }

    const selectedWeapons = selectRandomWeapons(availableWeapons, members.size);
    const membersArray = Array.from(members.values());
    const assignments = membersArray.map((member, i) => ({
      member,
      weapon: selectedWeapons[i]
    }));

    const embed = createWeaponEmbed(assignments, disabledWeapons.length, weaponTypeFilter);
    const sentMessage = await message.reply({ embeds: [embed] });
    
    registerMessageCreationTime(sentMessage.id);
    await addReactions(sentMessage, assignments.length);
    scheduleRerollExpiration(sentMessage, assignments, disabledWeapons.length, weaponTypeFilter);
  }
};
