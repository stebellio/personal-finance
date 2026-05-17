import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Property, PropertySummary } from '../models/property.model';
import { PropertyType } from '../models/property.model';

export interface CreatePropertyPayload {
  name: string;
  type?: PropertyType;
  address?: string;
  surface?: number;
  purchasePrice?: number;
  purchaseDate?: string;
  currentValue?: number;
  currency?: string;
  description?: string;
}

export interface UpdatePropertyPayload {
  name?: string;
  type?: PropertyType;
  address?: string;
  surface?: number;
  purchasePrice?: number;
  purchaseDate?: string;
  currentValue?: number;
  currency?: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class PropertyService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProperties(): Observable<Property[]> {
    return this.http.get<Property[]>(`${this.apiUrl}/properties`);
  }

  createProperty(payload: CreatePropertyPayload): Observable<number> {
    return this.http.post<number>(`${this.apiUrl}/properties`, payload);
  }

  updateProperty(id: number, payload: UpdatePropertyPayload): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/properties/${id}`, payload);
  }

  deleteProperty(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/properties/${id}`);
  }

  getSummary(): Observable<PropertySummary> {
    return this.http.get<PropertySummary>(`${this.apiUrl}/properties/summary`);
  }
}
