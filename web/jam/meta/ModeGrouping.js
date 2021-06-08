/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.ModelGrouping = class ModelGrouping extends Jam.ModelGrouping {

    static URL_PATTERNS = [

        [/office\/model\//, ['c', 'v']],

        ...super.URL_PATTERNS
    ];
};