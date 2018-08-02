import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Rx';
import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { DropdownItem } from './../dropdown/dropdown-item.inteface';
import { NotificationsService } from './../toast/simple-notifications/services/notifications.service';
import { default as swal } from 'sweetalert2';
import { WizardConfig } from './wizard-config.interface';

@Injectable()
export class Plex {
    public menu: DropdownItem[];
    public loaderCount = 0;
    public appStatus: Subject<any> = new Subject();
    public userInfo: any;

    constructor(private titleService: Title, private noficationService: NotificationsService) {
    }

    /**
     * Inicializa la vista de la aplicación
     * @deprecated Utilizar los métodos updateTitle() y updateMenu()
     */
    initView(title: string, menu: DropdownItem[] = null) {
        this.titleService.setTitle(title);
        this.menu = menu;
    }

    /**
     * Actualiza el ménu de la aplicación
     *
     * @param {DropdownItem[]} menu Items del menú
     *
     * @memberof Plex
     */
    updateMenu(menu: DropdownItem[]) {
        this.menu = menu;
    }

    /**
     * Actualiza el título del navegador
     *
     * @param {string} title Título
     *
     * @memberof Plex
     */
    updateTitle(title: string) {
        this.titleService.setTitle(title);
    }

    /**
     * Actualiza el estado de la aplicación en el navbar
     *
     * @param {*} status Objeto de estado
     *
     * @memberof Plex
     */
    updateAppStatus(status: any) {
        this.appStatus.next(status);
    }

    /**
     * Actualiza la información del usuario actual
     *
     * @param {*} user Objeto con datos de usuario
     *
     * @memberof Plex
     */
    updateUserInfo(user: any) {
        this.userInfo = user;
    }

    /**
     * Muestra un mensaje de alerta
     *
     * @param {string} content Texto
     * @param {string} [title='Información'] Título
     * @returns {Promise<any>} Devuelve una promise se que resuelve cuando la alerta se cierra
     *
     * @memberof Plex
     * @deprecated Utilizar el método info()
     */
    alert(content: string, title = 'Información'): Promise<any> {
        return swal({
            title: title,
            html: content,
            type: 'warning',
            confirmButtonText: 'Ok'
        });
    }

    /**
     * Muestra un diálogo de confirmación
     *
     * @param {string} content Texto
     * @param {string} [title='Confirmación'] Título
     * @returns {Promise<any>} Devuelve una promise se que resuelve con true/false cuando el diálogo se cierra
     *
     * @memberof Plex
     */
    confirm(content: string, title = 'Confirmación'): Promise<any> {
        let resolve: any;
        let promise = new Promise((res, rej) => {
            resolve = res;
        });

        swal({
            title: title,
            html: content,
            type: 'question',
            showCancelButton: true,
            confirmButtonText: 'Confirmar',
            cancelButtonText: 'Cancelar'
        })
            .then(() => resolve(true))
            .catch(() => resolve(false));
        return promise;
    }

    /**
     * Muestra un mensaje invasivo al usuario
     *
     * @param {string} type success, danger, warning, info
     * @param {string} content Texto del mensaje
     * @param {string} [title='Información'] Título
     * @param {number} [timeOut=0] Tiempo en ms cuando se oculta el mensaje. Por default no se oculta.
     *
     * @memberof Plex
     */
    info(type: string, content: string, title = 'Información', timeOut = 0) {
        if (type === 'danger') {
            type = 'error';
        }
        return swal({
            title: title,
            html: content,
            type: type as any,
            confirmButtonText: 'Ok',
            timer: timeOut || null,
        }).catch(swal.noop);
    }

    /**
     * Muestra un mensaje no invasivo al usuario
     *
     * @param {string} type success, danger, warning, info
     * @param {string} content Texto del mensaje
     * @param {string} [title='Información'] Título
     * @param {number} [timeOut=5000] Tiempo en ms cuando se oculta el mensaje
     *
     * @memberof Plex
     */
    toast(type: string, content: string, title = 'Información', timeOut = 2500) {
        let options = {
            theClass: 'toast',
            timeOut: timeOut
        };
        switch (type) {
            case 'success':
                this.noficationService.success(title, content, options);
                break;
            case 'info':
                this.noficationService.info(title, content, options);
                break;
            case 'danger':
                this.noficationService.error(title, content, options);
                break;
            case 'warning':
                this.noficationService.alert(title, content, options);
                break;
        }
    }

    /**
     * Muestra el loader en el navbar de la aplicación.
     *
     * @memberof Plex
     */
    showLoader() {
        // Debe ir dentro de setTimeout por un bug de Angular2
        setTimeout(() => {
            this.loaderCount++;
        });
    }

    /**
     * Oculta el loader en el navbar de la aplicación.
     *
     * @memberof Plex
     */
    hideLoader() {
        // Debe ir dentro de setTimeout por un bug de Angular2
        setTimeout(() => {
            if (this.loaderCount > 0) {
                this.loaderCount--;
            }
        });
    }

    /**
     * Muestra al usuario una secuencia de imágenes y textos organizados en pasos
     *
     * @param {WizardConfig} config
     * @returns {Promise<any>}
     * @memberof Plex
     */
    wizard(config: WizardConfig): Promise<any> {
        // Cheque si el usuario no desea verlo más
        if (!config.forceShow && localStorage[`wizard-${config.id}-hide`]) {
            return null;
        }

        // Configura SweetAlert
        let steps = [];
        for (let i in config.steps) {
            steps.push({
                title: config.steps[i].title,
                html: config.steps[i].content,
                // Empty gif
                imageUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
                imageClass: 'plex-wizard-step ' + (config.steps[i].imageClass ? config.steps[i].imageClass : `plex-wizard-${config.id}-${steps.length + 1}`),
                imageWidth: 500,
                imageHeight: 250,
                confirmButtonText: 'Continuar',
                // animation: false,
                // customClass: 'animated fadeInLeft'
            });
        }

        // Corrije los textos
        steps[0].confirmButtonText = 'Comenzar';
        let last = steps[steps.length - 1];
        last.confirmButtonText = 'Cerrar y no volver a mostrar';
        last.showCancelButton = true;
        last.cancelButtonText = 'Cerrar';

        // Crea el modal
        let modal: Promise<any>;
        if (steps.length === 1) {
            modal = swal(steps[0]);
        } else {
            // Computa el array progressSteps
            let progressSteps: number[] = [];
            steps.forEach((element, index) => progressSteps.push(index + 1));

            // Lo injecta en cada paso
            steps.forEach((element, value, index) => element.progressSteps = progressSteps);

            // Renderea con SweetAlert
            modal = swal.queue(steps);
        }

        // Crea la promise
        let resolve: any;
        let promise = new Promise((res, rej) => {
            resolve = res;
        });
        modal.then((reason) => {
            // Oculta para siempre este wizard
            localStorage[`wizard-${config.id}-hide`] = true;
            resolve(true);
        }).catch((reason) => {
            if (reason === 'cancel') {
                resolve(true);
            } else {
                resolve(false);
            }
        });

        return promise;
    }
}
