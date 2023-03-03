/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.SortListRelation = class SortListRelation extends Jam.SortListArray {

    getCommandMethod (name) {
        switch (name) {
            case 'deleteSort': return this.onDeleteSort;
        }
        return super.getCommandMethod(name);
    }

    onDeleteSort () {
        Jam.dialog
            .confirmDeletion('Remove sorting of related objects?')
            .then(this.deleteSorting.bind(this));
    }

    deleteSorting () {
        this.post(this.params.url, {delete: true}).done(() => {
            this.changed = false;
            this.frame.close({deleted: true});
        });
    }
};