/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.ModelSignature = class ModelSignature {

    constructor (model) {
        this.model = model;
        this.$sign = model.findCommand('sign');
        if (this.$sign.length) {
            this.params = this.$sign.data('params');
            this.$sign.click(this.onSign.bind(this));
        }
    }

    onSign () {
        if (this.model.isChanged()) {
            return Jam.dialog.alert('Save changes first');
        }
        this.getCertificate().then(this.onCertificate.bind(this));
    }

    getCertificate () {
        return Jam.dialog.confirm('Select a certificate to sign');
    }

    onCertificate (data) {
        this.certificate = data;
        this.post(this.params.dataUrl).done(this.onData.bind(this))
    }

    onData (data) {
        this.sign(data).then(this.create.bind(this));
    }

    sign (source) {
        const data = 'Signed data';
        return $.Deferred().resolve(data);
    }

    create (data) {
        const cert = 'Public key certificate data';
        return this.post(this.params.signUrl, {data, cert})
            .done(this.onCreate.bind(this));
    }

    onCreate (data) {
        this.$sign.remove();
        Jam.dialog.info(data).then(() => this.model.reload());
    }

    post (url, data) {
        data = {
            id: this.model.id,
            class: this.model.params.className,
            view: this.model.params.viewName,
            ...data
        };
        this.model.toggleLoader(true);
        return Jam.post(url, data)
            .always(this.onPostAlways.bind(this))
            .fail(this.onFail.bind(this));
    }

    onPostAlways () {
        this.model.toggleLoader(false);
    }

    onFail (data) {
        Jam.dialog.error(data.responseText || data.statusText);
    }
};