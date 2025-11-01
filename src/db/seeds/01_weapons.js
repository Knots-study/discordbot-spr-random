import { ALL_WEAPONS } from '../../data/weapons.js';

/**
 * Knex seed: Insert test weapon data
 * @param {import('knex').Knex} knex
 */
export async function seed(knex) {
  console.log(`\n📝 武器データを追加中...`);
  console.log(`   武器総数: ${ALL_WEAPONS.length}種類\n`);
  
  // Insert weapons (ignore duplicates)
  const weapons = ALL_WEAPONS.map(weapon => ({
    name: weapon.name,
    weapon_type: weapon.type,
    enabled: 1
  }));
  
  await knex('weapons')
    .insert(weapons)
    .onConflict('name')
    .ignore();
  
  // Show statistics
  const stats = await knex('weapons')
    .select(knex.raw('COUNT(*) as total'))
    .select(knex.raw('SUM(CASE WHEN enabled = 1 THEN 1 ELSE 0 END) as enabled_count'))
    .select(knex.raw('SUM(CASE WHEN enabled = 0 THEN 1 ELSE 0 END) as disabled_count'))
    .first();
  
  if (stats) {
    console.log('📊 データベース統計:');
    console.log(`   総武器数: ${stats.total}`);
    console.log(`   有効: ${stats.enabled_count} / 除外: ${stats.disabled_count}\n`);
  }
  
  console.log('🎉 シード完了！\n');
}
