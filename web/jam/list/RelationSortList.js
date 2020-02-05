/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.RelationSortList = class RelationSortList extends Jam.SortList {

    getCommandMethod (name) {
        switch (name) {
            case 'deleteSort': return this.onDeleteSort;
        }
        return super.getCommandMethod(name);
    }

    setSourceOrderNumbers () {
    }

    getChangedOrder () {
        const result = [];
        for (const row of this.findRows()) {
            result.push(row.dataset.id);
        }
        return result;
    }

    beforeClose (event) {
        if (this.changed && !Jam.Helper.confirm('Close without saving changes?')) {
            event.stopPropagation();
        }
    }

    onDeleteSort () {
        if (!Jam.Helper.confirm('Delete relation sort?')) {
            return false;
        }
        this.post(this.params.url, {delete: true}).done(()=> {
            this.changed = false;
            this.modal.close({deleted: true});
        });
    }

    onSaveClose () {
        const order = this.getChangedOrder();
        this.post(this.params.url, {order}).done(()=> {
            this.changed = false;
            this.modal.close({order});
        });
    }
};