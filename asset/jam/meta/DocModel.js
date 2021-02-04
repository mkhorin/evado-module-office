/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.DocModel = class DocModel extends Jam.Model {

    init () {
        if (this.isTransiting()) {
            this.setTransiting();
        }
        this.workflow = new Jam.ModelWorkflow(this);
        super.init();
    }

    isTransiting () {
        return this.params.transiting;
    }

    formatAttrName (name) {
        return typeof name !== 'string' || name.includes('[') ? name : `data[${name}]`;
    }

    setTransiting () {
        this.findCommand('history').remove();
        this.findCommand('transiting').show();
        this.findCommand('transitions').remove();
        this.findCommand('delete').remove();
    }
};