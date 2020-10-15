var path = require('path')
var webpack = require('webpack')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const commonConfig = require('./webpack.config.common')
const merge = require('webpack-merge')

const webpackConfig = merge(commonConfig, {
    mode: 'production',
    entry: {
        vendor: ['bignumber.js', 'vue', 'vue-router', 'vuex', 'web3']
    },
    output: {
        path: path.resolve(__dirname, '../build'),
        publicPath: '/build/',
        filename: '[name].[contenthash].js'
        // chunkFilename: '[name].chunks.[chunkhash].js'
        // jsonpFunction: 'pluginWebpack'
    },
    optimization: {
        minimize: true,
        splitChunks: {
            chunks: 'all',
            minSize: 30000,
            maxSize: 0,
            minChunks: 1,
            maxAsyncRequests: 5,
            maxInitialRequests: 3,
            automaticNameDelimiter: '~',
            name: true,
            cacheGroups: {
                vendor: {
                    chunks: 'initial',
                    name: 'vendor',
                    test: './node_modules/',
                    enforce: true
                },
                default: {
                    minChunks: 2,
                    priority: -20,
                    reuseExistingChunk: true
                }
            }
        },
        runtimeChunk: true
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: '"production"'
            }
        }),
        new webpack.LoaderOptionsPlugin({
            minimize: true,
            minimizer: new UglifyJsPlugin({
                uglifyOptions: {
                    sourceMap: false,
                    compress: {
                        warnings: false
                    }
                }
            })
        }),
        new CleanWebpackPlugin({
            cleanOnceBeforeBuildPatterns: ['**/*js', '**/*html', '**/*svg']
        }),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'index-prod.html',
            inject: true,
            chunksSortMode: 'dependency'
        })
    ]
})

module.exports = webpackConfig
