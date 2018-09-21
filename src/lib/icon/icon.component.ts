import { Component, Input } from '@angular/core';

@Component({
    selector: 'plex-icon',
    template: `
        <i class="{{prefix}} {{prefix}}-{{name}}"></i>
        <ng-content selector="plex-action"></ng-content>
    `,
})
export class PlexIconComponent {
    @Input() name: string;
    @Input() prefix = 'mdi';

    constructor() {

    }

}
