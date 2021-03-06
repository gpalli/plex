import { NgForm } from '@angular/forms';
import { Component, Input, HostBinding, HostListener, Optional, forwardRef } from '@angular/core';

@Component({
    selector: 'plex-icon',
    template: `<i class="mdi mdi-{{name}}"></i> `,
})
export class PlexIconComponent {
    @Input() name: string;

    constructor() {

    }

}
