/**
 * Just enough CSV for a calling list.
 *
 * Handles what spreadsheets actually export: a byte-order mark, CRLF line ends,
 * quoted cells with commas or doubled quotes inside, and `;` as the separator
 * (Excel's default wherever the decimal mark is a comma).
 */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, '');
  const firstLine = src.slice(0, src.search(/\r?\n|$/));
  const sep = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === sep) {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some(Boolean));
}

export interface CsvPerson {
  /** Line in the file, counting the header, so a skipped row can be found. */
  line: number;
  name?: string;
  phone: string;
}

const PHONE_HEADER = /phone|mobile|number|contact|tel|whatsapp/i;
const NAME_HEADER = /name/i;
const looksLikePhone = (cell: string) => (cell.match(/\d/g)?.length ?? 0) >= 7;

/**
 * Name and phone from each row.
 *
 * With a header row, columns are found by their titles ("Name", "Phone",
 * "Mobile number", "First name" + "Last name"…). Without one, the first cell
 * with seven or more digits is the phone and the first other cell is the name,
 * so a two-column file works in either order.
 */
export function peopleFromCsv(rows: string[][]): { people: CsvPerson[]; skipped: number[] } {
  const header = rows[0] ?? [];
  const phoneCol = header.findIndex((h) => PHONE_HEADER.test(h) && !looksLikePhone(h));
  const hasHeader = phoneCol >= 0 || header.some((h) => NAME_HEADER.test(h));

  const first = header.findIndex((h) => /first/i.test(h) && NAME_HEADER.test(h));
  const last = header.findIndex((h) => /last|sur/i.test(h) && NAME_HEADER.test(h));
  const nameCol = header.findIndex((h) => NAME_HEADER.test(h));

  const people: CsvPerson[] = [];
  const skipped: number[] = [];

  rows.slice(hasHeader ? 1 : 0).forEach((cells, i) => {
    const line = i + (hasHeader ? 2 : 1);
    let phone: string | undefined;
    let name: string | undefined;

    if (hasHeader) {
      phone = phoneCol >= 0 ? cells[phoneCol] : cells.find(looksLikePhone);
      name =
        first >= 0 || last >= 0
          ? [cells[first], cells[last]].filter(Boolean).join(' ')
          : nameCol >= 0
            ? cells[nameCol]
            : undefined;
    } else {
      const at = cells.findIndex(looksLikePhone);
      phone = at >= 0 ? cells[at] : undefined;
      name = cells.find((c, j) => j !== at && c);
    }

    if (!phone) skipped.push(line);
    else people.push({ line, phone, name: name || undefined });
  });

  return { people, skipped };
}
