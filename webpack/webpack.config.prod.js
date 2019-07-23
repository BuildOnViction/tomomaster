var path = require('path')
var webpack = require('webpack')
// var appName = '[name].[hash].js'
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const commonConfig = require('./webpack.config.common')
const merge = require('webpack-merge')

const webpackConfig = merge(commonConfig, {
    mode: 'production',
    output: {
        path: path.resolve(__dirname, '../build'),
        publicPath: '/build/',
        filename: '[name].[hash].js'
        // chunkFilename: 'chunks/[chunkhash].js',
        // jsonpFunction: 'pluginWebpack'
    },
    optimization: {
        minimize: process.env.NODE_ENV === 'production'
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
