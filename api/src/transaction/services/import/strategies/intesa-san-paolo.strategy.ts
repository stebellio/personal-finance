import { Injectable } from "@nestjs/common";
import { ImportStrategy } from "./importStrategy.interface";
import { NormalizedTransaction } from "../models/normalized-transaction.model";

@Injectable()
export class IntesaSanPaoloImportStrategy implements ImportStrategy {
  readonly providerType = "intesa-san-paolo";

  parse(records: Record<string, string>[]): NormalizedTransaction[] {
    return records.map((r) => {
      const date = this.parseDate(r["Data"]);
      const amount = this.parseItalianAmount(r["Importo"]);

      const noteParts: string[] = [];
      const dettagli = r["Dettagli"];
      if (dettagli) {
        noteParts.push(dettagli);
      }

      return new NormalizedTransaction(
        date,
        r["Operazione"],
        amount,
        (r["Categoria "] ?? "").trim() || undefined,
        noteParts.length > 0 ? noteParts.join(" | ") : undefined,
      );
    });
  }

  private parseDate(dateStr: string): Date {
    const [month, day, year] = dateStr.split("/").map(Number);
    const fullYear = 2000 + year;
    return new Date(fullYear, month - 1, day);
  }

  private parseItalianAmount(value: string): number {
    const normalized = value.replace(/\./g, "").replace(",", ".");
    return parseFloat(normalized);
  }
}
