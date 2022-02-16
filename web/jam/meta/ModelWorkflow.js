/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.ModelWorkflow = class ModelWorkflow {

    constructor (model) {
        this.model = model;
        this.url = model.findCommand('transitions').data('url');
        model.findCommand('transit').click(this.onTransit.bind(this));
    }

    onTransit (event) {
        event.preventDefault();
        this.createTransition($(event.target)).execute();
    }

    createTransition ($control) {
        const options = $control.data('options') || {};
        const Transition = options.jam
            ? Jam.getClass(`${options.jam}ModelTransition`)
            : Jam.ModelTransition;
        return new Transition(this, $control);
    }

    transit (transition, data) {
        if (this.model.isChanged()) {
            return Jam.dialog.alert('Save changes first');
        }
        this.toggleLoader(true);
        return Jam.post(this.url, {transition, ...data})
            .done(this.onDone.bind(this))
            .fail(this.onFail.bind(this));
    }

    onDone () {
        this.model.reload();
    }

    onFail (data) {
        this.toggleLoader(false);
        this.model.error.parseXhr(data);
    }

    toggleLoader (state) {
        this.model.findCommand('transiting').toggle(state);
        this.model.toggleLoader(state);
    }
};