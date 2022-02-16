/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.ModelTransition = class ModelTransition {

    constructor (workflow, $control) {
        this.workflow = workflow;
        this.model = workflow.model;
        this.$control = $control;
        this.name = $control.data('transition');
        this.options = $control.data('options');
    }

    getOption (key, defaults) {
        return Jam.ObjectHelper.getNestedValue(key, this.options, defaults);
    }

    confirm () {
        const message = this.getOption('confirmation');
        return message ? Jam.dialog.confirm(this.translate(message)) : true;
    }

    execute () {
        return $.when(this.confirm()).then(this.forceExecute.bind(this));
    }

    forceExecute () {
        return this.workflow.transit(this.name, ...arguments);
    }

    translate (message) {
        return Jam.t(message, this.$control.data('t'));
    }
};