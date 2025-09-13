const { ensureRetention } = require('../gdrive-upload')

async function run(){
  const files = []
  // 120 old files
  for(let i=0; i<120; i++){
    files.push({ id: String(i), createdTime: new Date(Date.now() - 10*86400000).toISOString() })
  }
  // 30 recent files
  for(let i=120; i<150; i++){
    files.push({ id: String(i), createdTime: new Date().toISOString() })
  }

  const deleted = []
  const fakeDrive = {
    files: {
      list: async ({ pageToken }) => {
        const start = pageToken ? Number(pageToken) : 0
        const pageSize = 100
        const pageFiles = files.slice(start, start + pageSize)
        const nextPageToken = start + pageSize < files.length ? String(start + pageSize) : undefined
        return { data: { files: pageFiles, nextPageToken } }
      },
      delete: async ({ fileId }) => {
        deleted.push(fileId)
      }
    }
  }

  await ensureRetention(fakeDrive, 'folder', 7)

  if(deleted.length !== 120){
    throw new Error(`Expected 120 deletions, got ${deleted.length}`)
  }

  console.log('deleted count', deleted.length)
}

run().catch(e => {
  console.error(e)
  process.exit(1)
})
