/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.TreeList = class TreeList extends Jam.TreeList {

    getCreateUrl () {
        return Jam.TreeListHelper.getCreateUrl(this.params.create, this.findSelectedItems());
    }

    getUpdateUrl () {
        return Jam.TreeListHelper.getUpdateUrl(this.params.update, this.findSelectedItems());
    }

    getDeleteUrl ($items) {
        return Jam.TreeListHelper.getDeleteUrl(this.params.delete, $items);
    }

    getObjectIdParam ($items) {
        return Jam.TreeListHelper.getObjectIdParam($items);
    }

    onClickItem (event) {
        if (super.onClickItem(event)) {
            return true;
        }
        const $items = Jam.TreeListHelper.filterItemsByEvent(event, this.findSelectedItems());
        this.toggleItemSelect($items, false);
    }

    openFrame (url, params) {
        this._lastOpenedClass = params?.c;
        return super.openFrame(...arguments);
    }

    reopen (id, params) {
        return super.reopen(id, {
            ...params,
            c: this._lastOpenedClass
        });
    }
};