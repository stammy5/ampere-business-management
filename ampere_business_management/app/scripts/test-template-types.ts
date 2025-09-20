

import dotenv from "dotenv"
import { TemplateType } from "@prisma/client"

// Load environment variables
dotenv.config()

// Test template type values
console.log('Available TemplateType values:')
Object.values(TemplateType).forEach(type => {
  console.log(`- ${type}`)
})

console.log('\nTesting specific template types:')
console.log(`SITE_SAFETY_PLAN: ${Object.values(TemplateType).includes('SITE_SAFETY_PLAN' as TemplateType)}`)
console.log(`RISK_ASSESSMENT: ${Object.values(TemplateType).includes('RISK_ASSESSMENT' as TemplateType)}`)
console.log(`WORK_METHOD_STATEMENT: ${Object.values(TemplateType).includes('WORK_METHOD_STATEMENT' as TemplateType)}`)

