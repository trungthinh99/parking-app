const fs = require('fs')
const path = require('path')

const BACKEND_CONTRACTS_DIR = path.join(__dirname, '../../parking-api/src/shared/contracts')
const BACKEND_VALIDATION_DIR = path.join(__dirname, '../../parking-api/src/shared/validation')
const TARGET_DIR = path.join(__dirname, '../src/api-contracts')

function syncDir(sourceDir, label) {
  if (!fs.existsSync(sourceDir)) return []
  const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.ts'))
  for (const file of files) {
    const sourcePath = path.join(sourceDir, file)
    const targetPath = path.join(TARGET_DIR, file)
    let content = fs.readFileSync(sourcePath, 'utf-8')

    content = content.replace(/@\/shared\/contracts/g, '.')

    const header = `/**\n * AUTO-GENERATED FILE - DO NOT EDIT\n *\n * Source: parking-api/src/shared/${label}/${file}\n * Generated at: ${new Date().toISOString()}\n *\n * To regenerate, run: npm run sync:contracts\n */\n\n`

    fs.writeFileSync(targetPath, header + content, 'utf-8')
  }
  return files
}

function main() {
  if (!fs.existsSync(BACKEND_CONTRACTS_DIR)) {
    console.error(`Backend contracts directory not found: ${BACKEND_CONTRACTS_DIR}`)
    process.exit(1)
  }

  fs.mkdirSync(TARGET_DIR, { recursive: true })

  const contractFiles = syncDir(BACKEND_CONTRACTS_DIR, 'contracts')
  const validationFiles = syncDir(BACKEND_VALIDATION_DIR, 'validation')
  const allFiles = [...contractFiles, ...validationFiles]

  if (allFiles.length === 0) {
    console.warn('No contract files found in backend directories.')
    process.exit(0)
  }

  // Add validation re-exports to index
  if (validationFiles.length > 0) {
    const indexPath = path.join(TARGET_DIR, 'index.ts')
    let indexContent = fs.readFileSync(indexPath, 'utf-8')
    for (const file of validationFiles) {
      const moduleName = file.replace('.ts', '')
      const exportLine = `export * from './${moduleName}';`
      if (!indexContent.includes(exportLine)) {
        indexContent += `\n// Validation\n${exportLine}\n`
      }
    }
    fs.writeFileSync(indexPath, indexContent, 'utf-8')
  }

  const versionContent = `export const API_CONTRACTS_VERSION = {\n  syncedAt: '${new Date().toISOString()}',\n  files: ${JSON.stringify(allFiles, null, 2)},\n}\n`
  fs.writeFileSync(path.join(TARGET_DIR, 'version.ts'), versionContent)
}

main()

