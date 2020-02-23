const path = require('path');

module.exports = {
    mode: 'production',
    entry: {
        index: './example/assets/index.js'
    },
    devtool: 'source-map',
    resolve: {
        modules: [
            "node_modules",
            path.resolve(__dirname, "src")
        ]
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    output: {
        path: path.resolve(__dirname, "example"),
        filename: "[name].js",
    }
};
