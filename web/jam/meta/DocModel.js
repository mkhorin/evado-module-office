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

    formatAttrName (name) {
        return typeof name !== 'string' || name.includes('[') ? name : `data[${name}]`;
    }

    setReadOnly () {
        this.findCommand('saveClose').attr('disabled', true).removeAttr('data-command');
        this.findCommand('save').attr('disabled', true).removeAttr('data-command');
    }

    setTransiting () {
        this.findCommand('history').remove();
        this.findCommand('transiting').show();
        this.findCommand('transitions').remove();
        this.findCommand('delete').remove();
    }
};