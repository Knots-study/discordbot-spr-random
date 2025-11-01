import { getEnabledWeapons, getDisabledWeapons, getWeaponTypes } from '../database.js';
import { selectRandomWeapons, getHumanMembers } from '../utils/weaponSelector.js';
import { createWeaponEmbed } from '../utils/embedBuilder.js';
import { sendError } from '../utils/messageHelper.js';
import { REROLL_EMOJI, NUMBER_EMOJIS } from '../utils/constants.js';

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

    // 武器種別の指定を確認
    const weaponType = args.join(' ');
    let weaponTypeFilter = null;
    
    if (weaponType) {
      const weaponTypes = getWeaponTypes();
      if (!weaponTypes.includes(weaponType)) {
        return sendError(message, `武器種別 "${weaponType}" は存在しません！\n有効な種別: ${weaponTypes.join(', ')}`);
      }
      weaponTypeFilter = weaponType;
    }

    const availableWeapons = await getEnabledWeapons(weaponTypeFilter);
    const disabledWeapons = await getDisabledWeapons();
    
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
    
    // リロール用のリアクション追加
    await sentMessage.react(REROLL_EMOJI);
    
    // 各武器に番号リアクション追加（除外用）
    for (let i = 0; i < assignments.length && i < NUMBER_EMOJIS.length; i++) {
      await sentMessage.react(NUMBER_EMOJIS[i]);
    }
  }
};
