/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.ModelWorkflow = class ModelWorkflow {

    constructor (model) {
        this.model = model;
        model.findCommand('transit').click(this.onTransit.bind(this));
        model.events.on('beforeValidate', this.onBeforeValidate.bind(this));
    }

    onBeforeValidate () {
        this.setTransitionValue('');
    }

    setTransitionValue (value) {
        this.model.$form.find('[name="transition"]').val(value);
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
};