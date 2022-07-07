import path from 'path'
import { fileURLToPath } from 'url';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const development = false
export default {
    entry: './main/entry.js',
    optimization: {
        minimize: !development
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: 'cw.js',
    }
}