/**
 * Knex migration: Create weapons table
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  await knex.schema.createTable('weapons', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable().unique();
    table.integer('enabled').notNullable().defaultTo(1).checkIn([0, 1]); // 1=有効, 0=除外
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // インデックス
    table.index('enabled');
  });
}

/**
 * Rollback: Drop weapons table
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('weapons');
}
