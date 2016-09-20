import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';

import { WidgetComponent } from './widget.component';

@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
  ],
  declarations: [
    WidgetComponent
  ],
  exports: [
    WidgetComponent,
  ],
})
export class MyModule {};
