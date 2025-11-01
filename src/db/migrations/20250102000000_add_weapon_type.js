/**
 * マイグレーション: weapon_type列を追加
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  await knex.schema.table('weapons', (table) => {
    table.string('weapon_type').notNullable();
    table.index('weapon_type');
  });
}

/**
 * ロールバック: weapon_type列を削除
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.schema.table('weapons', (table) => {
    table.dropColumn('weapon_type');
  });
}
