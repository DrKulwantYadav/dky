import { readSheet } from "read-excel-file/node";

export type ImportedPatient = { name: string; phone: string };

const nameHeaders = new Set(["name", "full name", "patient name", "patient"]);
const phoneHeaders = new Set(["phone", "phone number", "mobile", "mobile number", "contact", "contact number", "number"]);

function normalizeHeader(value: unknown) {
  return String(value ?? "").replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function normalizePhone(value: unknown) {
  let digits = String(value ?? "").replace(/\.0$/, "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [], value = "", quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') { value += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else value += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") { row.push(value); value = ""; }
    else if (character === "\n") { row.push(value); rows.push(row); row = []; value = ""; }
    else if (character !== "\r") value += character;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  return rows;
}

export async function parseRegistrationFile(file: File) {
  const extension = file.name.toLowerCase().split(".").pop();
  let rows: unknown[][];
  if (extension === "csv") rows = parseCsv(await file.text());
  else if (extension === "xlsx") rows = await readSheet(Buffer.from(await file.arrayBuffer()));
  else throw new Error("Use a CSV or Excel .xlsx file.");

  const populatedRows = rows.filter((row) => row.some((cell) => String(cell ?? "").trim()));
  if (populatedRows.length < 2) throw new Error("The file must contain a header row and at least one patient.");
  if (populatedRows.length > 501) throw new Error("A maximum of 500 patients can be imported at once.");

  const headers = populatedRows[0].map(normalizeHeader);
  const nameIndex = headers.findIndex((header) => nameHeaders.has(header));
  const phoneIndex = headers.findIndex((header) => phoneHeaders.has(header));
  if (nameIndex < 0 || phoneIndex < 0) throw new Error('The first row must contain "Name" and "Phone" or "Mobile" columns.');

  const patients: ImportedPatient[] = [], errors: string[] = [], seen = new Set<string>();
  populatedRows.slice(1).forEach((row, rowIndex) => {
    const name = String(row[nameIndex] ?? "").trim().replace(/\s+/g, " ");
    const phone = normalizePhone(row[phoneIndex]);
    const line = rowIndex + 2;
    if (name.length < 2) errors.push(`Row ${line}: name must contain at least 2 characters.`);
    else if (name.length > 80) errors.push(`Row ${line}: name must be 80 characters or fewer.`);
    else if (!/^[6-9]\d{9}$/.test(phone)) errors.push(`Row ${line}: enter a valid 10-digit Indian mobile number.`);
    else if (seen.has(phone)) errors.push(`Row ${line}: duplicate mobile number in this file.`);
    else { seen.add(phone); patients.push({ name, phone }); }
  });

  if (errors.length) throw new Error(errors.slice(0, 8).join(" ") + (errors.length > 8 ? ` ${errors.length - 8} more errors.` : ""));
  return patients;
}
