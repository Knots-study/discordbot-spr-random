import { getEnabledWeapons, getDisabledWeapons, disableWeapon } from '../database.js';
import { selectRandomWeapons, getHumanMembers } from '../utils/weaponSelector.js';
import { createWeaponEmbed, createSimpleWeaponEmbed } from '../utils/embedBuilder.js';
import { 
  REROLL_EMOJI, 
  NUMBER_EMOJIS, 
  REROLL_COOLDOWN,
  WEAPON_NAME_PATTERN,
  WEAPON_TYPE_PATTERN 
} from '../utils/constants.js';

// メッセージIDごとの初回表示時刻を記録
const messageCreationTimes = new Map();
// メッセージIDごとの再抽選済みフラグを記録
const rerolledMessages = new Map();

export default async function handleReaction(reaction, user, client) {
  if (user.bot) return;

  await fetchPartialReaction(reaction);

  const message = reaction.message;
  if (message.author.id !== client.user.id) return;

  const emojiName = reaction.emoji.name;

  try {
    // リロール処理
    if (emojiName === REROLL_EMOJI) {
      // 初回表示時刻を記録（初回のみ）
      if (!messageCreationTimes.has(message.id)) {
        messageCreationTimes.set(message.id, Date.now());
      }

      const createdAt = messageCreationTimes.get(message.id);
      const now = Date.now();
      const elapsed = now - createdAt;

      // 20秒経過チェック
      if (elapsed > REROLL_COOLDOWN) {
        await message.channel.send('❌ 再抽選は最初の20秒以内のみ可能です');
        await removeUserReaction(reaction, user);
        await reaction.remove(); // emoji自体を削除
        return;
      }

      // 1回のみチェック
      if (rerolledMessages.has(message.id)) {
        await message.channel.send('❌ 再抽選は1回のみ可能です');
        await removeUserReaction(reaction, user);
        return;
      }

      await handleReroll(message, user, client);
      rerolledMessages.set(message.id, true);
      await removeUserReaction(reaction, user);
      await reaction.remove(); // 再抽選後にemojiを削除
      return;
    }

    // 番号リアクション処理（武器除外）
    const numberIndex = NUMBER_EMOJIS.indexOf(emojiName);
    if (numberIndex !== -1) {
      await handleWeaponExclusion(message, numberIndex, user);
      await removeUserReaction(reaction, user);
    }
  } catch (error) {
    console.error('リアクション処理中にエラーが発生しました:', error);
  }
}

/**
 * リロール処理を実行
 */
async function handleReroll(message, user, client) {
  const member = await message.guild.members.fetch(user.id);
  const voiceChannel = member.voice.channel;

  if (!voiceChannel) {
    await rerollSimple(message);
  } else {
    await rerollWithVoiceChannel(message, voiceChannel);
  }
}

/**
 * 武器除外処理
 */
async function handleWeaponExclusion(message, weaponIndex, user) {
  const weaponName = extractWeaponNameFromEmbed(message.embeds[0], weaponIndex);
  if (!weaponName) return;

  const success = await disableWeapon(weaponName);
  if (success) {
    await sendExclusionFeedback(message.channel, user.id, weaponName);
  }
}

/**
 * Embedから指定インデックスの武器名を抽出
 */
function extractWeaponNameFromEmbed(embed, index) {
  if (!embed?.description) return null;

  const lines = embed.description.split('\n');
  if (index >= lines.length) return null;

  const match = lines[index].match(WEAPON_NAME_PATTERN);
  return match ? match[1] : null;
}

/**
 * 除外フィードバックメッセージを送信
 */
async function sendExclusionFeedback(channel, userId, weaponName) {
  try {
    await channel.send(
      `✅ <@${userId}> が **${weaponName}** を除外リストに追加しました`
    );
  } catch (error) {
    console.error('フィードバックメッセージの送信に失敗しました:', error);
  }
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
  
  const match = title.match(WEAPON_TYPE_PATTERN);
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
