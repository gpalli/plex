import {
    ViewChild, Component, OnInit, Input, AfterViewInit, Output, EventEmitter,
    forwardRef, ElementRef, Renderer, ContentChild, HostBinding, OnChanges
} from '@angular/core';
import {
    ControlValueAccessor, FormControl,
    NG_VALUE_ACCESSOR, NG_VALIDATORS, NgControl
} from '@angular/forms';
import { numberValidator, hasRequiredValidator } from '../core/validator.functions';

const REGEX = /^\s*(\-)?(\d*)\s*$/;

@Component({
    selector: 'plex-int',
    // Las siguientes líneas permiten acceder al atributo formControlName/ngModel
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => PlexIntComponent),
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => PlexIntComponent),
            multi: true
        },
    ],
    template: ` <div class="form-group" [ngClass]="{'has-danger': hasDanger() }">
                    <label *ngIf="label" class="form-control-label">{{label}}<span *ngIf="control.name && esOpcional" class="opcional"></span></label>
                    <div [ngClass]="{'input-group': prefix || suffix}">
                        <span *ngIf="prefix" class="input-group-addon" [innerHTML]="prefix"></span>
                        <input #ref type="text" class="form-control" [disabled]="disabled" [placeholder]="placeholder" [disabled]="disabled" [readonly]="readonly" (input)="onChange($event.target.value)" (change)="disabledEvent($event)">
                        <span *ngIf="suffix" class="input-group-addon" [innerHTML]="suffix"></span>
                    </div>
                    <plex-validation-messages *ngIf="hasDanger()" [control]="control"></plex-validation-messages>
                </div>`,
})
export class PlexIntComponent implements OnInit, AfterViewInit, ControlValueAccessor, OnChanges {
    private lastValue: any = null;
    private renderer: Renderer;
    @ViewChild('ref') private ref: ElementRef;
    @ContentChild(NgControl) public control: any;
    public get esOpcional(): boolean {
        return hasRequiredValidator(this.control);
    }

    // Propiedades
    @Input() label: string;
    @Input() prefix: string;
    @Input() suffix: string;
    @Input() placeholder: string;
    @Input() disabled = false;
    @Input() readonly = false;
    @Input() min: number;
    @Input() max: number;
    @Input()
    set autoFocus(value: any) {
        // Cada vez que cambia el valor vuelve a setear el foco
        if (this.renderer) {
            this.renderer.invokeElementMethod(this.ref.nativeElement, 'focus');
        }
    }

    // Eventos
    @Output() change = new EventEmitter();

    // Funciones públicas
    public onChange = (_: any) => { };

    public disabledEvent(event: Event) {
        event.stopImmediatePropagation();
        return false;
    }

    // Validación
    validateFn = (c: FormControl) => { };
    validate(c: FormControl) {
        return this.validateFn(c);
    }
    ngOnChanges(changes) {
        // Cuando cambias las cotas, devuelve una nueva función de validación
        if (changes.min || changes.max) {
            this.validateFn = numberValidator(REGEX, this.min, this.max);
        }
    }

    constructor(renderer: Renderer) {
        this.renderer = renderer;
        this.placeholder = '';
    }

    // Inicialización
    ngOnInit() { }
    ngAfterViewInit() {
        if (this.autoFocus) {
            this.renderer.invokeElementMethod(this.ref.nativeElement, 'focus');
        }
    }

    // Actualización Modelo -> Vista
    writeValue(value: any) {
        this.renderer.setElementProperty(this.ref.nativeElement, 'value', typeof value === 'undefined' ? '' : value);
    }

    hasDanger() {
        return (this.control as any).name && (this.control.dirty || this.control.touched) && !this.control.valid;
    }

    // Actualización Vista -> Modelo
    registerOnTouched() {

    }

    registerOnChange(fn: any) {
        this.onChange = (value) => {
            // Estas líneas evitan que se muestren caracteres no permitidos en el input
            if ((value === '') || REGEX.test(value)) {
                this.lastValue = value;
            } else {
                this.writeValue(this.lastValue);
                value = this.lastValue;
            }

            // Emite los eventos
            const val = ((value == null) || (value === '')) ? null : Number.parseInt(value, 10);

            fn(val);
            this.change.emit({
                value: val
            });
        };
    }
}
