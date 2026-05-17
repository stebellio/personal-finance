import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertiesRoutingModule } from './properties-routing.module';
import { PropertiesListComponent } from './properties-list/properties-list.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [PropertiesListComponent],
  imports: [CommonModule, FormsModule, PropertiesRoutingModule, SharedModule],
})
export class PropertiesModule {}
