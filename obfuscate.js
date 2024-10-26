const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');
const Terser = require('terser');

// Directories
const srcDir = path.join(__dirname, 'html/javascript'); // Directory containing your JS files
const projectDir = __dirname; // Root directory of your project
const destDir = path.join(__dirname, 'obfuscated'); // Output directory

// Create output directory if it doesn't exist
if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

// Function to copy all project files except the folder and obfuscate.js
function copyProjectFiles(src, dest) {
    console.log("Copying project files...");

    const items = fs.readdirSync(src);
    
    for (const item of items) {
        const itemPath = path.join(src, item);
        const destPath = path.join(dest, item);
        
        const skipDirectories = [
            'obfuscated',
            'node_modules',
            'server',
            'dist'
        ];

        // Skip specific directories
        if (skipDirectories.includes(path.basename(itemPath))) {
            console.log(`Skipping folder: ${item}`);
            continue;
        }

        const skipFiles = [
            'obfuscate.js',
            'index.js',
            'IconMouseNormal.png',
            'IconMouseOver.png',
            'package.json',
            'package-lock.json'
        ];
        
        // Skip specific files
        if (skipFiles.includes(path.basename(itemPath))) {
            console.log(`Skipping ${item}`);
            continue;
        }
        

        if (fs.statSync(itemPath).isDirectory()) {
            // Create directory in destination and copy its contents
            fs.mkdirSync(destPath, { recursive: true });
            copyProjectFiles(itemPath, destPath);
        } else {
            // Copy all files including package.json and .json files
            fs.copyFileSync(itemPath, destPath);
            console.log(`Project file copied: ${item}`);
        }
    }
}

// Function to obfuscate and minify JavaScript files
async function obfuscateJavaScriptFiles(src, dest) {
    console.log("Starting the obfuscation process for JavaScript files...");

    // Read all files and directories in the source directory
    const items = fs.readdirSync(src);

    for (const item of items) {
        const itemPath = path.join(src, item);
        const destPath = path.join(dest, item);

        // Check if the item is a directory
        if (fs.statSync(itemPath).isDirectory()) {
            // Recursively process the directory
            await obfuscateJavaScriptFiles(itemPath, destPath);
        } else if (path.extname(item).toLowerCase() === '.js') { // Check for .js files
            // Obfuscate JavaScript files
            console.log(`Processing JavaScript file: ${item}`);
            try {
                const code = fs.readFileSync(itemPath, 'utf8');

                // Minify JavaScript code using Terser
                const minifiedResult = await Terser.minify(code);
                if (minifiedResult.error) {
                    throw minifiedResult.error;
                }

                console.log(`Minified code for ${item}:`, minifiedResult.code);

                // Obfuscate the minified JavaScript code with unique variable naming
                const obfuscationResult = JavaScriptObfuscator.obfuscate(minifiedResult.code, {
                    compact: true,
                    controlFlowFlattening: true, // Optional: controls complexity of the control flow
                    deadCodeInjection: true, // Optional: adds dead code
                    stringArray: true, // Optional: uses a string array for strings
                    stringArrayEncoding: ['base64'], // Optional: encodes strings to base64
                    selfDefending: true, // Makes the code self-defending
                    transformObjectKeys: true, // Transforms object keys
                    numbersToExpressions: true, // Converts numbers to expressions
                    rotateStringArray: true, // Rotates the string array
                    simplify: true, // Simplifies the code
                });                

                // Write the obfuscated code to the destination path
                fs.writeFileSync(destPath, obfuscationResult.getObfuscatedCode());
                console.log(`Obfuscated and replaced: ${item}`);
            } catch (err) {
                console.error(`Failed to process ${item}:`, err);
            }
        }
    }
}


// Start copying project files first
copyProjectFiles(projectDir, destDir);

// After copying, obfuscate the JavaScript files
obfuscateJavaScriptFiles(srcDir, path.join(destDir, 'html/javascript'))
    .then(() => console.log('Obfuscation completed!'))
    .catch(err => console.error('Obfuscation failed:', err));
