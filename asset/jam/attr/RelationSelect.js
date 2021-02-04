/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.RelationSelectModelAttr = class extends Jam.RelationSelectModelAttr {

    initBase () {
        super.initBase();
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
        this.openFrame(this.params.relationSort.url, null, this.onAfterCloseFrame.bind(this));
    }

    onAfterCloseFrame (event, data) {
        if (data.order || data.deleted) {
            this.findCommand('relationSort').toggleClass('ordered', !!data.order);
            this.sortByIdList(data.order);
        }
    }
};