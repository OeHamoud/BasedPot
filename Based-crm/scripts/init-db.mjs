import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgres://based:based@localhost:5432/basedcrm" });
const schema = `
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS companies (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  phone TEXT,
  city TEXT,
  country TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS contacts (
  id BIGSERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  job_title TEXT,
  status TEXT NOT NULL DEFAULT 'lead',
  company_id BIGINT REFERENCES companies(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS deals (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  value NUMERIC(14,2) NOT NULL DEFAULT 0,
  stage TEXT NOT NULL DEFAULT 'lead',
  company_id BIGINT REFERENCES companies(id) ON DELETE SET NULL,
  contact_id BIGINT REFERENCES contacts(id) ON DELETE SET NULL,
  expected_close DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS activities (
  id BIGSERIAL PRIMARY KEY,
  kind TEXT NOT NULL DEFAULT 'note',
  subject TEXT NOT NULL,
  body TEXT,
  contact_id BIGINT REFERENCES contacts(id) ON DELETE SET NULL,
  deal_id BIGINT REFERENCES deals(id) ON DELETE SET NULL,
  author_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;
async function main() {
  await pool.query(schema);
  const { rows } = await pool.query("SELECT count(*)::int AS n FROM users");
  if (rows[0].n > 0) { console.log("Schema ready; users exist, skipping seed."); await pool.end(); return; }
  const bcrypt = (await import("bcryptjs")).default;
  const hash = await bcrypt.hash("based123", 10);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const user = await client.query("INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id", ["Ava Bennett", "admin@basedcrm.com", hash]);
    const userId = user.rows[0].id;
    const companies = [
      ["Northwind Traders", "Retail", "northwind.example.com", "+1 212 555 0101", "New York", "USA", "Largest distributor of gourmet foods."],
      ["Acme Corp", "Manufacturing", "acme.example.com", "+1 415 555 0199", "San Francisco", "USA", "Industrial supplies and hardware."],
      ["Globex", "Technology", "globex.example.com", "+44 20 7946 0958", "London", "UK", "Cloud infrastructure and DevOps tools."],
      ["Initech", "Software", "initech.example.com", "+1 312 555 0142", "Chicago", "USA", "Office productivity software."],
      ["Umbrella Labs", "Biotech", "umbrella.example.com", "+1 858 555 0137", "San Diego", "USA", "Life sciences research equipment."],
      ["Stark Industries", "Energy", "stark.example.com", "+1 310 555 0114", "Los Angeles", "USA", "Clean energy and advanced power systems."],
    ];
    const companyIds = [];
    for (const c of companies) { const r = await client.query("INSERT INTO companies (name, industry, website, phone, city, country, notes) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id", c); companyIds.push(r.rows[0].id); }
    const contacts = [
      ["Dana", "Ross", "dana.ross@northwind.example.com", "+1 212 555 0102", "VP Procurement", "customer", companyIds[0], "Primary contact for annual contract renewal."],
      ["Marcus", "Lee", "marcus.lee@acme.example.com", "+1 415 555 0100", "Operations Manager", "lead", companyIds[1], "Interested in the enterprise tier."],
      ["Priya", "Sharma", "priya.sharma@globex.example.com", "+44 20 7946 0959", "Head of Platform", "customer", companyIds[2], "Champion for the migration project."],
      ["Tom", "Smykowski", "tom.s@initech.example.com", "+1 312 555 0143", "IT Director", "lead", companyIds[3], "Evaluating for Q4 budget."],
      ["Alice", "Grant", "alice.grant@umbrella.example.com", "+1 858 555 0138", "Lab Manager", "lead", companyIds[4], "Needs custom quote for 3 units."],
      ["Pepper", "Potts", "pepper.potts@stark.example.com", "+1 310 555 0115", "COO", "customer", companyIds[5], "Executive sponsor."],
      ["James", "Rhodes", "james.rhodes@stark.example.com", "+1 310 555 0116", "Facilities Lead", "lead", companyIds[5], "Follow up after site visit."],
    ];
    const contactIds = [];
    for (const c of contacts) { const r = await client.query("INSERT INTO contacts (first_name, last_name, email, phone, job_title, status, company_id, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id", c); contactIds.push(r.rows[0].id); }
    const deals = [
      ["Annual gourmet distribution", 124000, "negotiation", companyIds[0], contactIds[0], "2026-09-30", "Renewal; pricing locked at 2025 rates."],
      ["Enterprise hardware rollout", 48500, "proposal", companyIds[1], contactIds[1], "2026-10-15", "Waiting on legal review."],
      ["Cloud migration project", 210000, "negotiation", companyIds[2], contactIds[2], "2026-09-01", "Champion confirmed; security team pending."],
      ["Q4 software seats", 36000, "qualified", companyIds[3], contactIds[3], "2026-12-01", "Budget request submitted."],
      ["Lab equipment package", 92000, "lead", companyIds[4], contactIds[4], "2026-11-15", "Sent custom quote."],
      ["Energy monitoring pilot", 15800, "won", companyIds[5], contactIds[5], "2026-08-05", "Signed. Kickoff booked."],
      ["Warehouse sensor rollout", 64000, "lost", companyIds[5], contactIds[6], "2026-07-20", "Lost to competitor on price."],
      ["Mobile app for field ops", 73000, "proposal", companyIds[5], contactIds[6], "2026-10-30", "Technical fit confirmed."],
    ];
    const dealIds = [];
    for (const d of deals) { const r = await client.query("INSERT INTO deals (title, value, stage, company_id, contact_id, expected_close, notes) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id", d); dealIds.push(r.rows[0].id); }
    const activities = [
      ["call", "Renewal call with Dana Ross", "Discussed new pricing tiers; she wants a 2-year term.", contactIds[0], dealIds[0], userId],
      ["email", "Sent migration proposal v2", "Incorporated security feedback from Globex.", contactIds[2], dealIds[2], userId],
      ["meeting", "Site visit at Umbrella Labs", "Walked the lab floor; 3 units needed by Q1.", contactIds[4], dealIds[4], userId],
      ["note", "Acme legal review", "Legal flagged indemnification clause; looping in counsel.", contactIds[1], dealIds[1], userId],
      ["email", "Follow-up with James Rhodes", "Shared warehouse case study after the pilot win.", contactIds[6], dealIds[7], userId],
    ];
    for (const a of activities) { await client.query("INSERT INTO activities (kind, subject, body, contact_id, deal_id, author_id) VALUES ($1,$2,$3,$4,$5,$6)", a); }
    await client.query("COMMIT");
    console.log("Database seeded: 1 user, 6 companies, 7 contacts, 8 deals, 5 activities.");
    console.log("Login -> admin@basedcrm.com / based123");
  } catch (e) { await client.query("ROLLBACK"); throw e; } finally { client.release(); await pool.end(); }
}
main().catch((e) => { console.error(e); process.exit(1); });
