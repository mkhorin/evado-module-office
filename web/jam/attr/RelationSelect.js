/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.RelationSelectModelAttr = class RelationSelectModelAttr extends Jam.RelationSelectModelAttr {

    init () {
        super.init();
        this.createRelationSort();
    }

    createRelationSort () {
        this.relationSort = new Jam.RelationSort(this);
        this.relationSort.init();
    }

    onAfterRelationSort (data) {
        this.sortByIdList(data.order);
    }
};