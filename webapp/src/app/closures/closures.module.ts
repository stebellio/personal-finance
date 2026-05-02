import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClosuresRoutingModule } from './closures-routing.module';
import { ClosuresListComponent } from './closures-list/closures-list.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [ClosuresListComponent],
  imports: [CommonModule, FormsModule, ClosuresRoutingModule, SharedModule],
})
export class ClosuresModule {}
