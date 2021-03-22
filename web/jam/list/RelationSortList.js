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
        for (const item of this.findItems()) {
            result.push(item.dataset.id);
        }
        return result;
    }

    onDeleteSort () {
        Jam.dialog.confirmDeletion('Delete relation sorting?').then(() => {
            this.post(this.params.url, {delete: true}).done(() => {
                this.changed = false;
                this.frame.close({deleted: true});
            });
        });
    }

    onSaveClose () {
        const order = this.getChangedOrder();
        this.post(this.params.url, {order}).done(()=> {
            this.changed = false;
            this.frame.close({order});
        });
    }
};