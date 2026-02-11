const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: {
      background: './src/background/index.ts',
      content: './src/content/index.ts',
      popup: './src/popup/index.tsx',
      options: './src/options/index.tsx',
      blocked: './src/blocked/index.tsx',
      help: './src/help/index.tsx',
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: 'ts-loader',
            options: {
              onlyCompileBundledFiles: true,
              transpileOnly: true,
            },
          },
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
          ],
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: '[name].css',
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'public/manifest.json',
            to: 'manifest.json',
          },
          {
            from: 'public/icons',
            to: 'icons',
          },
        ],
      }),
      new HtmlWebpackPlugin({
        template: './src/popup/index.html',
        filename: 'popup.html',
        chunks: ['vendor', 'styles', 'popup'],
        chunksSortMode: 'manual',
      }),
      new HtmlWebpackPlugin({
        template: './src/options/index.html',
        filename: 'options.html',
        chunks: ['vendor', 'styles', 'options'],
        chunksSortMode: 'manual',
      }),
      new HtmlWebpackPlugin({
        template: './src/blocked/index.html',
        filename: 'blocked.html',
        chunks: ['vendor', 'styles', 'blocked'],
        chunksSortMode: 'manual',
      }),
      new HtmlWebpackPlugin({
        template: './src/help/index.html',
        filename: 'help.html',
        chunks: ['vendor', 'styles', 'help'],
        chunksSortMode: 'manual',
      }),
    ],
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction,
              drop_debugger: isProduction,
              pure_funcs: isProduction ? ['console.log', 'console.debug'] : [],
              passes: 2,
            },
            mangle: true,
            output: {
              comments: false,
            },
          },
          extractComments: false,
        }),
      ],
      usedExports: true,
      sideEffects: true,
      splitChunks: {
        cacheGroups: {
          styles: {
            name: 'styles',
            type: 'css/mini-extract',
            chunks: (chunk) => {
              return chunk.name === 'popup' || chunk.name === 'options' || chunk.name === 'blocked' || chunk.name === 'help';
            },
            enforce: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            name: 'vendor',
            chunks: (chunk) => {
              return chunk.name === 'popup' || chunk.name === 'options' || chunk.name === 'blocked' || chunk.name === 'help';
            },
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      },
    },
    devtool: isProduction ? false : 'cheap-module-source-map',
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 256000,
      maxAssetSize: 256000,
    },
  };
};
