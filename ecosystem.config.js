
module.exports = {
  apps : [{
    name   : "nutrition-website",
    script : "npm",
    args   : "start",
    env_production: {
       NODE_ENV: "production",
       DATABASE_URL: "mysql://nutrisapdb:jgrg5ggJ1hzoyGx2JI0X@localhost:3306/nutrisapdb",
       JWT_SECRET: "your-super-secret-jwt-key-change-this-in-production",
       NEXTAUTH_URL: "http://localhost:9001",
       NEXTAUTH_SECRET: "your-nextauth-secret"
    }
  }]
}
