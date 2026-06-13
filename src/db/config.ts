import { Client } from 'pg';
import AWS from 'aws-sdk';
AWS.config.update({ region: 'us-east-1' });

async function main(): Promise<void> {
  let password: string = 'Admin123123';
  

  const client = new Client({
    host: 'pms-db-dev.ccv8qqak27m7.us-east-1.rds.amazonaws.com',
    port: 5432,
    database: 'postgres',
    user: 'pms_admin',
    password,
    ssl: { rejectUnauthorized: false, ca: require('fs').readFileSync('src/db/global-bundle.pem').toString() }
  });

  try {
    await client.connect();
    const res = await client.query('SELECT version()');
    console.log(res.rows[0].version);
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  } finally {
    await client.end();
  }
}
main().catch(console.error);