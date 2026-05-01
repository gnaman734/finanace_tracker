require('dotenv').config();

const base = {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  seederStorage: 'sequelize',
  migrationStorage: 'sequelize'
};

module.exports = {
  development: {
    ...base,
    use_env_variable: 'DATABASE_URL'
  },
  test: {
    ...base,
    use_env_variable: 'DATABASE_URL_TEST'
  },
  production: {
    ...base,
    use_env_variable: 'DATABASE_URL'
  }
};
