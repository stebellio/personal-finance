import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClosuresListComponent } from './closures-list/closures-list.component';

const routes: Routes = [{ path: '', component: ClosuresListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClosuresRoutingModule {}
