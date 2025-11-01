// Knex configuration file
export default {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './data/weapons.db'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './src/db/migrations'
    },
    seeds: {
      directory: './src/db/seeds'
    }
  }
};
