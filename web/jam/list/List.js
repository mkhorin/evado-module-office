/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.MainList = class MainList extends Jam.MainList {

    getCloneParams ($item) {
        const id = $item.data('id');
        return {c: this.grid.getData(id)._class, id};
    }
};

Jam.TreeList = class TreeList extends Jam.TreeList {

    onClickItem (event) {
        if (super.onClickItem(event)) {
            return true;
        }
        const name = $(event.currentTarget).data('class');
        this.toggleItemSelect(this.findSelectedItems().not(`[data-class="${name}"]`), false);
    }
};

Jam.MainTreeList = class MainTreeList extends Jam.MainTreeList {

    getCreateUrl () {
        const $items = this.findSelectedItems();
        const name = $items.first().data('class');
        const url = this.params.create;
        return name ? Jam.UrlHelper.addParams(url, {c: name}) : url;
    }

    getDeleteUrl ($items) {
        const name = $items.first().data('class');
        return Jam.UrlHelper.addParams(this.params.delete, {c: name});
    }

    getObjectIdParam ($items) {
        const $item = $items.first();
        const data = {id: $item.data('id')};
        const className = $item.data('class');
        if (className) {
            data.c = className;
        }
        return data;
    }

    onClickItem (event) {
        if (super.onClickItem(event)) {
            return true;
        }
        const name = $(event.currentTarget).data('class');
        this.toggleItemSelect(this.findSelectedItems().not(`[data-class="${name}"]`), false);
    }

    onCreate (event) {
        const $item = this.findSelectedItems();
        if ($item.length !== 1) {
            return super.onCreate(event);
        }
        const node = this.grid.getNodeByItem($item);
        super.onCreate(event, {
            node: node.getId(),
            depth: node.getDepth()
        });
    }
};

Jam.SelectClassList = class SelectClassList extends Jam.SelectList {

    onSelect () {
        const $item = this.getSelectedItem();
        if ($item) {
            this.frame.load(this.params.create, {
                c: this.serializeObjectIds($item),
                force: true
            });
        }
    }

    openNewPage () {
        // do nothing
    }
};