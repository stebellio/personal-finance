export class NormalizedTransaction {
  constructor(
    readonly date: Date,
    readonly description: string,
    readonly amount: number,
    readonly categoryName?: string,
    readonly note?: string,
  ) {}
}
