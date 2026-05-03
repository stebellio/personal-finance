import {Injectable} from "@angular/core";
import {environment} from "../../../../environments/environment";
import {HttpClient, HttpParams} from "@angular/common/http";
import {Period} from "../enum/period.enum";
import {Observable} from "rxjs";
import {NetWorthPoint} from "../models/netWorthPoint.model";

@Injectable({ providedIn: 'root' })
export class AnalyticService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    getNetWorthHistory(period: Period): Observable<NetWorthPoint[]> {
        const params = new HttpParams().set('period', period);
        return this.http.get<NetWorthPoint[]>(`${this.apiUrl}/analytics/net-worth-history`, {params});
    }
}