import { Component, OnInit } from '@angular/core';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { PropertyService } from '../../core/services/property.service';
import { Property, PropertyType } from '../../core/models/property.model';

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
    currentValue: number;
    purchasePrice: number | null;
    purchaseDate: string;
    surface: number | null;
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

  constructor(private readonly propertyService: PropertyService) {}

  ngOnInit(): void {
    this.loadProperties();
  }

  trackById(_: number, property: Property): number {
    return property.id;
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
      currentValue: property.currentValue,
      purchasePrice: property.purchasePrice ?? null,
      purchaseDate: property.purchaseDate ? property.purchaseDate.slice(0, 10) : '',
      surface: property.surface ?? null,
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
    if (this.modalMode === 'create') {
      this.submitCreate(name);
    } else {
      this.submitEdit(name);
    }
  }

  private submitCreate(name: string): void {
    this.saving = true;
    this.saveError = null;
    this.propertyService
      .createProperty({
        name,
        type: this.formData.type,
        currentValue: this.formData.currentValue,
        purchasePrice: this.formData.purchasePrice ?? undefined,
        purchaseDate: this.formData.purchaseDate || undefined,
        surface: this.formData.surface ?? undefined,
        address: this.formData.address.trim() || undefined,
        description: this.formData.description.trim() || undefined,
      })
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
      .updateProperty(this.editingPropertyId!, {
        name,
        type: this.formData.type,
        currentValue: this.formData.currentValue,
        purchasePrice: this.formData.purchasePrice ?? undefined,
        purchaseDate: this.formData.purchaseDate || undefined,
        surface: this.formData.surface ?? undefined,
        address: this.formData.address.trim() || undefined,
        description: this.formData.description.trim() || undefined,
      })
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
      currentValue: 0,
      purchasePrice: null as number | null,
      purchaseDate: '',
      surface: null as number | null,
      address: '',
      description: '',
    };
  }
}
