import { Component, Input } from '@angular/core';

@Component({
    selector: 'plex-action',
    template: `<i class="{{prefix}} {{prefix}}-{{name}}"></i> `,
})
export class PlexActionComponent {
    @Input() name: string;
    @Input() prefix = 'mdi';

    constructor() {

    }

}
