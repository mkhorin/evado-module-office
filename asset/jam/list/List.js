/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.MainList = class MainList extends Jam.MainList {

    getCloneParams ($row) {
        const id = $row.data('id');
        return {c: this.grid.getData(id)._class, id};
    }
};

Jam.TreeList = class TreeList extends Jam.TreeList {

    onClickRow (event) {
        if (super.onClickRow(event)) {
            return true;
        }
        const name = $(event.currentTarget).data('class');
        this.toggleRowSelect(this.findSelectedRows().not(`[data-class="${name}"]`), false);
    }
};

Jam.MainTreeList = class MainTreeList extends Jam.MainTreeList {

    getCreateUrl () {
        const $rows = this.findSelectedRows();
        const name = $rows.first().data('class');
        const url = this.params.create;
        return name ? Jam.UrlHelper.addParams(url, {c: name}) : url;
    }

    getDeleteUrl ($rows) {
        const name = $rows.first().data('class');
        return Jam.UrlHelper.addParams(this.params.delete, {c: name});
    }

    getObjectIdParam ($rows) {
        const data = {id: $rows.first().data('id')};
        const className = $rows.first().data('class');
        if (className) {
            data.c = className;
        }
        return data;
    }

    onClickRow (event) {
        if (super.onClickRow(event)) {
            return true;
        }
        const name = $(event.currentTarget).data('class');
        this.toggleRowSelect(this.findSelectedRows().not(`[data-class="${name}"]`), false);
    }

    onCreate (event) {
        const $row = this.findSelectedRows();
        if ($row.length !== 1) {
            return super.onCreate(event);
        }
        const node = this.grid.getNodeByRow($row);
        super.onCreate(event, {
            node: node.getId(),
            depth: node.getDepth()
        });
    }
};

Jam.SelectClassList = class SelectClassList extends Jam.SelectList {

    onSelect () {
        const $row = this.getSelectedRow();
        if ($row) {
            this.frame.load(this.params.create, {c: this.serializeObjectIds($row)});
        }
    }

    openNewPage () {
    }
};