import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ShellComponent } from './shell/shell.component';
import { SidebarComponent } from './sidebar/sidebar.component';

@NgModule({
  declarations: [ShellComponent, SidebarComponent],
  imports: [CommonModule, RouterModule],
  exports: [ShellComponent, SidebarComponent],
})
export class LayoutModule {}
