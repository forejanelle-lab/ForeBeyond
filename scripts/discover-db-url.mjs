import pg from "pg";

const pass = process.env.PG_PASS || "Bcd7303bcx!!!";
const ref = "pudfethylijrfilcihgp";

const regions = [
  "us-east-1", "us-east-2", "us-west-1", "us-west-2",
  "eu-west-1", "eu-west-2", "eu-west-3", "eu-central-1", "eu-central-2", "eu-north-1",
  "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ap-northeast-2", "ap-south-1", "ap-south-2",
  "ca-central-1", "sa-east-1", "af-south-1", "me-south-1", "me-central-1",
];

async function tryConn(host, port, user) {
  const client = new pg.Client({
    host,
    port,
    user,
    password: pass,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });
  await client.connect();
  await client.query("SELECT 1");
  await client.end();
  return true;
}

for (const prefix of ["aws-0", "aws-1"]) {
  for (const region of regions) {
    for (const port of [5432, 6543]) {
      const host = `${prefix}-${region}.pooler.supabase.com`;
      const user = `postgres.${ref}`;
      try {
        await tryConn(host, port, user);
        const url = `postgresql://${user}:${encodeURIComponent(pass)}@${host}:${port}/postgres`;
        console.log("FOUND", region, port, prefix);
        console.log("DATABASE_URL=" + url);
        process.exit(0);
      } catch (e) {
        const msg = e.message || "";
        if (!msg.includes("tenant/user") && !msg.includes("ENOTFOUND") && !msg.includes("timeout")) {
          console.log("?", region, port, msg.split("\n")[0]);
        }
      }
    }
  }
}
console.log("NOT_FOUND");
process.exit(1);
