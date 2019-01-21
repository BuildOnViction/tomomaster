var path = require('path')
var webpack = require('webpack')
var appName = '[name].js'
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
    mode: 'development',
    entry: {
        app: './app/app.js',
        style: './app/assets/scss/style.scss'
    },
    output: {
        path: path.resolve(__dirname, './build'),
        publicPath: '/build/',
        filename: appName
        // chunkFilename: 'chunks/[chunkhash].js',
        // jsonpFunction: 'pluginWebpack'
    },
    optimization: {
        minimize: process.env.NODE_ENV === 'production',
        splitChunks: {
            name: 'app'
        }
    },
    module: {
        rules: [
            {
                enforce: 'pre',
                test: [/\.js$/, /\.vue$/],
                exclude: [/node_modules/],
                loader: 'eslint-loader'
            },
            {
                test: /\.css$/,
                use: [
                    'vue-style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.scss$/,
                exclude: [/node_modules/],
                use: [
                    'vue-style-loader',
                    'css-loader',
                    'sass-loader'
                ]
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader',
                exclude: /node_modules/,
                options: {
                    loaders: {
                        'scss': [
                            'vue-style-loader',
                            'css-loader',
                            'sass-loader'
                        ]
                    }
                    // other vue-loader options go here
                }
            },
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/
            },
            {
                test: /\.(png|jpg|gif|svg)$/,
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]?[hash]'
                },
                exclude: /node_modules/
            },
            {
                test: /\.(png|woff|woff2|eot|ttf|svg)$/,
                loader: 'url-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        alias: {
            'vue$': 'vue/dist/vue.esm.js',
            'app': path.resolve('./app/app.js'),
            'style': path.resolve('./app/assets/scss/style.scss')
        },
        extensions: ['*', '.js', '.vue', '.json']
    },
    devServer: {
        historyApiFallback: true,
        noInfo: true,
        overlay: true,
        proxy: {
            '/api/*': 'http://localhost:3001',
            secure: false
        }
    },
    performance: {
        hints: false
    },
    devtool: '#eval-source-map'
}

if (process.env.NODE_ENV === 'production') {
    // module.exports.devtool = '#source-map'
    // http://vue-loader.vuejs.org/en/workflow/production.html
    module.exports.plugins = (module.exports.plugins || []).concat([
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
        })
    ])
}
