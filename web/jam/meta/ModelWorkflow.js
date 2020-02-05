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
            ? Jam.getClass(`ModelTransition.${options.jam}`)
            : Jam.ModelTransition;
        return new Transition(this, $control);
    }
};

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
        return $.when(this.confirm()).then(()=> {
            if (this.model.validate()) {
                this.workflow.setTransitionValue(this.name);
                this.model.forceSave(true);
            }
        });
    }

    translate (message) {
        return Jam.i18n.translate(message, this.$control.data('t'));
    }
};