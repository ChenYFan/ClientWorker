import path from 'path'
import { fileURLToPath } from 'url';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import TerserPlugin from 'terser-webpack-plugin';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const development = 0
export default {
    entry: './main/entry.js',
    optimization: {
        minimize: !development,
        minimizer: [
            new TerserPlugin({
              extractComments: false,
            }),
          ],
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: 'cw.js',
    }
}