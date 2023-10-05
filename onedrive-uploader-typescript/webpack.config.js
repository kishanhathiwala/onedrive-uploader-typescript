const path = require('path');

module.exports = {
    entry: './app.ts', // Your TypeScript entry file
    output: {
        filename: 'bundle.js', // Output bundle file
        path: path.resolve(__dirname, 'dist'), // Output directory
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js'], // File extensions to resolve
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader', // Use ts-loader for TypeScript files
                exclude: /node_modules/,
            },
        ],
    },
    target: 'node', // Specify the target environment (Node.js)
};