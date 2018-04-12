const path = require('path');
var webpack = require('webpack')
function resolve (dir) {
    return path.join(__dirname, '..', dir)
}

module.exports = {
    entry: './app/app.js',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'app.js'
    },
    resolve: {
        extensions: ['.js', '.vue', '.json'],
        alias: {
            'vue$': 'vue/dist/vue.min.js',
            '@': resolve('app'),
        }
    },
    module: {
        rules: [
            { test: /\.vue$/,
                loader: "vue-loader",
            },
            {
                test: /\.css$/,
                use: [ 'style-loader', 'css-loader' ]
            },
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'babel-loader',
                query: {
                    presets: ['es2015'],
                    plugins: ['transform-runtime']
                }
            }
        ]
    }
}
