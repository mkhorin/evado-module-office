/**
 * @copyright Copyright (c) 2022 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.TreeListHelper = class TreeListHelper {

    static getCreateUrl () {
        return this.getObjectUrl(...arguments);
    }

    static getUpdateUrl () {
        return this.getObjectUrl(...arguments);
    }

    static getDeleteUrl () {
        return this.getObjectUrl(...arguments);
    }

    static getObjectUrl (url, $items) {
        const c = $items.first().data('class');
        return c ? Jam.UrlHelper.addParams(url, {c}) : url;
    }

    static getObjectIdParam ($items) {
        const $item = $items.first();
        const data = {id: $item.data('id')};
        const className = $item.data('class');
        if (className) {
            data.c = className;
        }
        return data;
    }

    static filterItemsByEvent (event, $items) {
        const name = $(event.currentTarget).data('class');
        return $items.not(`[data-class="${name}"]`);
    }
};