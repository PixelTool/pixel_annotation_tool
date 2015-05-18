/**
 * Created by rainx on 15/4/22.
 */


var webpack = require("webpack");
var path = require("path");
var BowerWebpackPlugin = require('bower-webpack-plugin');



module.exports = {
    devtool : "source-map",
    entry : {
        background: './src/background.js',
        main: './src/main.js',
        test: './src/test.js'
    },
    output: {
        path: 'build',
        filename: '[name].js'
    },
    resolve: {
        extensions: ['', '.coffee', '.js']
    },
    module: {
        loaders: [
            {test: /\.css$/, loader: 'style-loader!css-loader' },
            {test: /\.html$/, loader: 'html-loader'},
            {test: /\.(png|jpg)$/, loader: 'url-loader?limit=8192'}, // inline base64 URLs for <=8k images, direct URLs for the rest
            {test: /\.jade/, loader: "jade" },
            { test: /\.less$/, loader: 'style-loader!css-loader!less-loader' }
        ]
    },
    plugins: [
        new BowerWebpackPlugin({
            modulesDirectories: ["bower_components"]
        }),
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            "window.jQuery": "jquery"
        })
    ]
}