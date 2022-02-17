/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.SelectClassList = class SelectClassList extends Jam.SelectList {

    onSelect () {
        const $item = this.getSelectedItem();
        if ($item) {
            this.frame.load(this.params.create, {
                c: this.serializeObjectIds($item),
                force: true
            });
        }
    }

    openNewPage () {
        // do nothing
    }
};