/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.DocModel = class DocModel extends Jam.Model {

    init () {
        if (this.isReadOnly()) {
            this.setReadOnly();
        }
        if (this.isTransiting()) {
            this.setTransiting();
        }
        this.workflow = new Jam.ModelWorkflow(this);
        super.init();
    }

    isReadOnly () {
        return this.params.readOnly;
    }

    isTransiting () {
        return this.params.transiting;
    }

    setReadOnly () {
        this.findCommand('saveClose').remove();
        this.findCommand('save').remove();
        this.findCommand('utilities').remove();
    }

    setTransiting () {
        this.findCommand('history').remove();
        this.findCommand('transiting').show();
        this.findCommand('transitions').remove();
        this.findCommand('utilities').remove();
        this.findCommand('delete').remove();
    }
};