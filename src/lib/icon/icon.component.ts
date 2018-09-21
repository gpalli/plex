import { Component, Input } from '@angular/core';

@Component({
    selector: 'plex-icon',
    template: `<i class="{{prefix}} {{prefix}}-{{name}}"></i> `,
})
export class PlexIconComponent {
    @Input() name: string;
    @Input() prefix = 'mdi';

    constructor() {

    }

}
