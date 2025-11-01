import { EmbedBuilder } from 'discord.js';

export default {
  name: 'help',
  description: 'ヘルプを表示',
  
  async execute(message, args) {
    const helpEmbed = new EmbedBuilder()
      .setColor('#FF6B6B')
      .setTitle('🎮 Splatoon武器ランダム選出Bot')
      .setDescription('サーバー全体で使いたくない武器を除外して、ランダムに選出します！')
      .addFields(
        { name: '`!random [種別]`', value: 'ボイスチャンネル参加者に武器を選出\n例: `!random` または `!random フデ`' },
        { name: '`!remove [武器名/種別]`', value: '武器または武器種別を除外リストに追加\n例: `!remove わかばシューター` または `!remove シューター`' },
        { name: '`!add [武器名/種別]`', value: '武器または武器種別を除外リストから削除\n例: `!add わかばシューター` または `!add シューター`' },
        { name: '`!list`', value: '除外中の武器一覧を表示' },
        { name: '`!all`', value: '全ての武器リストを表示' },
        { name: '`!clear`', value: '除外リストを全てクリア' }
      )
      .addFields(
        { name: '武器種別一覧', value: 'シューター、マニューバー、ブラスター、フデ、ローラー、スロッシャー、シェルター、スピナー、チャージャー、ストリンガー、ワイパー' }
      )
      .setFooter({ text: 'リアクション機能: 選出結果の🔄を押すと再抽選できます（1回のみ）' });
    
    await message.reply({ embeds: [helpEmbed] });
  }
};
