/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = {

    build: [{
        Class: 'MergeFiles',
        sources: [
            'jam'
        ],
        target: 'dist/jam.min.js',
        copyright: `/* @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com> */\n`
    }],

    deploy: {
        'vendor/jam': 'dist/jam.min.js'
    }
};