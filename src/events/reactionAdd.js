import { getEnabledWeapons, getDisabledWeapons } from '../database.js';
import { selectRandomWeapons, getHumanMembers } from '../utils/weaponSelector.js';
import { createWeaponEmbed, createSimpleWeaponEmbed } from '../utils/embedBuilder.js';
import { REROLL_EMOJI } from '../utils/constants.js';

export default async function handleReaction(reaction, user, client) {
  if (user.bot) return;
  if (reaction.emoji.name !== REROLL_EMOJI) return;

  await fetchPartialReaction(reaction);

  const message = reaction.message;
  if (message.author.id !== client.user.id) return;

  const member = await message.guild.members.fetch(user.id);
  const voiceChannel = member.voice.channel;

  if (!voiceChannel) {
    await rerollSimple(message);
  } else {
    await rerollWithVoiceChannel(message, voiceChannel);
  }

  await removeUserReaction(reaction, user);
  await reaction.remove();
}

/**
 * リアクションが部分的な場合はフェッチ
 */
async function fetchPartialReaction(reaction) {
  if (!reaction.partial) return;
  
  try {
    await reaction.fetch();
  } catch (error) {
    console.error('リアクションの取得に失敗しました:', error);
    throw error;
  }
}

/**
 * ボイスチャンネルありの再抽選
 */
async function rerollWithVoiceChannel(message, voiceChannel) {
  const members = getHumanMembers(voiceChannel);
  if (members.size === 0) return;

  // 元のEmbedから武器種別を抽出
  const originalEmbed = message.embeds[0];
  const weaponType = extractWeaponTypeFromTitle(originalEmbed?.title);

  const availableWeapons = await getEnabledWeapons(weaponType);
  const disabledWeapons = await getDisabledWeapons();

  if (availableWeapons.length === 0 || members.size > availableWeapons.length) {
    return;
  }

  const selectedWeapons = selectRandomWeapons(availableWeapons, members.size);
  const membersArray = Array.from(members.values());
  const assignments = membersArray.map((m, i) => ({
    member: m,
    weapon: selectedWeapons[i]
  }));

  const embed = createWeaponEmbed(assignments, disabledWeapons.length, weaponType, true);
  await message.edit({ embeds: [embed] });
}

/**
 * タイトルから武器種別を抽出
 * @param {string} title - Embedのタイトル
 * @returns {string|null} 武器種別またはnull
 */
function extractWeaponTypeFromTitle(title) {
  if (!title) return null;
  
  const match = title.match(/🎲 ランダム武器選出（(.+?)）/);
  if (match && match[1] !== '再抽選') {
    return match[1];
  }
  return null;
}

/**
 * シンプルな再抽選（ボイスチャンネルなし用）
 */
async function rerollSimple(message) {
  const originalEmbed = message.embeds[0];
  if (!originalEmbed?.description) return;

  const count = originalEmbed.description.split('\n').length;
  const availableWeapons = await getEnabledWeapons();
  const disabledWeapons = await getDisabledWeapons();

  if (availableWeapons.length === 0 || count > availableWeapons.length) {
    return;
  }

  const selectedWeapons = selectRandomWeapons(availableWeapons, count);
  const embed = createSimpleWeaponEmbed(selectedWeapons, disabledWeapons.length);
  await message.edit({ embeds: [embed] });
}

/**
 * ユーザーのリアクションを削除
 */
async function removeUserReaction(reaction, user) {
  try {
    await reaction.users.remove(user.id);
  } catch (error) {
    console.error('リアクション削除に失敗しました:', error);
  }
}
