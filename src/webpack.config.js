const path = require('path');

module.exports = {
    mode: 'development',
    entry: './main.js', // Assuming main.js is directly inside the src folder
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules\/(?!three)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                      },
                },
            },
        ],
    },
    resolve: {
        alias: {
            'three': path.resolve(__dirname, 'node_modules/three'),
        },
    },
};
