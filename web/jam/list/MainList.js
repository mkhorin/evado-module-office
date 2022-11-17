/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.MainList = class MainList extends Jam.MainList {

    getCloneParams ($item) {
        const id = $item.data('id');
        const c = this.grid.getData(id);
        return {c, id};
    }
};