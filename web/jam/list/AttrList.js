/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.AttrList = class AttrList extends Jam.AttrList {

    init () {
        super.init();
        this.createRelationSort();
    }

    createRelationSort () {
        this.relationSort = new Jam.RelationSort(this);
        this.relationSort.init();
    }

    onAfterRelationSort () {
        this.grid.clearOrder();
        this.reload();
    }
};