import {Account} from "../models/account.model";

export class AccountPresenter {
    id: number;
    name: string;
    description?: string;

    constructor(id: number, name: string, description: string) {
        this.id = id;
        this.name = name;
        this.description = description;
    }

    static fromModel(account: Account): AccountPresenter {
        return new AccountPresenter(
            account.id,
            account.name,
            account.description ?? ''
        )
    }
}