/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.RelationSort = class RelationSort {

    constructor (owner) {
        this.owner = owner;
        this.params = owner.params.relationSort;
    }

    init () {
        if (this.params) {
            this.toggleState(this.params.active);
            this.findCommand().click(this.onSortRelation.bind(this));
        }
    }

    findCommand () {
        return this.owner.findCommand('relationSort');
    }

    toggleState (ordered) {
        this.findCommand()
            .toggleClass('btn-primary', !!ordered)
            .toggleClass('btn-outline-secondary', !ordered);
    }
    onSortRelation () {

        this.owner.openFrame(this.params.url, null, this.onAfterFrameClose.bind(this));
    }

    onAfterFrameClose (event, data) {
        if (data.order || data.deleted) {
            this.toggleState(data.order);
            this.owner.onAfterRelationSort?.(data);
        }
    }
};