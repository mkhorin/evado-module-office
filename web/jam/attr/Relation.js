/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.AttrList = class AttrList extends Jam.AttrList {

    init () {
        super.init();
        this.initRelationSort();
    }

    initRelationSort () {
        if (this.params.relationSort) {
            this.findCommand('relationSort')
                .click(this.onSortRelation.bind(this))
                .toggleClass('ordered', this.params.relationSort.active);
        }
    }

    onSortRelation () {
        this.loadModal(this.params.relationSort.url, null, this.onAfterModalClose.bind(this));
    }

    onAfterModalClose (event, data) {
        if (data.order || data.deleted) {
            this.findCommand('relationSort').toggleClass('ordered', !!data.order);
            this.grid.clearOrder();
            this.reload();
        }
    }
};