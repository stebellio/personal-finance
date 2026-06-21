import { NormalizedTransaction } from "../models/normalized-transaction.model";

export interface ImportStrategy {
  readonly providerType: string;

  parse(records: Record<string, string>[]): NormalizedTransaction[];
}
