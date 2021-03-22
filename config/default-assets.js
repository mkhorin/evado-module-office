/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = {

    build: [{
        Class: 'Packer',
        sources: [
            'jam'
        ],
        target: 'vendor/jam.min.js',
        copyright: `/* @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com> */\n`
    }]
};