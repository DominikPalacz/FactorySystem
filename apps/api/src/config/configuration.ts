export default () => ({
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
  database: {
    url:
      process.env.DATABASE_URL ??
      "postgres://admin:password@localhost:5432/factory_db",
  },
});
