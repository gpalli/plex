import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
    selector: 'plex-validation-messages',
    template: `<div class="help-block" *ngIf="control.errors && control.errors.required">
                    <span>Valor requerido</span>
               </div>
               <div class="help-block" *ngIf="control.errors && control.errors.min">
                    <span>Valor no permitido</span>
               </div>
               <div class="help-block" *ngIf="control.errors && control.errors.max">
                    <span>Valor no permitido</span>
               </div>
               <div class="help-block" *ngIf="control.errors && control.errors.minlength">
                    <span>Debe ingresar un mínimo de {{control.errors.minlength.requiredLength}} caracteres</span>
               </div>
               <div class="help-block" *ngIf="control.errors && control.errors.format">
                    <span>Formato incorrecto</span>
               </div>
               `
})
export class ValidationMessagesComponent {
    @Input() control: FormControl;

    constructor() { }
}
