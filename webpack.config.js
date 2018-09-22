const path = require('path');

module.exports = {
    mode: 'production',
    entry: {
        mml: './src/mml.js',
        index: './src/index.js'
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
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js",
        publicPath: "/assets/"
    }
};
