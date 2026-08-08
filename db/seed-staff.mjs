import { readFileSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'
import { hashPassword } from '../api/_lib/auth.js'

const sql = neon(process.env.DATABASE_URL)

async function run() {
  // migrations — the neon() HTTP driver runs one statement per call, so split
  // each DDL file into individual statements and run them in order.
  for (const file of ['002_staff.sql', '003_rename_roles.sql', '004_token_version.sql']) {
    const ddl = readFileSync(new URL(`./migrations/${file}`, import.meta.url), 'utf8')
    const statements = ddl.split(';').map((s) => s.trim()).filter(Boolean)
    for (const stmt of statements) {
      await sql.query(stmt)
    }
  }

  // Check for required env vars
  if (!process.env.OWNER_EMAIL || !process.env.OWNER_PASSWORD) {
    console.error('OWNER_EMAIL and OWNER_PASSWORD required')
    process.exit(1)
  }

  // Check if staff already exists
  const rows = await sql`select count(*)::int as n from staff`
  if (rows[0].n > 0) {
    console.log('staff already exist, skipping owner seed')
    return
  }

  // Hash password and insert the first administrator
  const hash = await hashPassword(process.env.OWNER_PASSWORD)
  await sql`insert into staff (name, job, email, role, password_hash) values ('Administrator', 'Pemilik', ${process.env.OWNER_EMAIL.toLowerCase()}, 'administrator', ${hash})`
  console.log('administrator seeded:', process.env.OWNER_EMAIL)
}

run().catch((e) => { console.error(e); process.exit(1) })
