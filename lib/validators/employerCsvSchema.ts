// lib/validators/employerCsvSchema.ts

import { z } from 'zod';

export const employerCsvSchema = z.object({
  legal_name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  mohre_id: z.string().optional(),
  bank_name: z.string().optional(),
  bank_code: z.string().optional(),
  company_iban: z.string().optional(),
  company_account_number: z.string().optional(),
  routing_code: z.string().optional(),
  wps_registered: z.boolean().optional(),
  wps_employer_id: z.string().optional(),
  salary_transfer_method: z.enum(['WPS', 'SWIFT', 'Local Transfer']).optional(),

  jurisdiction: z.string().optional(),
  emirate: z.string().optional(),
  city: z.string().optional(),
  address_line_1: z.string().optional(),
  address_line_2: z.string().optional(),
});

export const EMPLOYER_CSV_TEMPLATE = [
  "legal_name",
  "email",
  "phone",
  "mohre_id",
  "bank_name",
  "bank_code",
  "company_iban",
  "company_account_number",
  "routing_code",
  "wps_registered",
  "wps_employer_id",
  "salary_transfer_method",
  "jurisdiction",
  "emirate",
  "city",
  "address_line_1",
  "address_line_2"
];

export const EMPLOYER_EXAMPLE_ROW = {
  legal_name: "kounted Accounting Services Ltd",
  email: "support@kounted.ae",
  phone: "+971501234567",
  mohre_id: "MOHRE123",
  bank_name: "Emirates NBD",
  bank_code: "EBILAEAD",
  company_iban: "AE070331234567890123456",
  company_account_number: "1234567890123456",
  routing_code: "EBILAEAD",
  wps_registered: true,
  wps_employer_id: "WPS123456",
  salary_transfer_method: "WPS" as const,
  jurisdiction: "Dubai Mainland",
  emirate: "Dubai",
  city: "Dubai",
  address_line_1: "Office 501, ABC Tower",
  address_line_2: "Sheikh Zayed Road"
};
