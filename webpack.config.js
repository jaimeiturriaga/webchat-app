var webpack = require("webpack");

module.exports = {
    entry: {
        app: "./src/components/App.js"
    },
    output: {
        filename:"build/bundle.js",
        sourceMapFilename: "build/bundle.map"
    },
    devtool: '#source-map',

    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'babel-loader',
                query:{
                    presets:['react', 'es2015']
                }
            },
            {
                test: /\.(jpg|png)$/,
                loader: 'url-loader',
                options: {
                    limit: 25000,
                },
            }
        ]

    }
};
