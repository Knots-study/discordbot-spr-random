/**
 * 武器をランダムに選出
 * @param {string[]} weapons 武器リスト
 * @param {number} count 選出数
 * @returns {string[]} 選出された武器リスト
 */
export function selectRandomWeapons(weapons, count) {
  const selected = [];
  const pool = [...weapons];
  
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    selected.push(pool[randomIndex]);
    pool.splice(randomIndex, 1);
  }
  
  return selected;
}

/**
 * ボイスチャンネルから人間のメンバーを取得
 * @param {VoiceChannel} voiceChannel
 * @returns {Collection} Bot以外のメンバー
 */
export function getHumanMembers(voiceChannel) {
  return voiceChannel.members.filter(member => !member.user.bot);
}
