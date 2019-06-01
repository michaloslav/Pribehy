const webpack = require("webpack");
const path = require("path");
const process = require("process");
const TerserPlugin = require('terser-webpack-plugin');

process.env.NODE_ENV = "production";

module.exports = {
    entry: [
        "./public/javascripts/app.js"
    ],
    output: {
        path: path.resolve(__dirname, "public/dist/js"),
        filename: "bundle.js"
    },
    module: {
        rules: [
            {
                test: /\.js?$/,
                exclude: /node_modules\/(?!(wolfuix|minilazyload)\/).*/,
                loader: "babel-loader",
                query: {
                    cacheDirectory: true,
                    presets: [
                        ["es2015"],
                        ["env", {
                            targets: {
                                browsers: ["last 2 versions", "safari >= 7"],
                            },
                        }],
                    ],
                },
            }
        ]},
    optimization: {
        minimizer: [
            new TerserPlugin({
                cache: true,
            }),
        ],
    }
};