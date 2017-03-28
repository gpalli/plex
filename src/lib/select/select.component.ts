import { ContentChild, Component, OnInit, Input, Output, forwardRef, ElementRef, EventEmitter, AfterViewInit } from '@angular/core';
import { ControlValueAccessor, NgControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SelectEvent } from './select-event.interface';

// Importo las librerías de jQuery
let jQuery = require('jquery/dist/jquery'); // @jgabriel: No encontré una forma más elegante de incluir jQuery
let Selectize = require('selectize/dist/js/standalone/selectize');

@Component({
    selector: 'plex-select',
    templateUrl: 'select.html',
    providers: [
        // Permite acceder al atributo formControlName/ngModel
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => PlexSelectComponent),
            multi: true,
        }
    ]
})
export class PlexSelectComponent implements AfterViewInit, ControlValueAccessor {
    private value: any;
    private selectize: any;
    private hasStaticData = false;
    private _data: any[];
    private _readonly: boolean;

    @ContentChild(NgControl) control: any;
    public uniqueId = new Date().valueOf().toString();

    // Propiedades
    @Input() autoFocus: boolean;
    @Input() label: string;
    @Input() placeholder: string;
    @Input() multiple: false;
    @Input() idField: string;
    @Input() labelField: string; // Puede ser un solo campo o una expresión tipo ('string' + campo + 'string' + campo + ...)
    @Input() groupField: string;
    @Input() closeAfterSelect = false;
    @Input() data: any[];
    @Input()
    set readonly(value: boolean) {
        this._readonly = value;
        if (this.selectize) {
            if (value) {
                this.selectize.disable();
            } else {
                this.selectize.enable();
            }
        }
    }
    get readonly(): boolean {
        return this._readonly;
    }

    // Eventos
    @Output() getData = new EventEmitter<SelectEvent>();
    @Output() change = new EventEmitter();

    // Funciones públicas
    public onChange = (_: any) => { };

    // Constructor
    constructor(private element: ElementRef) {
        this.initRemoveButtonPlugin();
        this.placeholder = '';
        this.multiple = false;
        this.idField = 'id';
        this.labelField = 'nombre';
        this.groupField = 'grupo';
    }

    private initRemoveButtonPlugin() {
        // Basado en remove_button de selectize/dist/js/standalone/selectize
        Selectize.define('remove_button_plex', function (options) {
            options = {
                label: '&nbsp;&times;',
                title: 'Quitar esta opción',
                className: 'remove',
                append: true
            };

            let self = this;
            let html = '<a href="javascript:void(0)" class="' + options.className + '" tabindex="-1" title="' + options.title + '">' + options.label + '</a>';

            let append = function (html_container, html_element) {
                let pos = html_container.search(/(<\/[^>]+>\s*)$/);
                return html_container.substring(0, pos) + html_element + html_container.substring(pos);
            };

            self.setup = (function () {
                let original = self.setup;
                return function () {
                    // override the item rendering method to add the button to each
                    if (options.append) {
                        let render_item = self.settings.render.item;
                        self.settings.render.item = function (data) {
                            return append(render_item.apply(self, arguments), html);
                        };
                    }

                    original.apply(self, arguments);

                    // add event listener
                    self.$control.on('click', '.' + options.className, function (e) {
                        e.preventDefault();
                        if (self.isLocked) {
                            return;
                        }

                        if (self.settings.mode === 'single') {
                            self.clear();
                        } else {
                            let $item = jQuery(e.currentTarget).parent();
                            self.setActiveItem($item);
                            if (self.deleteSelection()) {
                                self.setCaret(self.items.length);
                            }
                        }

                        // Cierra el combo que por un bug se vuelve a abrir. Igual tiene un flicker raro (abre y cierra)
                        self.close();
                    });
                };
            })();
        });
    }

    private splitLabelField(labelField: string, filterLiterals: boolean): string[] {
        let values = labelField.split('+');
        return filterLiterals ? values.filter(i => (i.indexOf('\'') < 0 || i.indexOf('\'') < 0)) : values;
    }

    // Rendera una opción en base a la expresión indicada en labelField
    private renderOption(item: any, labelField: string): string {
        if (!item) {
            return '';
        }

        let result = '';
        let labelFields = this.splitLabelField(labelField, false);
        labelFields.forEach(field => {
            if (field.startsWith('\'')) {
                result += field.slice(1, field.length - 1) + ' ';
            } else {
                if (field.indexOf('.') < 0) {
                    result += item[field] + ' ';
                } else {
                    let prefix = field.substr(0, field.indexOf('.'));
                    let suffix = field.slice(field.indexOf('.') + 1);
                    result += this.renderOption(item[prefix], suffix) + ' ';
                }
            }
        });
        // Reemplaza comillas por vacío
        return result.trim();
    }

    removeOptions() {
        for (let value in this.selectize.options) {
            this.selectize.removeOption(value, true);
        }
    }


    // Inicialización
    ngAfterViewInit() {
        this.hasStaticData = this.data && this.data.length ? true : false;

        // Eliminar los espacios alrededor del +
        this.labelField = this.labelField.replace(/(\s)*\+/g, '+').replace(/\+(\s)*/g, '+');

        // Inicializa el plugin
        let $selectize = jQuery('SELECT', this.element.nativeElement.children[0]).selectize({
            plugins: ['remove_button_plex'],
            valueField: this.idField,
            labelField: this.labelField,
            placeholder: this.placeholder,
            searchField: this.splitLabelField(this.labelField, true),
            options: this.data,
            closeAfterSelect: this.closeAfterSelect,
            preload: true,
            render: {
                option: (item, escape) => '<div class=\'option\'>' + escape(this.renderOption(item, this.labelField)) + '</div>',
                item: (item, escape) => {
                    if (this.multiple) {
                        return '<div class=\'item\'>' + escape(this.renderOption(item, this.labelField)) + '</div>';
                    } else {
                        return '<div class=\'item\'>' + escape(this.renderOption(item, this.labelField)) + '</div>';
                    }
                },
            },
            load: this.hasStaticData ? null : (query: string, callback: any) => {
                // Esta función se ejecuta si preload = true o cuando el usuario tipea
                this.getData.emit({
                    query: query,
                    callback: (data) => {
                        this.removeOptions();
                        this.data = data;
                        callback(data || []);
                    }
                });
            },
            onChange: (value) => {
                // Busca en la lista de items un valor que coincida con la clave
                if (this.multiple) {
                    let result = [];
                    for (let i = 0; i < this.data.length; i++) {
                        // value es siempre un string, por eso es necesario convertir el id
                        if (value.indexOf('' + this.data[i][this.idField]) >= 0) {
                            result = [...result, this.data[i]];
                        }
                    }
                    this.onChange(result.length ? result : null);
                } else {
                    if (!value) {
                        this.onChange(null);
                    } else {
                        for (let i = 0; i < this.data.length; i++) {
                            // value es siempre un string, por eso es necesario convertir el id
                            if ('' + this.data[i][this.idField] === value) {
                                this.onChange(this.data[i]);
                                return;
                            }
                        }
                    }
                }
            }
        });

        // Guarda el componente para futura referencia
        this.selectize = $selectize[0].selectize;

        // Setea el estado inicial
        if (this._readonly) {
            this.selectize.disable();
        } else {
            this.selectize.enable();
        }

        // Setea el valor inicial
        this.writeValue(this.value);
    }

    // Actualización Modelo -> Vista
    writeValue(value: any) {
        this.value = value;
        if (this.selectize) {
            // Convierte un objeto cualquiera a un string compatible con selectize
            let valueAsString = (val: any): string => {
                if (val === null) {
                    return null;
                } else
                    if (typeof val === 'object') {
                        return '' + val[this.idField];
                    } else {
                        return '' + val;
                    }
            };

            // Busca el id que corresponde al item
            let val;
            if (Array.isArray(value)) {
                val = [];
                for (let i = 0; i < value.length; i++) {
                    val = [...val, valueAsString(value[i])];
                }
            } else {
                val = valueAsString(value);
            }

            // Si no tiene ninguna opción, carga el objeto como única opción
            if (value && ((typeof value === 'object') || Array.isArray(value)) && (!this.data || this.data.length === 0)) {
                if (Array.isArray(value)) {
                    this.data = value;
                } else {
                    this.data = [value];
                }
                this.selectize.addOption(value);
            }

            // Setea el valor
            this.selectize.setValue(val, true);
        }
    }

    // Actualización Vista -> Modelo
    registerOnTouched() {
    }
    registerOnChange(fn: any) {
        this.onChange = (value) => {
            fn(value);
            this.change.emit({
                value: value
            });
        };
    }
}
