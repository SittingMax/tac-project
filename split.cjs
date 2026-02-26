const fs = require('fs');
const p = 'c:/logi/tac-portal/lib/';
let c = fs.readFileSync(p + 'pdf-generator.ts', 'utf8');

if (!fs.existsSync(p + 'pdf')) fs.mkdirSync(p + 'pdf');

const lStart = c.indexOf('export async function generateShipmentLabel');
const eStart = c.indexOf('export async function generateEnterpriseInvoice');

let shared = c.substring(0, lStart);
let label = c.substring(lStart, eStart);
let inv = c.substring(eStart);

// shared: add imports
shared = shared.replace(/import \{.*?\} from '\.\.\/types';/, "import { Shipment, Invoice, LabelData } from '../types';\nimport { COMPANY_INFO, BANK_DETAILS } from '../../config/constants';");

// imports for split files
const sImp = `import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { C, ICON_PATHS, EnterpriseTheme, generate1DBarcode, generate2DBarcode, renderTransportIconPng } from './pdf-utils';
import { Shipment, Invoice, LabelData } from '../types';
import { COMPANY_INFO, BANK_DETAILS } from '../../config/constants';\n\n`;

fs.writeFileSync(p + 'pdf/pdf-utils.ts', shared);
fs.writeFileSync(p + 'pdf/label-generator.ts', sImp + label);

// invoice: replace hardcoded values
inv = inv.replace(/'Bank: HDFC Bank'/g, '`Bank: ${BANK_DETAILS.bankName}`');
inv = inv.replace(/'Acct: Tapan Associate Cargo'/g, '`Acct: ${BANK_DETAILS.accountName}`');
inv = inv.replace(/'No: \*\*\*\* \*\*\*\* 9876'/g, '`No: ${BANK_DETAILS.accountNumber}`');
inv = inv.replace(/'© \d{4} TAC Logistics\.'/g, '`© ${new Date().getFullYear()} ${COMPANY_INFO.shortName}.`');

fs.writeFileSync(p + 'pdf/invoice-generator.ts', sImp + inv);

// Barrel file
fs.writeFileSync(p + 'pdf-generator.ts', `export * from './pdf/label-generator';\nexport * from './pdf/invoice-generator';\nexport * from './pdf/pdf-utils';\n`);

console.log('Split completed');
