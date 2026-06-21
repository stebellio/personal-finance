import { Injectable } from "@nestjs/common";
import { ImportStrategy } from "./importStrategy.interface";
import { NormalizedTransaction } from "../models/normalized-transaction.model";

@Injectable()
export class RevolutImportStrategy implements ImportStrategy {
  readonly providerType = "revolut";

  parse(records: Record<string, string>[]): NormalizedTransaction[] {
    return records.map((r) => {
      const amount = parseFloat(r["Importo"]);
      const fee = parseFloat(r["Costo"] ?? "0");

      const noteParts: string[] = [];
      if (fee > 0) {
        noteParts.push(`Costo: ${fee.toFixed(2)} EUR`);
      }

      return new NormalizedTransaction(
        new Date(r["Data di completamento"]),
        r["Descrizione"],
        amount,
        undefined,
        noteParts.length > 0 ? noteParts.join(" | ") : undefined,
      );
    });
  }
}
