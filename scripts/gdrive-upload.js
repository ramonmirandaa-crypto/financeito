#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { google } = require('googleapis')

function getAuth(){
  const jsonB64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64
  if(!jsonB64) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 não definido')
  const creds = JSON.parse(Buffer.from(jsonB64, 'base64').toString('utf8'))
  const jwt = new google.auth.JWT(creds.client_email, null, creds.private_key, [
    'https://www.googleapis.com/auth/drive.file'
  ])
  return jwt
}

async function ensureRetention(drive, folderId, days){
  if(!days) return
  const cutoff = Date.now() - (Number(days) * 86400000)
  const res = await drive.files.list({ q: `'${folderId}' in parents and trashed=false`, fields:'files(id, name, createdTime)' })
  for(const f of res.data.files){
    if(new Date(f.createdTime).getTime() < cutoff){
      await drive.files.delete({ fileId: f.id })
    }
  }
}

async function exportJson(dir){
  const { Client } = require('pg')
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  fs.mkdirSync(dir, { recursive: true })
  const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'")
  for(const { table_name } of tables.rows){
    const res = await client.query(`SELECT * FROM "${table_name}"`)
    const jsonPath = path.join(dir, `${table_name}.json`)
    fs.writeFileSync(jsonPath, JSON.stringify(res.rows, null, 2))
    const columns = res.fields.map(f=>f.name)
    const lines = [columns.join(',')]
    for(const row of res.rows){
      lines.push(columns.map(c=>JSON.stringify(row[c] ?? '')).join(','))
    }
    const csvPath = path.join(dir, `${table_name}.csv`)
    fs.writeFileSync(csvPath, lines.join('\n'))
    console.log(`Exported ${table_name} (${res.rowCount} rows)`)    
  }
  await client.end()
}

async function main(){
  const args = require('minimist')(process.argv.slice(2))
  if(args['export-json']){
    await exportJson(args['export-json'])
  }

  if(args['skip-upload']) return

  const auth = getAuth()
  const drive = google.drive({ version: 'v3', auth })

  const file = args.file
  const folderId = process.env.GDRIVE_BACKUP_FOLDER_ID
  if(!file || !folderId) throw new Error('Parâmetros ausentes: --file e GDRIVE_BACKUP_FOLDER_ID')

  const res = await drive.files.create({
    requestBody: { name: path.basename(file), parents: [folderId] },
    media: { body: fs.createReadStream(file) }
  })

  await ensureRetention(drive, folderId, process.env.BACKUP_RETENTION_DAYS)
  console.log('Upload concluído:', res.data.id)
}

main().catch(e=>{ console.error(e); process.exit(1) })
