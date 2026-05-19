import { Component, OnInit } from '@angular/core';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { PropertyService } from '../../core/services/property.service';
import {
  Property,
  PropertyCategory,
  PropertyState,
  PropertyType,
} from '../../core/models/property.model';

@Component({
  selector: 'app-properties-list',
  templateUrl: './properties-list.component.html',
  styleUrls: ['./properties-list.component.less'],
})
export class PropertiesListComponent implements OnInit {
  properties: Property[] = [];
  loading = true;
  error: string | null = null;

  isModalOpen = false;
  modalMode: 'create' | 'edit' = 'create';
  editingPropertyId: number | null = null;

  formData: {
    name: string;
    type: PropertyType;
    category: PropertyCategory | '';
    state: PropertyState | '';
    currentValue: number;
    surface: number | null;
    cadastralSheet: string;
    cadastralParcel: string;
    cadastralSubaltern: string;
    address: string;
    description: string;
  } = this.emptyForm();

  saving = false;
  saveError: string | null = null;

  deleteConfirmProperty: Property | null = null;
  deleting = false;
  deleteError: string | null = null;

  readonly propertyTypes: { value: PropertyType; label: string }[] = [
    { value: 'building', label: 'Immobile' },
    { value: 'land', label: 'Terreno' },
  ];

  readonly propertyCategories: { value: PropertyCategory; label: string }[] = [
    { value: 'apartment', label: 'Appartamento' },
    { value: 'garage', label: 'Garage' },
    { value: 'office', label: 'Ufficio' },
    { value: 'commercial', label: 'Locale commerciale' },
    { value: 'villa', label: 'Villetta' },
    { value: 'rural_house', label: 'Casa rurale' },
    { value: 'storage', label: 'Deposito' },
  ];

  readonly propertyStates: { value: PropertyState; label: string }[] = [
    { value: 'free', label: 'Libero' },
    { value: 'family_use', label: 'Uso familiare' },
    { value: 'rented', label: 'Locato' },
  ];

  constructor(private readonly propertyService: PropertyService) {}

  ngOnInit(): void {
    this.loadProperties();
  }

  trackById(_: number, property: Property): number {
    return property.id;
  }

  categoryLabel(value?: PropertyCategory): string | null {
    return this.propertyCategories.find(c => c.value === value)?.label ?? null;
  }

  stateLabel(value?: PropertyState): string | null {
    return this.propertyStates.find(s => s.value === value)?.label ?? null;
  }

  openCreateModal(): void {
    this.formData = this.emptyForm();
    this.saveError = null;
    this.modalMode = 'create';
    this.editingPropertyId = null;
    this.isModalOpen = true;
  }

  openEditModal(property: Property): void {
    this.formData = {
      name: property.name,
      type: property.type,
      category: property.category ?? '',
      state: property.state ?? '',
      currentValue: property.currentValue,
      surface: property.surface ?? null,
      cadastralSheet: property.cadastralSheet ?? '',
      cadastralParcel: property.cadastralParcel ?? '',
      cadastralSubaltern: property.cadastralSubaltern ?? '',
      address: property.address ?? '',
      description: property.description ?? '',
    };
    this.saveError = null;
    this.modalMode = 'edit';
    this.editingPropertyId = property.id;
    this.isModalOpen = true;
  }

  closeModal(): void {
    if (this.saving) return;
    this.isModalOpen = false;
  }

  openDeleteConfirm(property: Property): void {
    this.deleteConfirmProperty = property;
    this.deleteError = null;
  }

  closeDeleteConfirm(): void {
    if (this.deleting) return;
    this.deleteConfirmProperty = null;
  }

  confirmDelete(): void {
    if (!this.deleteConfirmProperty) return;
    this.deleting = true;
    this.deleteError = null;
    this.propertyService
      .deleteProperty(this.deleteConfirmProperty.id)
      .pipe(finalize(() => (this.deleting = false)))
      .subscribe({
        next: () => {
          this.deleteConfirmProperty = null;
          this.loadProperties();
        },
        error: () => {
          this.deleteError = 'Impossibile eliminare l\'immobile. Riprova più tardi.';
        },
      });
  }

  submitForm(): void {
    const name = this.formData.name.trim();
    if (!name) {
      this.saveError = 'Il nome è obbligatorio.';
      return;
    }
    const currentValue = this.formData.currentValue;
    if (currentValue === undefined || isNaN(currentValue) || currentValue <= 0) {
      this.saveError = 'Il valore attuale deve essere maggiore di zero.';
      return;
    }
    if (this.formData.type === 'building' && !this.formData.category) {
      this.saveError = 'La categoria è obbligatoria per gli immobili.';
      return;
    }
    if (this.modalMode === 'create') {
      this.submitCreate(name);
    } else {
      this.submitEdit(name);
    }
  }

  private buildPayload(name: string) {
    const isLand = this.formData.type === 'land';
    return {
      name,
      type: this.formData.type,
      category: isLand ? undefined : this.formData.category || undefined,
      state: this.formData.state || undefined,
      currentValue: this.formData.currentValue,
      surface: this.formData.surface ?? undefined,
      cadastralSheet: this.formData.cadastralSheet.trim() || undefined,
      cadastralParcel: this.formData.cadastralParcel.trim() || undefined,
      cadastralSubaltern: isLand
        ? undefined
        : this.formData.cadastralSubaltern.trim() || undefined,
      address: this.formData.address.trim() || undefined,
      description: this.formData.description.trim() || undefined,
    };
  }

  private submitCreate(name: string): void {
    this.saving = true;
    this.saveError = null;
    this.propertyService
      .createProperty(this.buildPayload(name))
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.isModalOpen = false;
          this.loadProperties();
        },
        error: () => {
          this.saveError = 'Impossibile creare l\'immobile. Riprova più tardi.';
        },
      });
  }

  private submitEdit(name: string): void {
    this.saving = true;
    this.saveError = null;
    this.propertyService
      .updateProperty(this.editingPropertyId!, this.buildPayload(name))
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.isModalOpen = false;
          this.loadProperties();
        },
        error: () => {
          this.saveError = 'Impossibile modificare l\'immobile. Riprova più tardi.';
        },
      });
  }

  private loadProperties(): void {
    this.loading = true;
    this.error = null;
    this.propertyService
      .getProperties()
      .pipe(
        catchError(() => {
          this.error = 'Impossibile caricare gli immobili. Riprova più tardi.';
          return of<Property[]>([]);
        }),
        finalize(() => (this.loading = false)),
      )
      .subscribe(properties => (this.properties = properties));
  }

  private emptyForm() {
    return {
      name: '',
      type: 'building' as PropertyType,
      category: '' as PropertyCategory | '',
      state: '' as PropertyState | '',
      currentValue: 0,
      surface: null as number | null,
      cadastralSheet: '',
      cadastralParcel: '',
      cadastralSubaltern: '',
      address: '',
      description: '',
    };
  }
}
