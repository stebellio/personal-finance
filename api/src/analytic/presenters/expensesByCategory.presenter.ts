export class ExpensesByCategoryPresenter {
  categoryCode: string;
  categoryDescription: string;
  total: number;

  constructor(
    categoryCode: string,
    categoryDescription: string,
    total: number,
  ) {
    this.categoryCode = categoryCode;
    this.categoryDescription = categoryDescription;
    this.total = total;
  }

  static fromModel(model: {
    categoryCode: string;
    categoryDescription: string;
    total: number;
  }): ExpensesByCategoryPresenter {
    return new ExpensesByCategoryPresenter(
      model.categoryCode,
      model.categoryDescription,
      model.total,
    );
  }
}
