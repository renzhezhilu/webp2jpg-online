/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

const pMap = (iterable, mapper, options) => new Promise((resolve, reject) => {
	options = Object.assign({
		concurrency: Infinity
	}, options);

	if (typeof mapper !== 'function') {
		throw new TypeError('Mapper function is required');
	}

	const {concurrency} = options;

	if (!(typeof concurrency === 'number' && concurrency >= 1)) {
		throw new TypeError(`Expected \`concurrency\` to be a number from 1 and up, got \`${concurrency}\` (${typeof concurrency})`);
	}

	const ret = [];
	const iterator = iterable[Symbol.iterator]();
	let isRejected = false;
	let isIterableDone = false;
	let resolvingCount = 0;
	let currentIndex = 0;

	const next = () => {
		if (isRejected) {
			return;
		}

		const nextItem = iterator.next();
		const i = currentIndex;
		currentIndex++;

		if (nextItem.done) {
			isIterableDone = true;

			if (resolvingCount === 0) {
				resolve(ret);
			}

			return;
		}

		resolvingCount++;

		Promise.resolve(nextItem.value)
			.then(element => mapper(element, i))
			.then(
				value => {
					ret[i] = value;
					resolvingCount--;
					next();
				},
				error => {
					isRejected = true;
					reject(error);
				}
			);
	};

	for (let i = 0; i < concurrency; i++) {
		next();

		if (isIterableDone) {
			break;
		}
	}
});

var pMap_1 = pMap;
var default_1 = pMap;
pMap_1.default = default_1;

// internal misc utilities
function values(object) {
    return Object.keys(object).map(name => object[name]);
}
function flat(arr) {
    return arr.reduce((a, b) => a.concat(b));
}
// export function trimNoNewLines(s: string): string {
//   return s.replace(/^ +/, '').replace(/ +$/, '')
// }

// TODO: store variables from text file output and reuse them. example:
// `
// color=$(convert filename.png -format "%[pixel:p{0,0}]" info:foo.txt)
// convert filename.png -alpha off -bordercolor $color -border 1 \
//     \( +clone -fuzz 30% -fill none -floodfill +0+0 $color \
//        -alpha extract -geometry 200% -blur 0x0.5 \
//        -morphology erode square:1 -geometry 50% \) \
//     -compose CopyOpacity -composite -shave 1 outputfilename.png
// `
/**
 * Generates a valid command line command from given `string[]` command. Works with a single command.
 */
function arrayToCliOne(command) {
    return command
        .map(c => c + '')
        // if it contain spaces
        .map(c => (c.trim().match(/\s/)) ? `'${c}'` : c)
        // escape parenthesis
        .map(c => c.trim() === '(' ? '\\(' : c.trim() === ')' ? '\\)' : c)
        .join(' ');
}
/**
 * Generates a valid command line string from given `string[]` that is compatible with  {@link call}. Works with multiple
 * commands by separating  them with new lines and support comand splitting in new lines using `\`.
 * See {@link ExecuteCommand} for more information.
 */
function arrayToCli(command) {
    const cmd = typeof command[0] === 'string' ? [command] : command;
    return cmd.map(arrayToCliOne).join('\n');
}
/**
 * Generates a command in the form of array of strings, compatible with {@link call} from given command line string . The string must contain only one command (no newlines).
 */
function cliToArrayOne(cliCommand) {
    let inString = false;
    const spaceIndexes = [0];
    for (let index = 0; index < cliCommand.length; index++) {
        const c = cliCommand[index];
        if (c.match(/[\s]/im) && !inString) {
            spaceIndexes.push(index);
        }
        if (c === `'`) {
            inString = !inString;
        }
    }
    spaceIndexes.push(cliCommand.length);
    const command = spaceIndexes
        .map((spaceIndex, i) => cliCommand.substring(i === 0 ? 0 : spaceIndexes[i - 1], spaceIndexes[i]).trim())
        .filter(s => !!s)
        // remove quotes
        .map(s => s.startsWith(`'`) ? s.substring(1, s.length) : s)
        .map(s => s.endsWith(`'`) ? s.substring(0, s.length - 1) : s)
        //  unescape parenthesis
        .map(s => s === `\\(` ? `(` : s === `\\)` ? `)` : s);
    return command;
}
/**
 * Generates a command in the form of `string[][]` that is compatible with {@link call} from given command line string.
 * This works for strings containing multiple commands in different lines. and also respect `\` character for continue the same
 * command in a new line. See {@link ExecuteCommand} for more information.
 */
function cliToArray(cliCommand) {
    const lines = cliCommand.split('\n')
        .map(s => s.trim()).map(cliToArrayOne)
        .filter(a => a && a.length);
    const result = [];
    let currentCommand = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line[line.length - 1] !== '\\') {
            currentCommand = currentCommand.concat(line);
            result.push(currentCommand);
            currentCommand = [];
        }
        else {
            currentCommand = currentCommand.concat(line.slice(0, line.length - 1));
        }
    }
    return result;
}
/**
 * Makes sure that given {@link ExecuteCommand}, in whatever syntax, is transformed to the form `string[][]` that is compatible with {@link call}
 */
function asCommand(c) {
    if (typeof c === 'string') {
        return asCommand([c]);
    }
    if (!c[0]) {
        return [];
    }
    if (typeof c[0] === 'string') {
        return flat(c.map((subCommand) => cliToArray(subCommand)));
    }
    return c;
}

function blobToUint8Array(blob) {
    return new Promise(resolve => {
        const fileReader = new FileReader();
        fileReader.onload = event => {
            const result = event.target.result;
            resolve(new Uint8Array(result));
        };
        fileReader.readAsArrayBuffer(blob);
    });
}
function blobToString(blb) {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.addEventListener('loadend', e => {
            const text = e.srcElement.result;
            resolve(text);
        });
        reader.readAsText(blb);
    });
}
function isInputFile(file) {
    return !!file.content;
}
function isOutputFile(file) {
    return !!file.blob;
}
function uint8ArrayToString(arr, charset = 'utf-8') {
    return new TextDecoder(charset).decode(arr);
}
/**
 * Read files as string. Useful when files contains plain text like in the output file info.txt of `convert logo: -format '%[pixel:p{0,0}]' info:info.txt`
 */
function readFileAsText(file) {
    return __awaiter(this, void 0, void 0, function* () {
        if (isInputFile(file)) {
            return uint8ArrayToString(file.content);
        }
        if (isOutputFile(file)) {
            return yield blobToString(file.blob);
        }
    });
}
function isImage(file) {
    return __awaiter(this, void 0, void 0, function* () {
        const { exitCode } = yield execute$$1({ inputFiles: [yield asInputFile(file)], commands: `identify ${file.name}` });
        return exitCode === 0;
    });
}
/**
 * Builds a new {@link MagickInputFile} by fetching the content of given url and optionally naming the file using given name
 * or extracting the file name from the url otherwise.
 */
function buildInputFile(url, name = getFileName(url)) {
    return __awaiter(this, void 0, void 0, function* () {
        const fetchedSourceImage = yield fetch(url);
        const arrayBuffer = yield fetchedSourceImage.arrayBuffer();
        const content = new Uint8Array(arrayBuffer);
        return { name, content };
    });
}
function uint8ArrayToBlob(arr) {
    return new Blob([arr]);
}
function outputFileToInputFile(file, name = file.name) {
    return __awaiter(this, void 0, void 0, function* () {
        return {
            name,
            content: yield blobToUint8Array(file.blob),
        };
    });
}
function inputFileToOutputFile(file, name = file.name) {
    return {
        name,
        blob: uint8ArrayToBlob(file.content),
    };
}
function asInputFile(f, name = f.name) {
    return __awaiter(this, void 0, void 0, function* () {
        let inputFile;
        if (isOutputFile(f)) {
            inputFile = yield outputFileToInputFile(f);
        }
        else {
            inputFile = f;
        }
        inputFile.name = name;
        return inputFile;
    });
}
function asOutputFile(f, name = f.name) {
    return __awaiter(this, void 0, void 0, function* () {
        let outputFile;
        if (isInputFile(f)) {
            outputFile = inputFileToOutputFile(f);
        }
        else {
            outputFile = f;
        }
        outputFile.name = name;
        return outputFile;
    });
}
function getFileName(url) {
    try {
        return decodeURIComponent(new URL(url).pathname.split('/').pop());
    }
    catch (error) {
        const s = `http://foo.com/${url}`;
        try {
            return decodeURIComponent(new URL(s).pathname.split('/').pop());
        }
        catch (error) {
            return url;
        }
    }
}
function getFileNameExtension(filePathOrUrl) {
    const s = getFileName(filePathOrUrl);
    return s.substring(s.lastIndexOf('.') + 1, s.length);
}

// utilities related to HTML (img) elements
/**
 * Will load given html img element src with the inline image content.
 * @param image the image to be loaded
 * @param el the html image element in which to load the image
 * @param forceBrowserSupport if true and the image extension is not supported by browsers, it will convert the image to png
 * and return that src so it can be shown in browsers
 */
function loadImageElement$$1(image, el, forceBrowserSupport = false) {
    return __awaiter(this, void 0, void 0, function* () {
        el.src = yield buildImageSrc$$1(image, forceBrowserSupport);
    });
}
/**
 * Return a string with the inline image content, suitable to be used to assign to an html img src attribute. See {@link loadImageElement}.
 * @param forceBrowserSupport if true and the image extension is not supported by browsers, it will convert the image to png
 * and return that src so it can be shown in browsers
 */
function buildImageSrc$$1(image, forceBrowserSupport = false) {
    return __awaiter(this, void 0, void 0, function* () {
        let img = image;
        const extension = getFileNameExtension(image.name);
        if (!extension || forceBrowserSupport && browserSupportedImageExtensions.indexOf(extension) === -1) {
            const { outputFiles } = yield execute$$1({ inputFiles: [yield asInputFile(image)], commands: `convert ${image.name} output.png` });
            outputFiles[0].name = image.name;
            img = outputFiles[0];
        }
        const outputFile = yield asOutputFile(img);
        return URL.createObjectURL(outputFile.blob);
    });
}
/**
 * Build `MagickInputFile[]` from given HTMLInputElement of type=file that user may used to select several files
 */
function getInputFilesFromHtmlInputElement$$1(el) {
    return __awaiter(this, void 0, void 0, function* () {
        const files = yield inputFileToUint8Array(el);
        return files.map(f => ({ name: f.file.name, content: f.content }));
    });
}
const browserSupportedImageExtensions = ['gif', 'png', 'jpg', 'webp'];
function inputFileFiles(el) {
    const files = [];
    for (let i = 0; i < el.files.length; i++) {
        const file = el.files.item(i);
        files.push(file);
    }
    return files;
}
function inputFileToUint8Array(el) {
    return __awaiter(this, void 0, void 0, function* () {
        return Promise.all(inputFileFiles(el).map((file) => __awaiter(this, void 0, void 0, function* () {
            const content = yield new Promise(resolve => {
                const reader = new FileReader();
                reader.addEventListener('loadend', e => {
                    resolve(new Uint8Array(reader.result));
                });
                reader.readAsArrayBuffer(file);
            });
            return { file, content };
        })));
    });
}

function getPixelColor$$1(img, x, y) {
    return __awaiter(this, void 0, void 0, function* () {
        const file = yield executeAndReturnOutputFile$$1({ inputFiles: [yield asInputFile(img)], commands: `convert ${img.name} -format '%[pixel:p{${x},${y}}]' info:info.txt` });
        return yield readFileAsText(file);
    });
}

let builtInImages;
const builtInImageNames$$1 = ['rose:', 'logo:', 'wizard:', 'granite:', 'netscape:'];
/**
 * Gets ImageMagick built-in images like `rose:`, `logo:`, etc in the form of {@link MagickInputFile}s
 */
function getBuiltInImages$$1() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!builtInImages) {
            builtInImages = yield pMap_1(builtInImageNames$$1, (name) => __awaiter(this, void 0, void 0, function* () {
                const info = yield extractInfo$$1(name);
                const { outputFiles } = yield execute$$1({ commands: `convert ${name} ${`output1.${info[0].image.format.toLowerCase()}`}` });
                outputFiles[0].name = name;
                return yield asInputFile(outputFiles[0]);
            }));
        }
        return builtInImages;
    });
}
/**
 * shortcut of {@link getBuiltInImages} to get a single image by name
 */
function getBuiltInImage$$1(name) {
    return __awaiter(this, void 0, void 0, function* () {
        const images = yield getBuiltInImages$$1();
        return images.find(f => f.name === name);
    });
}

/**
 * Compare the two images and return true if they are equal visually. Optionally, a margin of error can be provided using `fuzz`
 */
function compare$$1(img1, img2, fuzz = 0.015) {
    return __awaiter(this, void 0, void 0, function* () {
        const identical = yield compareNumber$$1(img1, img2);
        return identical <= fuzz;
    });
}
function compareNumber$$1(img1, img2) {
    return __awaiter(this, void 0, void 0, function* () {
        const imgs = [];
        let name1;
        let name2;
        if (typeof img1 !== 'string') {
            const inputFile = yield asInputFile(img1);
            imgs.push(inputFile);
            name1 = inputFile.name;
        }
        else {
            name1 = img1;
        }
        if (typeof img2 !== 'string') {
            const inputFile = yield asInputFile(img2);
            imgs.push(inputFile);
            name2 = inputFile.name;
        }
        else {
            name2 = img2;
        }
        const result = yield Call(imgs, ['convert', name1, name2, '-resize', '256x256^!', '-metric', 'RMSE', '-format', '%[distortion]', '-compare', 'info:info.txt']);
        const n = yield blobToString(result[0].blob);
        return parseFloat(n);
    });
}

/**
 * Execute `convert $IMG info.json` to extract image metadata. Returns the parsed info.json file contents
 * @param img could be a string in case you want to extract information about built in images like `rose:`
 */
function extractInfo$$1(img) {
    return __awaiter(this, void 0, void 0, function* () {
        // TODO: support several input images - we are already returning an array
        let name;
        let imgs;
        if (typeof img !== 'string') {
            imgs = [yield asInputFile(img)];
            name = imgs[0].name;
        }
        else {
            name = img;
            imgs = [];
        }
        const processedFiles = yield Call(imgs, ['convert', name, 'info.json']);
        try {
            return JSON.parse(yield blobToString(processedFiles[0].blob));
        }
        catch (ex) {
            return [{ error: ex }];
        }
    });
}

function getConfigureFolders$$1() {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield execute$$1(`convert -debug configure rose: info:`);
        const contains = `Searching for configure file:`;
        const folders = result.stderr
            .filter(line => line.includes(contains))
            .map(line => line.substring(line.indexOf(contains) + contains.length, line.length))
            .map(s => s.replace(/\/\//g, '/'))
            .map(s => s.substring(0, s.lastIndexOf('/')))
            .map(s => s.replace(/"/g, '').trim());
        return folders;
    });
}
// has some heuristic information regarding features (not) supported by wasm-imagemagick, for example, image formats
// heads up - all images spec/assets/to_rotate.* where converted using gimp unless explicitly saying otherwise
/**
 * list of image formats that are known to be supported by wasm-imagemagick. See `spec/formatSpec.ts`
 */
const knownSupportedReadWriteImageFormats$$1 = [
    'jpg', 'png',
    'psd',
    'tiff', 'xcf', 'gif', 'bmp', 'tga', 'miff', 'ico', 'dcm', 'xpm', 'pcx',
    //  'pix', // gives error
    'fits',
    // 'djvu', // read only support
    'ppm',
    'pgm',
    'pfm',
    'mng',
    'hdr',
    'dds',
    'otb',
    'txt',
];

/**
 * Execute first command in given config.
 */
function executeOne$$1(configOrCommand) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = asExecuteConfig$$1(configOrCommand);
        let result = {
            stderr: [],
            stdout: [],
            outputFiles: [],
            exitCode: 1,
        };
        try {
            config.inputFiles = config.inputFiles || [];
            const command = asCommand(config.commands)[0];
            const t0 = performance.now();
            executeListeners.forEach(listener => listener.beforeExecute({ command, took: performance.now() - t0, id: t0 }));
            result = yield call(config.inputFiles, command.map(c => c + ''));
            executeListeners.forEach(listener => listener.afterExecute({ command, took: performance.now() - t0, id: t0 }));
            if (result.exitCode) {
                return Object.assign({}, result, { errors: ['exit code: ' + result.exitCode + ' stderr: ' + result.stderr.join('\n')] });
            }
            return Object.assign({}, result, { errors: [undefined] });
        }
        catch (error) {
            return Object.assign({}, result, { errors: [error + ', exit code: ' + result.exitCode + ', stderr: ' + result.stderr.join('\n')] });
        }
    });
}
function isExecuteCommand$$1(arg) {
    return !!arg.commands;
}
/**
 * Transform  `configOrCommand: ExecuteConfig | ExecuteCommand` to a valid ExecuteConfig object
 */
function asExecuteConfig$$1(arg) {
    if (isExecuteCommand$$1(arg)) {
        return arg;
    }
    return {
        inputFiles: [],
        commands: arg,
    };
}
/**
 * `execute()` shortcut that useful for commands that return only one output file or when only one particular output file is relevant.
 * @param outputFileName optionally user can give the desired output file name
 * @returns If `outputFileName` is given the file with that name, the first output file otherwise or undefined
 * if no file match, or no output files where generated (like in an error).
 */
function executeAndReturnOutputFile$$1(configOrCommand, outputFileName) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = asExecuteConfig$$1(configOrCommand);
        const result = yield execute$$1(config);
        return outputFileName ? result.outputFiles.find(f => f.name === outputFileName) : (result.outputFiles.length && result.outputFiles[0] || undefined);
    });
}
const executeListeners = [];
function addExecuteListener$$1(l) {
    executeListeners.push(l);
}
/**
 * Execute all commands in given config serially in order. Output files from a command become available as
 * input files in next commands. In the following example we execute two commands. Notice how the second one uses `image2.png` which was the output file of the first one:
 *
 * ```ts
 * const { outputFiles, exitCode, stderr} = await execute({
 *   inputFiles: [await buildInputFile('fn.png', 'image1.png')],
 *   commands: `
 *     convert image1.png -bordercolor #ffee44 -background #eeff55 +polaroid image2.png
 *     convert image2.png -fill #997711 -tint 55 image3.jpg
 * `
 * })
 * if (exitCode) {
 *   alert(`There was an error with the command: ${stderr.join('\n')}`)
 * }
 * else {
 *   await loadImageElement(outputFiles.find(f => f.name==='image3.jpg'), document.getElementById('outputImage'))
 * }
 * ```
 *
 * See {@link ExecuteCommand} for different command syntax supported.
 *
 * See {@link ExecuteResult} for details on the object returned
 */
function execute$$1(configOrCommand) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = asExecuteConfig$$1(configOrCommand);
        config.inputFiles = config.inputFiles || [];
        const allOutputFiles = {};
        const allInputFiles = {};
        config.inputFiles.forEach(f => {
            allInputFiles[f.name] = f;
        });
        let allErrors = [];
        const results = [];
        let allStdout = [];
        let allStderr = [];
        function mapper(c) {
            return __awaiter(this, void 0, void 0, function* () {
                const thisConfig = {
                    inputFiles: values(allInputFiles),
                    commands: [c],
                };
                const result = yield executeOne$$1(thisConfig);
                results.push(result);
                allErrors = allErrors.concat(result.errors || []);
                allStdout = allStdout.concat(result.stdout || []);
                allStderr = allStderr.concat(result.stderr || []);
                yield pMap_1(result.outputFiles, (f) => __awaiter(this, void 0, void 0, function* () {
                    allOutputFiles[f.name] = f;
                    const inputFile = yield asInputFile(f);
                    allInputFiles[inputFile.name] = inputFile;
                }));
            });
        }
        const commands = asCommand(config.commands);
        yield pMap_1(commands, mapper, { concurrency: 1 });
        const resultWithError = results.find(r => r.exitCode !== 0);
        return {
            outputFiles: values(allOutputFiles),
            errors: allErrors,
            results,
            stdout: allStdout,
            stderr: allStderr,
            exitCode: resultWithError ? resultWithError.exitCode : 0,
        };
    });
}

class ImageHomeImpl {
    constructor() {
        this.images = {};
        this.builtInImagesAdded = false;
    }
    get(name) {
        return this.images[name];
    }
    remove(names) {
        const result = [];
        Object.keys(this.images).forEach(name => {
            if (names.indexOf(name) !== -1) {
                result.push(this.images[name]);
                delete this.images[name];
            }
        });
        return result;
    }
    getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Promise.all(values(this.images));
        });
    }
    register(file, name = file.name) {
        const promise = asInputFile(file);
        this.images[name] = promise;
        this.images[name].then(() => {
            promise.resolved = true;
        });
        return promise;
    }
    isRegistered(name, andReady = true) {
        return this.images[name] && (andReady && this.images[name].resolved);
    }
    addBuiltInImages() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.builtInImagesAdded) {
                yield pMap_1(yield getBuiltInImages$$1(), img => this.register(img));
                this.builtInImagesAdded = true;
            }
        });
    }
}
function createImageHome$$1() { return new ImageHomeImpl(); }

class ExecutionContextImpl {
    constructor(imageHome = createImageHome$$1()) {
        this.imageHome = imageHome;
    }
    execute(configOrCommands) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = asExecuteConfig$$1(configOrCommands);
            config.inputFiles.forEach(f => {
                this.imageHome.register(f);
            });
            const inputFiles = yield this.imageHome.getAll();
            const result = yield execute$$1(Object.assign({}, config, { inputFiles }));
            result.outputFiles.forEach(f => {
                this.imageHome.register(f);
            });
            return result;
        });
    }
    addFiles(files) {
        files.forEach(f => this.imageHome.register(f));
    }
    getAllFiles() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.imageHome.getAll();
        });
    }
    getFile(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.imageHome.get(name);
        });
    }
    addBuiltInImages() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.imageHome.addBuiltInImages();
        });
    }
    removeFiles(names) {
        return this.imageHome.remove(names);
    }
    static create(inheritFrom) {
        if (inheritFrom && !inheritFrom.imageHome) {
            throw new Error('Dont know how to inherit from other ExecutionContext implementation than this one');
        }
        return new ExecutionContextImpl(inheritFrom && inheritFrom.imageHome);
    }
}
function newExecutionContext$$1(inheritFrom) {
    return ExecutionContextImpl.create(inheritFrom);
}

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var stackframe = createCommonjsModule(function (module, exports) {
(function(root, factory) {
    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.

    /* istanbul ignore next */
    {
        module.exports = factory();
    }
}(commonjsGlobal, function() {
    function _isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    function _capitalize(str) {
        return str.charAt(0).toUpperCase() + str.substring(1);
    }

    function _getter(p) {
        return function() {
            return this[p];
        };
    }

    var booleanProps = ['isConstructor', 'isEval', 'isNative', 'isToplevel'];
    var numericProps = ['columnNumber', 'lineNumber'];
    var stringProps = ['fileName', 'functionName', 'source'];
    var arrayProps = ['args'];

    var props = booleanProps.concat(numericProps, stringProps, arrayProps);

    function StackFrame(obj) {
        if (obj instanceof Object) {
            for (var i = 0; i < props.length; i++) {
                if (obj.hasOwnProperty(props[i]) && obj[props[i]] !== undefined) {
                    this['set' + _capitalize(props[i])](obj[props[i]]);
                }
            }
        }
    }

    StackFrame.prototype = {
        getArgs: function() {
            return this.args;
        },
        setArgs: function(v) {
            if (Object.prototype.toString.call(v) !== '[object Array]') {
                throw new TypeError('Args must be an Array');
            }
            this.args = v;
        },

        getEvalOrigin: function() {
            return this.evalOrigin;
        },
        setEvalOrigin: function(v) {
            if (v instanceof StackFrame) {
                this.evalOrigin = v;
            } else if (v instanceof Object) {
                this.evalOrigin = new StackFrame(v);
            } else {
                throw new TypeError('Eval Origin must be an Object or StackFrame');
            }
        },

        toString: function() {
            var functionName = this.getFunctionName() || '{anonymous}';
            var args = '(' + (this.getArgs() || []).join(',') + ')';
            var fileName = this.getFileName() ? ('@' + this.getFileName()) : '';
            var lineNumber = _isNumber(this.getLineNumber()) ? (':' + this.getLineNumber()) : '';
            var columnNumber = _isNumber(this.getColumnNumber()) ? (':' + this.getColumnNumber()) : '';
            return functionName + args + fileName + lineNumber + columnNumber;
        }
    };

    for (var i = 0; i < booleanProps.length; i++) {
        StackFrame.prototype['get' + _capitalize(booleanProps[i])] = _getter(booleanProps[i]);
        StackFrame.prototype['set' + _capitalize(booleanProps[i])] = (function(p) {
            return function(v) {
                this[p] = Boolean(v);
            };
        })(booleanProps[i]);
    }

    for (var j = 0; j < numericProps.length; j++) {
        StackFrame.prototype['get' + _capitalize(numericProps[j])] = _getter(numericProps[j]);
        StackFrame.prototype['set' + _capitalize(numericProps[j])] = (function(p) {
            return function(v) {
                if (!_isNumber(v)) {
                    throw new TypeError(p + ' must be a Number');
                }
                this[p] = Number(v);
            };
        })(numericProps[j]);
    }

    for (var k = 0; k < stringProps.length; k++) {
        StackFrame.prototype['get' + _capitalize(stringProps[k])] = _getter(stringProps[k]);
        StackFrame.prototype['set' + _capitalize(stringProps[k])] = (function(p) {
            return function(v) {
                this[p] = String(v);
            };
        })(stringProps[k]);
    }

    return StackFrame;
}));
});

var errorStackParser = createCommonjsModule(function (module, exports) {
(function(root, factory) {
    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.

    /* istanbul ignore next */
    {
        module.exports = factory(stackframe);
    }
}(commonjsGlobal, function ErrorStackParser(StackFrame) {

    var FIREFOX_SAFARI_STACK_REGEXP = /(^|@)\S+\:\d+/;
    var CHROME_IE_STACK_REGEXP = /^\s*at .*(\S+\:\d+|\(native\))/m;
    var SAFARI_NATIVE_CODE_REGEXP = /^(eval@)?(\[native code\])?$/;

    return {
        /**
         * Given an Error object, extract the most information from it.
         *
         * @param {Error} error object
         * @return {Array} of StackFrames
         */
        parse: function ErrorStackParser$$parse(error) {
            if (typeof error.stacktrace !== 'undefined' || typeof error['opera#sourceloc'] !== 'undefined') {
                return this.parseOpera(error);
            } else if (error.stack && error.stack.match(CHROME_IE_STACK_REGEXP)) {
                return this.parseV8OrIE(error);
            } else if (error.stack) {
                return this.parseFFOrSafari(error);
            } else {
                throw new Error('Cannot parse given Error object');
            }
        },

        // Separate line and column numbers from a string of the form: (URI:Line:Column)
        extractLocation: function ErrorStackParser$$extractLocation(urlLike) {
            // Fail-fast but return locations like "(native)"
            if (urlLike.indexOf(':') === -1) {
                return [urlLike];
            }

            var regExp = /(.+?)(?:\:(\d+))?(?:\:(\d+))?$/;
            var parts = regExp.exec(urlLike.replace(/[\(\)]/g, ''));
            return [parts[1], parts[2] || undefined, parts[3] || undefined];
        },

        parseV8OrIE: function ErrorStackParser$$parseV8OrIE(error) {
            var filtered = error.stack.split('\n').filter(function(line) {
                return !!line.match(CHROME_IE_STACK_REGEXP);
            }, this);

            return filtered.map(function(line) {
                if (line.indexOf('(eval ') > -1) {
                    // Throw away eval information until we implement stacktrace.js/stackframe#8
                    line = line.replace(/eval code/g, 'eval').replace(/(\(eval at [^\()]*)|(\)\,.*$)/g, '');
                }
                var tokens = line.replace(/^\s+/, '').replace(/\(eval code/g, '(').split(/\s+/).slice(1);
                var locationParts = this.extractLocation(tokens.pop());
                var functionName = tokens.join(' ') || undefined;
                var fileName = ['eval', '<anonymous>'].indexOf(locationParts[0]) > -1 ? undefined : locationParts[0];

                return new StackFrame({
                    functionName: functionName,
                    fileName: fileName,
                    lineNumber: locationParts[1],
                    columnNumber: locationParts[2],
                    source: line
                });
            }, this);
        },

        parseFFOrSafari: function ErrorStackParser$$parseFFOrSafari(error) {
            var filtered = error.stack.split('\n').filter(function(line) {
                return !line.match(SAFARI_NATIVE_CODE_REGEXP);
            }, this);

            return filtered.map(function(line) {
                // Throw away eval information until we implement stacktrace.js/stackframe#8
                if (line.indexOf(' > eval') > -1) {
                    line = line.replace(/ line (\d+)(?: > eval line \d+)* > eval\:\d+\:\d+/g, ':$1');
                }

                if (line.indexOf('@') === -1 && line.indexOf(':') === -1) {
                    // Safari eval frames only have function names and nothing else
                    return new StackFrame({
                        functionName: line
                    });
                } else {
                    var functionNameRegex = /((.*".+"[^@]*)?[^@]*)(?:@)/;
                    var matches = line.match(functionNameRegex);
                    var functionName = matches && matches[1] ? matches[1] : undefined;
                    var locationParts = this.extractLocation(line.replace(functionNameRegex, ''));

                    return new StackFrame({
                        functionName: functionName,
                        fileName: locationParts[0],
                        lineNumber: locationParts[1],
                        columnNumber: locationParts[2],
                        source: line
                    });
                }
            }, this);
        },

        parseOpera: function ErrorStackParser$$parseOpera(e) {
            if (!e.stacktrace || (e.message.indexOf('\n') > -1 &&
                e.message.split('\n').length > e.stacktrace.split('\n').length)) {
                return this.parseOpera9(e);
            } else if (!e.stack) {
                return this.parseOpera10(e);
            } else {
                return this.parseOpera11(e);
            }
        },

        parseOpera9: function ErrorStackParser$$parseOpera9(e) {
            var lineRE = /Line (\d+).*script (?:in )?(\S+)/i;
            var lines = e.message.split('\n');
            var result = [];

            for (var i = 2, len = lines.length; i < len; i += 2) {
                var match = lineRE.exec(lines[i]);
                if (match) {
                    result.push(new StackFrame({
                        fileName: match[2],
                        lineNumber: match[1],
                        source: lines[i]
                    }));
                }
            }

            return result;
        },

        parseOpera10: function ErrorStackParser$$parseOpera10(e) {
            var lineRE = /Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i;
            var lines = e.stacktrace.split('\n');
            var result = [];

            for (var i = 0, len = lines.length; i < len; i += 2) {
                var match = lineRE.exec(lines[i]);
                if (match) {
                    result.push(
                        new StackFrame({
                            functionName: match[3] || undefined,
                            fileName: match[2],
                            lineNumber: match[1],
                            source: lines[i]
                        })
                    );
                }
            }

            return result;
        },

        // Opera 10.65+ Error.stack very similar to FF/Safari
        parseOpera11: function ErrorStackParser$$parseOpera11(error) {
            var filtered = error.stack.split('\n').filter(function(line) {
                return !!line.match(FIREFOX_SAFARI_STACK_REGEXP) && !line.match(/^Error created at/);
            }, this);

            return filtered.map(function(line) {
                var tokens = line.split('@');
                var locationParts = this.extractLocation(tokens.pop());
                var functionCall = (tokens.shift() || '');
                var functionName = functionCall
                        .replace(/<anonymous function(: (\w+))?>/, '$2')
                        .replace(/\([^\)]*\)/g, '') || undefined;
                var argsRaw;
                if (functionCall.match(/\(([^\)]*)\)/)) {
                    argsRaw = functionCall.replace(/^[^\(]+\(([^\)]*)\)$/, '$1');
                }
                var args = (argsRaw === undefined || argsRaw === '[arguments not available]') ?
                    undefined : argsRaw.split(',');

                return new StackFrame({
                    functionName: functionName,
                    args: args,
                    fileName: locationParts[0],
                    lineNumber: locationParts[1],
                    columnNumber: locationParts[2],
                    source: line
                });
            }, this);
        }
    };
}));
});

var stackGenerator = createCommonjsModule(function (module, exports) {
(function(root, factory) {
    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.

    /* istanbul ignore next */
    {
        module.exports = factory(stackframe);
    }
}(commonjsGlobal, function(StackFrame) {
    return {
        backtrace: function StackGenerator$$backtrace(opts) {
            var stack = [];
            var maxStackSize = 10;

            if (typeof opts === 'object' && typeof opts.maxStackSize === 'number') {
                maxStackSize = opts.maxStackSize;
            }

            var curr = arguments.callee;
            while (curr && stack.length < maxStackSize && curr['arguments']) {
                // Allow V8 optimizations
                var args = new Array(curr['arguments'].length);
                for (var i = 0; i < args.length; ++i) {
                    args[i] = curr['arguments'][i];
                }
                if (/function(?:\s+([\w$]+))+\s*\(/.test(curr.toString())) {
                    stack.push(new StackFrame({functionName: RegExp.$1 || undefined, args: args}));
                } else {
                    stack.push(new StackFrame({args: args}));
                }

                try {
                    curr = curr.caller;
                } catch (e) {
                    break;
                }
            }
            return stack;
        }
    };
}));
});

var util = createCommonjsModule(function (module, exports) {
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

/**
 * This is a helper function for getting values from parameter/options
 * objects.
 *
 * @param args The object we are extracting values from
 * @param name The name of the property we are getting.
 * @param defaultValue An optional value to return if the property is missing
 * from the object. If this is not specified and the property is missing, an
 * error will be thrown.
 */
function getArg(aArgs, aName, aDefaultValue) {
  if (aName in aArgs) {
    return aArgs[aName];
  } else if (arguments.length === 3) {
    return aDefaultValue;
  } else {
    throw new Error('"' + aName + '" is a required argument.');
  }
}
exports.getArg = getArg;

var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.]*)(?::(\d+))?(\S*)$/;
var dataUrlRegexp = /^data:.+\,.+$/;

function urlParse(aUrl) {
  var match = aUrl.match(urlRegexp);
  if (!match) {
    return null;
  }
  return {
    scheme: match[1],
    auth: match[2],
    host: match[3],
    port: match[4],
    path: match[5]
  };
}
exports.urlParse = urlParse;

function urlGenerate(aParsedUrl) {
  var url = '';
  if (aParsedUrl.scheme) {
    url += aParsedUrl.scheme + ':';
  }
  url += '//';
  if (aParsedUrl.auth) {
    url += aParsedUrl.auth + '@';
  }
  if (aParsedUrl.host) {
    url += aParsedUrl.host;
  }
  if (aParsedUrl.port) {
    url += ":" + aParsedUrl.port;
  }
  if (aParsedUrl.path) {
    url += aParsedUrl.path;
  }
  return url;
}
exports.urlGenerate = urlGenerate;

/**
 * Normalizes a path, or the path portion of a URL:
 *
 * - Replaces consecutive slashes with one slash.
 * - Removes unnecessary '.' parts.
 * - Removes unnecessary '<dir>/..' parts.
 *
 * Based on code in the Node.js 'path' core module.
 *
 * @param aPath The path or url to normalize.
 */
function normalize(aPath) {
  var path = aPath;
  var url = urlParse(aPath);
  if (url) {
    if (!url.path) {
      return aPath;
    }
    path = url.path;
  }
  var isAbsolute = exports.isAbsolute(path);

  var parts = path.split(/\/+/);
  for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
    part = parts[i];
    if (part === '.') {
      parts.splice(i, 1);
    } else if (part === '..') {
      up++;
    } else if (up > 0) {
      if (part === '') {
        // The first part is blank if the path is absolute. Trying to go
        // above the root is a no-op. Therefore we can remove all '..' parts
        // directly after the root.
        parts.splice(i + 1, up);
        up = 0;
      } else {
        parts.splice(i, 2);
        up--;
      }
    }
  }
  path = parts.join('/');

  if (path === '') {
    path = isAbsolute ? '/' : '.';
  }

  if (url) {
    url.path = path;
    return urlGenerate(url);
  }
  return path;
}
exports.normalize = normalize;

/**
 * Joins two paths/URLs.
 *
 * @param aRoot The root path or URL.
 * @param aPath The path or URL to be joined with the root.
 *
 * - If aPath is a URL or a data URI, aPath is returned, unless aPath is a
 *   scheme-relative URL: Then the scheme of aRoot, if any, is prepended
 *   first.
 * - Otherwise aPath is a path. If aRoot is a URL, then its path portion
 *   is updated with the result and aRoot is returned. Otherwise the result
 *   is returned.
 *   - If aPath is absolute, the result is aPath.
 *   - Otherwise the two paths are joined with a slash.
 * - Joining for example 'http://' and 'www.example.com' is also supported.
 */
function join(aRoot, aPath) {
  if (aRoot === "") {
    aRoot = ".";
  }
  if (aPath === "") {
    aPath = ".";
  }
  var aPathUrl = urlParse(aPath);
  var aRootUrl = urlParse(aRoot);
  if (aRootUrl) {
    aRoot = aRootUrl.path || '/';
  }

  // `join(foo, '//www.example.org')`
  if (aPathUrl && !aPathUrl.scheme) {
    if (aRootUrl) {
      aPathUrl.scheme = aRootUrl.scheme;
    }
    return urlGenerate(aPathUrl);
  }

  if (aPathUrl || aPath.match(dataUrlRegexp)) {
    return aPath;
  }

  // `join('http://', 'www.example.com')`
  if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
    aRootUrl.host = aPath;
    return urlGenerate(aRootUrl);
  }

  var joined = aPath.charAt(0) === '/'
    ? aPath
    : normalize(aRoot.replace(/\/+$/, '') + '/' + aPath);

  if (aRootUrl) {
    aRootUrl.path = joined;
    return urlGenerate(aRootUrl);
  }
  return joined;
}
exports.join = join;

exports.isAbsolute = function (aPath) {
  return aPath.charAt(0) === '/' || !!aPath.match(urlRegexp);
};

/**
 * Make a path relative to a URL or another path.
 *
 * @param aRoot The root path or URL.
 * @param aPath The path or URL to be made relative to aRoot.
 */
function relative(aRoot, aPath) {
  if (aRoot === "") {
    aRoot = ".";
  }

  aRoot = aRoot.replace(/\/$/, '');

  // It is possible for the path to be above the root. In this case, simply
  // checking whether the root is a prefix of the path won't work. Instead, we
  // need to remove components from the root one by one, until either we find
  // a prefix that fits, or we run out of components to remove.
  var level = 0;
  while (aPath.indexOf(aRoot + '/') !== 0) {
    var index = aRoot.lastIndexOf("/");
    if (index < 0) {
      return aPath;
    }

    // If the only part of the root that is left is the scheme (i.e. http://,
    // file:///, etc.), one or more slashes (/), or simply nothing at all, we
    // have exhausted all components, so the path is not relative to the root.
    aRoot = aRoot.slice(0, index);
    if (aRoot.match(/^([^\/]+:\/)?\/*$/)) {
      return aPath;
    }

    ++level;
  }

  // Make sure we add a "../" for each component we removed from the root.
  return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
}
exports.relative = relative;

var supportsNullProto = (function () {
  var obj = Object.create(null);
  return !('__proto__' in obj);
}());

function identity (s) {
  return s;
}

/**
 * Because behavior goes wacky when you set `__proto__` on objects, we
 * have to prefix all the strings in our set with an arbitrary character.
 *
 * See https://github.com/mozilla/source-map/pull/31 and
 * https://github.com/mozilla/source-map/issues/30
 *
 * @param String aStr
 */
function toSetString(aStr) {
  if (isProtoString(aStr)) {
    return '$' + aStr;
  }

  return aStr;
}
exports.toSetString = supportsNullProto ? identity : toSetString;

function fromSetString(aStr) {
  if (isProtoString(aStr)) {
    return aStr.slice(1);
  }

  return aStr;
}
exports.fromSetString = supportsNullProto ? identity : fromSetString;

function isProtoString(s) {
  if (!s) {
    return false;
  }

  var length = s.length;

  if (length < 9 /* "__proto__".length */) {
    return false;
  }

  if (s.charCodeAt(length - 1) !== 95  /* '_' */ ||
      s.charCodeAt(length - 2) !== 95  /* '_' */ ||
      s.charCodeAt(length - 3) !== 111 /* 'o' */ ||
      s.charCodeAt(length - 4) !== 116 /* 't' */ ||
      s.charCodeAt(length - 5) !== 111 /* 'o' */ ||
      s.charCodeAt(length - 6) !== 114 /* 'r' */ ||
      s.charCodeAt(length - 7) !== 112 /* 'p' */ ||
      s.charCodeAt(length - 8) !== 95  /* '_' */ ||
      s.charCodeAt(length - 9) !== 95  /* '_' */) {
    return false;
  }

  for (var i = length - 10; i >= 0; i--) {
    if (s.charCodeAt(i) !== 36 /* '$' */) {
      return false;
    }
  }

  return true;
}

/**
 * Comparator between two mappings where the original positions are compared.
 *
 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
 * mappings with the same original source/line/column, but different generated
 * line and column the same. Useful when searching for a mapping with a
 * stubbed out mapping.
 */
function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
  var cmp = mappingA.source - mappingB.source;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0 || onlyCompareOriginal) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  return mappingA.name - mappingB.name;
}
exports.compareByOriginalPositions = compareByOriginalPositions;

/**
 * Comparator between two mappings with deflated source and name indices where
 * the generated positions are compared.
 *
 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
 * mappings with the same generated line and column, but different
 * source/name/original line and column the same. Useful when searching for a
 * mapping with a stubbed out mapping.
 */
function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
  var cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0 || onlyCompareGenerated) {
    return cmp;
  }

  cmp = mappingA.source - mappingB.source;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0) {
    return cmp;
  }

  return mappingA.name - mappingB.name;
}
exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;

function strcmp(aStr1, aStr2) {
  if (aStr1 === aStr2) {
    return 0;
  }

  if (aStr1 > aStr2) {
    return 1;
  }

  return -1;
}

/**
 * Comparator between two mappings with inflated source and name strings where
 * the generated positions are compared.
 */
function compareByGeneratedPositionsInflated(mappingA, mappingB) {
  var cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = strcmp(mappingA.source, mappingB.source);
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0) {
    return cmp;
  }

  return strcmp(mappingA.name, mappingB.name);
}
exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;
});
var util_1 = util.getArg;
var util_2 = util.urlParse;
var util_3 = util.urlGenerate;
var util_4 = util.normalize;
var util_5 = util.join;
var util_6 = util.isAbsolute;
var util_7 = util.relative;
var util_8 = util.toSetString;
var util_9 = util.fromSetString;
var util_10 = util.compareByOriginalPositions;
var util_11 = util.compareByGeneratedPositionsDeflated;
var util_12 = util.compareByGeneratedPositionsInflated;

var binarySearch = createCommonjsModule(function (module, exports) {
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

exports.GREATEST_LOWER_BOUND = 1;
exports.LEAST_UPPER_BOUND = 2;

/**
 * Recursive implementation of binary search.
 *
 * @param aLow Indices here and lower do not contain the needle.
 * @param aHigh Indices here and higher do not contain the needle.
 * @param aNeedle The element being searched for.
 * @param aHaystack The non-empty array being searched.
 * @param aCompare Function which takes two elements and returns -1, 0, or 1.
 * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
 *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 */
function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare, aBias) {
  // This function terminates when one of the following is true:
  //
  //   1. We find the exact element we are looking for.
  //
  //   2. We did not find the exact element, but we can return the index of
  //      the next-closest element.
  //
  //   3. We did not find the exact element, and there is no next-closest
  //      element than the one we are searching for, so we return -1.
  var mid = Math.floor((aHigh - aLow) / 2) + aLow;
  var cmp = aCompare(aNeedle, aHaystack[mid], true);
  if (cmp === 0) {
    // Found the element we are looking for.
    return mid;
  }
  else if (cmp > 0) {
    // Our needle is greater than aHaystack[mid].
    if (aHigh - mid > 1) {
      // The element is in the upper half.
      return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare, aBias);
    }

    // The exact needle element was not found in this haystack. Determine if
    // we are in termination case (3) or (2) and return the appropriate thing.
    if (aBias == exports.LEAST_UPPER_BOUND) {
      return aHigh < aHaystack.length ? aHigh : -1;
    } else {
      return mid;
    }
  }
  else {
    // Our needle is less than aHaystack[mid].
    if (mid - aLow > 1) {
      // The element is in the lower half.
      return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare, aBias);
    }

    // we are in termination case (3) or (2) and return the appropriate thing.
    if (aBias == exports.LEAST_UPPER_BOUND) {
      return mid;
    } else {
      return aLow < 0 ? -1 : aLow;
    }
  }
}

/**
 * This is an implementation of binary search which will always try and return
 * the index of the closest element if there is no exact hit. This is because
 * mappings between original and generated line/col pairs are single points,
 * and there is an implicit region between each of them, so a miss just means
 * that you aren't on the very start of a region.
 *
 * @param aNeedle The element you are looking for.
 * @param aHaystack The array that is being searched.
 * @param aCompare A function which takes the needle and an element in the
 *     array and returns -1, 0, or 1 depending on whether the needle is less
 *     than, equal to, or greater than the element, respectively.
 * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
 *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'binarySearch.GREATEST_LOWER_BOUND'.
 */
exports.search = function search(aNeedle, aHaystack, aCompare, aBias) {
  if (aHaystack.length === 0) {
    return -1;
  }

  var index = recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack,
                              aCompare, aBias || exports.GREATEST_LOWER_BOUND);
  if (index < 0) {
    return -1;
  }

  // We have found either the exact element, or the next-closest element than
  // the one we are searching for. However, there may be more than one such
  // element. Make sure we always return the smallest of these.
  while (index - 1 >= 0) {
    if (aCompare(aHaystack[index], aHaystack[index - 1], true) !== 0) {
      break;
    }
    --index;
  }

  return index;
};
});
var binarySearch_1 = binarySearch.GREATEST_LOWER_BOUND;
var binarySearch_2 = binarySearch.LEAST_UPPER_BOUND;
var binarySearch_3 = binarySearch.search;

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */


var has = Object.prototype.hasOwnProperty;

/**
 * A data structure which is a combination of an array and a set. Adding a new
 * member is O(1), testing for membership is O(1), and finding the index of an
 * element is O(1). Removing elements from the set is not supported. Only
 * strings are supported for membership.
 */
function ArraySet() {
  this._array = [];
  this._set = Object.create(null);
}

/**
 * Static method for creating ArraySet instances from an existing array.
 */
ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
  var set = new ArraySet();
  for (var i = 0, len = aArray.length; i < len; i++) {
    set.add(aArray[i], aAllowDuplicates);
  }
  return set;
};

/**
 * Return how many unique items are in this ArraySet. If duplicates have been
 * added, than those do not count towards the size.
 *
 * @returns Number
 */
ArraySet.prototype.size = function ArraySet_size() {
  return Object.getOwnPropertyNames(this._set).length;
};

/**
 * Add the given string to this set.
 *
 * @param String aStr
 */
ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
  var sStr = util.toSetString(aStr);
  var isDuplicate = has.call(this._set, sStr);
  var idx = this._array.length;
  if (!isDuplicate || aAllowDuplicates) {
    this._array.push(aStr);
  }
  if (!isDuplicate) {
    this._set[sStr] = idx;
  }
};

/**
 * Is the given string a member of this set?
 *
 * @param String aStr
 */
ArraySet.prototype.has = function ArraySet_has(aStr) {
  var sStr = util.toSetString(aStr);
  return has.call(this._set, sStr);
};

/**
 * What is the index of the given string in the array?
 *
 * @param String aStr
 */
ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
  var sStr = util.toSetString(aStr);
  if (has.call(this._set, sStr)) {
    return this._set[sStr];
  }
  throw new Error('"' + aStr + '" is not in the set.');
};

/**
 * What is the element at the given index?
 *
 * @param Number aIdx
 */
ArraySet.prototype.at = function ArraySet_at(aIdx) {
  if (aIdx >= 0 && aIdx < this._array.length) {
    return this._array[aIdx];
  }
  throw new Error('No element indexed by ' + aIdx);
};

/**
 * Returns the array representation of this set (which has the proper indices
 * indicated by indexOf). Note that this is a copy of the internal array used
 * for storing the members so that no one can mess with internal state.
 */
ArraySet.prototype.toArray = function ArraySet_toArray() {
  return this._array.slice();
};

var ArraySet_1 = ArraySet;

var arraySet = {
	ArraySet: ArraySet_1
};

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var intToCharMap = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');

/**
 * Encode an integer in the range of 0 to 63 to a single base 64 digit.
 */
var encode = function (number) {
  if (0 <= number && number < intToCharMap.length) {
    return intToCharMap[number];
  }
  throw new TypeError("Must be between 0 and 63: " + number);
};

/**
 * Decode a single base 64 character code digit to an integer. Returns -1 on
 * failure.
 */
var decode = function (charCode) {
  var bigA = 65;     // 'A'
  var bigZ = 90;     // 'Z'

  var littleA = 97;  // 'a'
  var littleZ = 122; // 'z'

  var zero = 48;     // '0'
  var nine = 57;     // '9'

  var plus = 43;     // '+'
  var slash = 47;    // '/'

  var littleOffset = 26;
  var numberOffset = 52;

  // 0 - 25: ABCDEFGHIJKLMNOPQRSTUVWXYZ
  if (bigA <= charCode && charCode <= bigZ) {
    return (charCode - bigA);
  }

  // 26 - 51: abcdefghijklmnopqrstuvwxyz
  if (littleA <= charCode && charCode <= littleZ) {
    return (charCode - littleA + littleOffset);
  }

  // 52 - 61: 0123456789
  if (zero <= charCode && charCode <= nine) {
    return (charCode - zero + numberOffset);
  }

  // 62: +
  if (charCode == plus) {
    return 62;
  }

  // 63: /
  if (charCode == slash) {
    return 63;
  }

  // Invalid base64 digit.
  return -1;
};

var base64 = {
	encode: encode,
	decode: decode
};

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 *
 * Based on the Base 64 VLQ implementation in Closure Compiler:
 * https://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/debugging/sourcemap/Base64VLQ.java
 *
 * Copyright 2011 The Closure Compiler Authors. All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *  * Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above
 *    copyright notice, this list of conditions and the following
 *    disclaimer in the documentation and/or other materials provided
 *    with the distribution.
 *  * Neither the name of Google Inc. nor the names of its
 *    contributors may be used to endorse or promote products derived
 *    from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */



// A single base 64 digit can contain 6 bits of data. For the base 64 variable
// length quantities we use in the source map spec, the first bit is the sign,
// the next four bits are the actual value, and the 6th bit is the
// continuation bit. The continuation bit tells us whether there are more
// digits in this value following this digit.
//
//   Continuation
//   |    Sign
//   |    |
//   V    V
//   101011

var VLQ_BASE_SHIFT = 5;

// binary: 100000
var VLQ_BASE = 1 << VLQ_BASE_SHIFT;

// binary: 011111
var VLQ_BASE_MASK = VLQ_BASE - 1;

// binary: 100000
var VLQ_CONTINUATION_BIT = VLQ_BASE;

/**
 * Converts from a two-complement value to a value where the sign bit is
 * placed in the least significant bit.  For example, as decimals:
 *   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
 *   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
 */
function toVLQSigned(aValue) {
  return aValue < 0
    ? ((-aValue) << 1) + 1
    : (aValue << 1) + 0;
}

/**
 * Converts to a two-complement value from a value where the sign bit is
 * placed in the least significant bit.  For example, as decimals:
 *   2 (10 binary) becomes 1, 3 (11 binary) becomes -1
 *   4 (100 binary) becomes 2, 5 (101 binary) becomes -2
 */
function fromVLQSigned(aValue) {
  var isNegative = (aValue & 1) === 1;
  var shifted = aValue >> 1;
  return isNegative
    ? -shifted
    : shifted;
}

/**
 * Returns the base 64 VLQ encoded value.
 */
var encode$1 = function base64VLQ_encode(aValue) {
  var encoded = "";
  var digit;

  var vlq = toVLQSigned(aValue);

  do {
    digit = vlq & VLQ_BASE_MASK;
    vlq >>>= VLQ_BASE_SHIFT;
    if (vlq > 0) {
      // There are still more digits in this value, so we must make sure the
      // continuation bit is marked.
      digit |= VLQ_CONTINUATION_BIT;
    }
    encoded += base64.encode(digit);
  } while (vlq > 0);

  return encoded;
};

/**
 * Decodes the next base 64 VLQ value from the given string and returns the
 * value and the rest of the string via the out parameter.
 */
var decode$1 = function base64VLQ_decode(aStr, aIndex, aOutParam) {
  var strLen = aStr.length;
  var result = 0;
  var shift = 0;
  var continuation, digit;

  do {
    if (aIndex >= strLen) {
      throw new Error("Expected more digits in base 64 VLQ value.");
    }

    digit = base64.decode(aStr.charCodeAt(aIndex++));
    if (digit === -1) {
      throw new Error("Invalid base64 digit: " + aStr.charAt(aIndex - 1));
    }

    continuation = !!(digit & VLQ_CONTINUATION_BIT);
    digit &= VLQ_BASE_MASK;
    result = result + (digit << shift);
    shift += VLQ_BASE_SHIFT;
  } while (continuation);

  aOutParam.value = fromVLQSigned(result);
  aOutParam.rest = aIndex;
};

var base64Vlq = {
	encode: encode$1,
	decode: decode$1
};

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

// It turns out that some (most?) JavaScript engines don't self-host
// `Array.prototype.sort`. This makes sense because C++ will likely remain
// faster than JS when doing raw CPU-intensive sorting. However, when using a
// custom comparator function, calling back and forth between the VM's C++ and
// JIT'd JS is rather slow *and* loses JIT type information, resulting in
// worse generated code for the comparator function than would be optimal. In
// fact, when sorting with a comparator, these costs outweigh the benefits of
// sorting in C++. By using our own JS-implemented Quick Sort (below), we get
// a ~3500ms mean speed-up in `bench/bench.html`.

/**
 * Swap the elements indexed by `x` and `y` in the array `ary`.
 *
 * @param {Array} ary
 *        The array.
 * @param {Number} x
 *        The index of the first item.
 * @param {Number} y
 *        The index of the second item.
 */
function swap(ary, x, y) {
  var temp = ary[x];
  ary[x] = ary[y];
  ary[y] = temp;
}

/**
 * Returns a random integer within the range `low .. high` inclusive.
 *
 * @param {Number} low
 *        The lower bound on the range.
 * @param {Number} high
 *        The upper bound on the range.
 */
function randomIntInRange(low, high) {
  return Math.round(low + (Math.random() * (high - low)));
}

/**
 * The Quick Sort algorithm.
 *
 * @param {Array} ary
 *        An array to sort.
 * @param {function} comparator
 *        Function to use to compare two items.
 * @param {Number} p
 *        Start index of the array
 * @param {Number} r
 *        End index of the array
 */
function doQuickSort(ary, comparator, p, r) {
  // If our lower bound is less than our upper bound, we (1) partition the
  // array into two pieces and (2) recurse on each half. If it is not, this is
  // the empty array and our base case.

  if (p < r) {
    // (1) Partitioning.
    //
    // The partitioning chooses a pivot between `p` and `r` and moves all
    // elements that are less than or equal to the pivot to the before it, and
    // all the elements that are greater than it after it. The effect is that
    // once partition is done, the pivot is in the exact place it will be when
    // the array is put in sorted order, and it will not need to be moved
    // again. This runs in O(n) time.

    // Always choose a random pivot so that an input array which is reverse
    // sorted does not cause O(n^2) running time.
    var pivotIndex = randomIntInRange(p, r);
    var i = p - 1;

    swap(ary, pivotIndex, r);
    var pivot = ary[r];

    // Immediately after `j` is incremented in this loop, the following hold
    // true:
    //
    //   * Every element in `ary[p .. i]` is less than or equal to the pivot.
    //
    //   * Every element in `ary[i+1 .. j-1]` is greater than the pivot.
    for (var j = p; j < r; j++) {
      if (comparator(ary[j], pivot) <= 0) {
        i += 1;
        swap(ary, i, j);
      }
    }

    swap(ary, i + 1, j);
    var q = i + 1;

    // (2) Recurse on each half.

    doQuickSort(ary, comparator, p, q - 1);
    doQuickSort(ary, comparator, q + 1, r);
  }
}

/**
 * Sort the given array in-place with the given comparator function.
 *
 * @param {Array} ary
 *        An array to sort.
 * @param {function} comparator
 *        Function to use to compare two items.
 */
var quickSort_1 = function (ary, comparator) {
  doQuickSort(ary, comparator, 0, ary.length - 1);
};

var quickSort = {
	quickSort: quickSort_1
};

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */



var ArraySet$1 = arraySet.ArraySet;

var quickSort$1 = quickSort.quickSort;

function SourceMapConsumer(aSourceMap) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
  }

  return sourceMap.sections != null
    ? new IndexedSourceMapConsumer(sourceMap)
    : new BasicSourceMapConsumer(sourceMap);
}

SourceMapConsumer.fromSourceMap = function(aSourceMap) {
  return BasicSourceMapConsumer.fromSourceMap(aSourceMap);
};

/**
 * The version of the source mapping spec that we are consuming.
 */
SourceMapConsumer.prototype._version = 3;

// `__generatedMappings` and `__originalMappings` are arrays that hold the
// parsed mapping coordinates from the source map's "mappings" attribute. They
// are lazily instantiated, accessed via the `_generatedMappings` and
// `_originalMappings` getters respectively, and we only parse the mappings
// and create these arrays once queried for a source location. We jump through
// these hoops because there can be many thousands of mappings, and parsing
// them is expensive, so we only want to do it if we must.
//
// Each object in the arrays is of the form:
//
//     {
//       generatedLine: The line number in the generated code,
//       generatedColumn: The column number in the generated code,
//       source: The path to the original source file that generated this
//               chunk of code,
//       originalLine: The line number in the original source that
//                     corresponds to this chunk of generated code,
//       originalColumn: The column number in the original source that
//                       corresponds to this chunk of generated code,
//       name: The name of the original symbol which generated this chunk of
//             code.
//     }
//
// All properties except for `generatedLine` and `generatedColumn` can be
// `null`.
//
// `_generatedMappings` is ordered by the generated positions.
//
// `_originalMappings` is ordered by the original positions.

SourceMapConsumer.prototype.__generatedMappings = null;
Object.defineProperty(SourceMapConsumer.prototype, '_generatedMappings', {
  get: function () {
    if (!this.__generatedMappings) {
      this._parseMappings(this._mappings, this.sourceRoot);
    }

    return this.__generatedMappings;
  }
});

SourceMapConsumer.prototype.__originalMappings = null;
Object.defineProperty(SourceMapConsumer.prototype, '_originalMappings', {
  get: function () {
    if (!this.__originalMappings) {
      this._parseMappings(this._mappings, this.sourceRoot);
    }

    return this.__originalMappings;
  }
});

SourceMapConsumer.prototype._charIsMappingSeparator =
  function SourceMapConsumer_charIsMappingSeparator(aStr, index) {
    var c = aStr.charAt(index);
    return c === ";" || c === ",";
  };

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
SourceMapConsumer.prototype._parseMappings =
  function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    throw new Error("Subclasses must implement _parseMappings");
  };

SourceMapConsumer.GENERATED_ORDER = 1;
SourceMapConsumer.ORIGINAL_ORDER = 2;

SourceMapConsumer.GREATEST_LOWER_BOUND = 1;
SourceMapConsumer.LEAST_UPPER_BOUND = 2;

/**
 * Iterate over each mapping between an original source/line/column and a
 * generated line/column in this source map.
 *
 * @param Function aCallback
 *        The function that is called with each mapping.
 * @param Object aContext
 *        Optional. If specified, this object will be the value of `this` every
 *        time that `aCallback` is called.
 * @param aOrder
 *        Either `SourceMapConsumer.GENERATED_ORDER` or
 *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
 *        iterate over the mappings sorted by the generated file's line/column
 *        order or the original's source/line/column order, respectively. Defaults to
 *        `SourceMapConsumer.GENERATED_ORDER`.
 */
SourceMapConsumer.prototype.eachMapping =
  function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
    var context = aContext || null;
    var order = aOrder || SourceMapConsumer.GENERATED_ORDER;

    var mappings;
    switch (order) {
    case SourceMapConsumer.GENERATED_ORDER:
      mappings = this._generatedMappings;
      break;
    case SourceMapConsumer.ORIGINAL_ORDER:
      mappings = this._originalMappings;
      break;
    default:
      throw new Error("Unknown order of iteration.");
    }

    var sourceRoot = this.sourceRoot;
    mappings.map(function (mapping) {
      var source = mapping.source === null ? null : this._sources.at(mapping.source);
      if (source != null && sourceRoot != null) {
        source = util.join(sourceRoot, source);
      }
      return {
        source: source,
        generatedLine: mapping.generatedLine,
        generatedColumn: mapping.generatedColumn,
        originalLine: mapping.originalLine,
        originalColumn: mapping.originalColumn,
        name: mapping.name === null ? null : this._names.at(mapping.name)
      };
    }, this).forEach(aCallback, context);
  };

/**
 * Returns all generated line and column information for the original source,
 * line, and column provided. If no column is provided, returns all mappings
 * corresponding to a either the line we are searching for or the next
 * closest line that has any mappings. Otherwise, returns all mappings
 * corresponding to the given line and either the column we are searching for
 * or the next closest column that has any offsets.
 *
 * The only argument is an object with the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.
 *   - column: Optional. the column number in the original source.
 *
 * and an array of objects is returned, each with the following properties:
 *
 *   - line: The line number in the generated source, or null.
 *   - column: The column number in the generated source, or null.
 */
SourceMapConsumer.prototype.allGeneratedPositionsFor =
  function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
    var line = util.getArg(aArgs, 'line');

    // When there is no exact match, BasicSourceMapConsumer.prototype._findMapping
    // returns the index of the closest mapping less than the needle. By
    // setting needle.originalColumn to 0, we thus find the last mapping for
    // the given line, provided such a mapping exists.
    var needle = {
      source: util.getArg(aArgs, 'source'),
      originalLine: line,
      originalColumn: util.getArg(aArgs, 'column', 0)
    };

    if (this.sourceRoot != null) {
      needle.source = util.relative(this.sourceRoot, needle.source);
    }
    if (!this._sources.has(needle.source)) {
      return [];
    }
    needle.source = this._sources.indexOf(needle.source);

    var mappings = [];

    var index = this._findMapping(needle,
                                  this._originalMappings,
                                  "originalLine",
                                  "originalColumn",
                                  util.compareByOriginalPositions,
                                  binarySearch.LEAST_UPPER_BOUND);
    if (index >= 0) {
      var mapping = this._originalMappings[index];

      if (aArgs.column === undefined) {
        var originalLine = mapping.originalLine;

        // Iterate until either we run out of mappings, or we run into
        // a mapping for a different line than the one we found. Since
        // mappings are sorted, this is guaranteed to find all mappings for
        // the line we found.
        while (mapping && mapping.originalLine === originalLine) {
          mappings.push({
            line: util.getArg(mapping, 'generatedLine', null),
            column: util.getArg(mapping, 'generatedColumn', null),
            lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
          });

          mapping = this._originalMappings[++index];
        }
      } else {
        var originalColumn = mapping.originalColumn;

        // Iterate until either we run out of mappings, or we run into
        // a mapping for a different line than the one we were searching for.
        // Since mappings are sorted, this is guaranteed to find all mappings for
        // the line we are searching for.
        while (mapping &&
               mapping.originalLine === line &&
               mapping.originalColumn == originalColumn) {
          mappings.push({
            line: util.getArg(mapping, 'generatedLine', null),
            column: util.getArg(mapping, 'generatedColumn', null),
            lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
          });

          mapping = this._originalMappings[++index];
        }
      }
    }

    return mappings;
  };

var SourceMapConsumer_1 = SourceMapConsumer;

/**
 * A BasicSourceMapConsumer instance represents a parsed source map which we can
 * query for information about the original file positions by giving it a file
 * position in the generated source.
 *
 * The only parameter is the raw source map (either as a JSON string, or
 * already parsed to an object). According to the spec, source maps have the
 * following attributes:
 *
 *   - version: Which version of the source map spec this map is following.
 *   - sources: An array of URLs to the original source files.
 *   - names: An array of identifiers which can be referrenced by individual mappings.
 *   - sourceRoot: Optional. The URL root from which all sources are relative.
 *   - sourcesContent: Optional. An array of contents of the original source files.
 *   - mappings: A string of base64 VLQs which contain the actual mappings.
 *   - file: Optional. The generated file this source map is associated with.
 *
 * Here is an example source map, taken from the source map spec[0]:
 *
 *     {
 *       version : 3,
 *       file: "out.js",
 *       sourceRoot : "",
 *       sources: ["foo.js", "bar.js"],
 *       names: ["src", "maps", "are", "fun"],
 *       mappings: "AA,AB;;ABCDE;"
 *     }
 *
 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
 */
function BasicSourceMapConsumer(aSourceMap) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
  }

  var version = util.getArg(sourceMap, 'version');
  var sources = util.getArg(sourceMap, 'sources');
  // Sass 3.3 leaves out the 'names' array, so we deviate from the spec (which
  // requires the array) to play nice here.
  var names = util.getArg(sourceMap, 'names', []);
  var sourceRoot = util.getArg(sourceMap, 'sourceRoot', null);
  var sourcesContent = util.getArg(sourceMap, 'sourcesContent', null);
  var mappings = util.getArg(sourceMap, 'mappings');
  var file = util.getArg(sourceMap, 'file', null);

  // Once again, Sass deviates from the spec and supplies the version as a
  // string rather than a number, so we use loose equality checking here.
  if (version != this._version) {
    throw new Error('Unsupported version: ' + version);
  }

  sources = sources
    .map(String)
    // Some source maps produce relative source paths like "./foo.js" instead of
    // "foo.js".  Normalize these first so that future comparisons will succeed.
    // See bugzil.la/1090768.
    .map(util.normalize)
    // Always ensure that absolute sources are internally stored relative to
    // the source root, if the source root is absolute. Not doing this would
    // be particularly problematic when the source root is a prefix of the
    // source (valid, but why??). See github issue #199 and bugzil.la/1188982.
    .map(function (source) {
      return sourceRoot && util.isAbsolute(sourceRoot) && util.isAbsolute(source)
        ? util.relative(sourceRoot, source)
        : source;
    });

  // Pass `true` below to allow duplicate names and sources. While source maps
  // are intended to be compressed and deduplicated, the TypeScript compiler
  // sometimes generates source maps with duplicates in them. See Github issue
  // #72 and bugzil.la/889492.
  this._names = ArraySet$1.fromArray(names.map(String), true);
  this._sources = ArraySet$1.fromArray(sources, true);

  this.sourceRoot = sourceRoot;
  this.sourcesContent = sourcesContent;
  this._mappings = mappings;
  this.file = file;
}

BasicSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer;

/**
 * Create a BasicSourceMapConsumer from a SourceMapGenerator.
 *
 * @param SourceMapGenerator aSourceMap
 *        The source map that will be consumed.
 * @returns BasicSourceMapConsumer
 */
BasicSourceMapConsumer.fromSourceMap =
  function SourceMapConsumer_fromSourceMap(aSourceMap) {
    var smc = Object.create(BasicSourceMapConsumer.prototype);

    var names = smc._names = ArraySet$1.fromArray(aSourceMap._names.toArray(), true);
    var sources = smc._sources = ArraySet$1.fromArray(aSourceMap._sources.toArray(), true);
    smc.sourceRoot = aSourceMap._sourceRoot;
    smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(),
                                                            smc.sourceRoot);
    smc.file = aSourceMap._file;

    // Because we are modifying the entries (by converting string sources and
    // names to indices into the sources and names ArraySets), we have to make
    // a copy of the entry or else bad things happen. Shared mutable state
    // strikes again! See github issue #191.

    var generatedMappings = aSourceMap._mappings.toArray().slice();
    var destGeneratedMappings = smc.__generatedMappings = [];
    var destOriginalMappings = smc.__originalMappings = [];

    for (var i = 0, length = generatedMappings.length; i < length; i++) {
      var srcMapping = generatedMappings[i];
      var destMapping = new Mapping;
      destMapping.generatedLine = srcMapping.generatedLine;
      destMapping.generatedColumn = srcMapping.generatedColumn;

      if (srcMapping.source) {
        destMapping.source = sources.indexOf(srcMapping.source);
        destMapping.originalLine = srcMapping.originalLine;
        destMapping.originalColumn = srcMapping.originalColumn;

        if (srcMapping.name) {
          destMapping.name = names.indexOf(srcMapping.name);
        }

        destOriginalMappings.push(destMapping);
      }

      destGeneratedMappings.push(destMapping);
    }

    quickSort$1(smc.__originalMappings, util.compareByOriginalPositions);

    return smc;
  };

/**
 * The version of the source mapping spec that we are consuming.
 */
BasicSourceMapConsumer.prototype._version = 3;

/**
 * The list of original sources.
 */
Object.defineProperty(BasicSourceMapConsumer.prototype, 'sources', {
  get: function () {
    return this._sources.toArray().map(function (s) {
      return this.sourceRoot != null ? util.join(this.sourceRoot, s) : s;
    }, this);
  }
});

/**
 * Provide the JIT with a nice shape / hidden class.
 */
function Mapping() {
  this.generatedLine = 0;
  this.generatedColumn = 0;
  this.source = null;
  this.originalLine = null;
  this.originalColumn = null;
  this.name = null;
}

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
BasicSourceMapConsumer.prototype._parseMappings =
  function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    var generatedLine = 1;
    var previousGeneratedColumn = 0;
    var previousOriginalLine = 0;
    var previousOriginalColumn = 0;
    var previousSource = 0;
    var previousName = 0;
    var length = aStr.length;
    var index = 0;
    var cachedSegments = {};
    var temp = {};
    var originalMappings = [];
    var generatedMappings = [];
    var mapping, str, segment, end, value;

    while (index < length) {
      if (aStr.charAt(index) === ';') {
        generatedLine++;
        index++;
        previousGeneratedColumn = 0;
      }
      else if (aStr.charAt(index) === ',') {
        index++;
      }
      else {
        mapping = new Mapping();
        mapping.generatedLine = generatedLine;

        // Because each offset is encoded relative to the previous one,
        // many segments often have the same encoding. We can exploit this
        // fact by caching the parsed variable length fields of each segment,
        // allowing us to avoid a second parse if we encounter the same
        // segment again.
        for (end = index; end < length; end++) {
          if (this._charIsMappingSeparator(aStr, end)) {
            break;
          }
        }
        str = aStr.slice(index, end);

        segment = cachedSegments[str];
        if (segment) {
          index += str.length;
        } else {
          segment = [];
          while (index < end) {
            base64Vlq.decode(aStr, index, temp);
            value = temp.value;
            index = temp.rest;
            segment.push(value);
          }

          if (segment.length === 2) {
            throw new Error('Found a source, but no line and column');
          }

          if (segment.length === 3) {
            throw new Error('Found a source and line, but no column');
          }

          cachedSegments[str] = segment;
        }

        // Generated column.
        mapping.generatedColumn = previousGeneratedColumn + segment[0];
        previousGeneratedColumn = mapping.generatedColumn;

        if (segment.length > 1) {
          // Original source.
          mapping.source = previousSource + segment[1];
          previousSource += segment[1];

          // Original line.
          mapping.originalLine = previousOriginalLine + segment[2];
          previousOriginalLine = mapping.originalLine;
          // Lines are stored 0-based
          mapping.originalLine += 1;

          // Original column.
          mapping.originalColumn = previousOriginalColumn + segment[3];
          previousOriginalColumn = mapping.originalColumn;

          if (segment.length > 4) {
            // Original name.
            mapping.name = previousName + segment[4];
            previousName += segment[4];
          }
        }

        generatedMappings.push(mapping);
        if (typeof mapping.originalLine === 'number') {
          originalMappings.push(mapping);
        }
      }
    }

    quickSort$1(generatedMappings, util.compareByGeneratedPositionsDeflated);
    this.__generatedMappings = generatedMappings;

    quickSort$1(originalMappings, util.compareByOriginalPositions);
    this.__originalMappings = originalMappings;
  };

/**
 * Find the mapping that best matches the hypothetical "needle" mapping that
 * we are searching for in the given "haystack" of mappings.
 */
BasicSourceMapConsumer.prototype._findMapping =
  function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName,
                                         aColumnName, aComparator, aBias) {
    // To return the position we are searching for, we must first find the
    // mapping for the given position and then return the opposite position it
    // points to. Because the mappings are sorted, we can use binary search to
    // find the best mapping.

    if (aNeedle[aLineName] <= 0) {
      throw new TypeError('Line must be greater than or equal to 1, got '
                          + aNeedle[aLineName]);
    }
    if (aNeedle[aColumnName] < 0) {
      throw new TypeError('Column must be greater than or equal to 0, got '
                          + aNeedle[aColumnName]);
    }

    return binarySearch.search(aNeedle, aMappings, aComparator, aBias);
  };

/**
 * Compute the last column for each generated mapping. The last column is
 * inclusive.
 */
BasicSourceMapConsumer.prototype.computeColumnSpans =
  function SourceMapConsumer_computeColumnSpans() {
    for (var index = 0; index < this._generatedMappings.length; ++index) {
      var mapping = this._generatedMappings[index];

      // Mappings do not contain a field for the last generated columnt. We
      // can come up with an optimistic estimate, however, by assuming that
      // mappings are contiguous (i.e. given two consecutive mappings, the
      // first mapping ends where the second one starts).
      if (index + 1 < this._generatedMappings.length) {
        var nextMapping = this._generatedMappings[index + 1];

        if (mapping.generatedLine === nextMapping.generatedLine) {
          mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
          continue;
        }
      }

      // The last mapping for each line spans the entire line.
      mapping.lastGeneratedColumn = Infinity;
    }
  };

/**
 * Returns the original source, line, and column information for the generated
 * source's line and column positions provided. The only argument is an object
 * with the following properties:
 *
 *   - line: The line number in the generated source.
 *   - column: The column number in the generated source.
 *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
 *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
 *
 * and an object is returned with the following properties:
 *
 *   - source: The original source file, or null.
 *   - line: The line number in the original source, or null.
 *   - column: The column number in the original source, or null.
 *   - name: The original identifier, or null.
 */
BasicSourceMapConsumer.prototype.originalPositionFor =
  function SourceMapConsumer_originalPositionFor(aArgs) {
    var needle = {
      generatedLine: util.getArg(aArgs, 'line'),
      generatedColumn: util.getArg(aArgs, 'column')
    };

    var index = this._findMapping(
      needle,
      this._generatedMappings,
      "generatedLine",
      "generatedColumn",
      util.compareByGeneratedPositionsDeflated,
      util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
    );

    if (index >= 0) {
      var mapping = this._generatedMappings[index];

      if (mapping.generatedLine === needle.generatedLine) {
        var source = util.getArg(mapping, 'source', null);
        if (source !== null) {
          source = this._sources.at(source);
          if (this.sourceRoot != null) {
            source = util.join(this.sourceRoot, source);
          }
        }
        var name = util.getArg(mapping, 'name', null);
        if (name !== null) {
          name = this._names.at(name);
        }
        return {
          source: source,
          line: util.getArg(mapping, 'originalLine', null),
          column: util.getArg(mapping, 'originalColumn', null),
          name: name
        };
      }
    }

    return {
      source: null,
      line: null,
      column: null,
      name: null
    };
  };

/**
 * Return true if we have the source content for every source in the source
 * map, false otherwise.
 */
BasicSourceMapConsumer.prototype.hasContentsOfAllSources =
  function BasicSourceMapConsumer_hasContentsOfAllSources() {
    if (!this.sourcesContent) {
      return false;
    }
    return this.sourcesContent.length >= this._sources.size() &&
      !this.sourcesContent.some(function (sc) { return sc == null; });
  };

/**
 * Returns the original source content. The only argument is the url of the
 * original source file. Returns null if no original source content is
 * available.
 */
BasicSourceMapConsumer.prototype.sourceContentFor =
  function SourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
    if (!this.sourcesContent) {
      return null;
    }

    if (this.sourceRoot != null) {
      aSource = util.relative(this.sourceRoot, aSource);
    }

    if (this._sources.has(aSource)) {
      return this.sourcesContent[this._sources.indexOf(aSource)];
    }

    var url;
    if (this.sourceRoot != null
        && (url = util.urlParse(this.sourceRoot))) {
      // XXX: file:// URIs and absolute paths lead to unexpected behavior for
      // many users. We can help them out when they expect file:// URIs to
      // behave like it would if they were running a local HTTP server. See
      // https://bugzilla.mozilla.org/show_bug.cgi?id=885597.
      var fileUriAbsPath = aSource.replace(/^file:\/\//, "");
      if (url.scheme == "file"
          && this._sources.has(fileUriAbsPath)) {
        return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)]
      }

      if ((!url.path || url.path == "/")
          && this._sources.has("/" + aSource)) {
        return this.sourcesContent[this._sources.indexOf("/" + aSource)];
      }
    }

    // This function is used recursively from
    // IndexedSourceMapConsumer.prototype.sourceContentFor. In that case, we
    // don't want to throw if we can't find the source - we just want to
    // return null, so we provide a flag to exit gracefully.
    if (nullOnMissing) {
      return null;
    }
    else {
      throw new Error('"' + aSource + '" is not in the SourceMap.');
    }
  };

/**
 * Returns the generated line and column information for the original source,
 * line, and column positions provided. The only argument is an object with
 * the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.
 *   - column: The column number in the original source.
 *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
 *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
 *
 * and an object is returned with the following properties:
 *
 *   - line: The line number in the generated source, or null.
 *   - column: The column number in the generated source, or null.
 */
BasicSourceMapConsumer.prototype.generatedPositionFor =
  function SourceMapConsumer_generatedPositionFor(aArgs) {
    var source = util.getArg(aArgs, 'source');
    if (this.sourceRoot != null) {
      source = util.relative(this.sourceRoot, source);
    }
    if (!this._sources.has(source)) {
      return {
        line: null,
        column: null,
        lastColumn: null
      };
    }
    source = this._sources.indexOf(source);

    var needle = {
      source: source,
      originalLine: util.getArg(aArgs, 'line'),
      originalColumn: util.getArg(aArgs, 'column')
    };

    var index = this._findMapping(
      needle,
      this._originalMappings,
      "originalLine",
      "originalColumn",
      util.compareByOriginalPositions,
      util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
    );

    if (index >= 0) {
      var mapping = this._originalMappings[index];

      if (mapping.source === needle.source) {
        return {
          line: util.getArg(mapping, 'generatedLine', null),
          column: util.getArg(mapping, 'generatedColumn', null),
          lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
        };
      }
    }

    return {
      line: null,
      column: null,
      lastColumn: null
    };
  };

var BasicSourceMapConsumer_1 = BasicSourceMapConsumer;

/**
 * An IndexedSourceMapConsumer instance represents a parsed source map which
 * we can query for information. It differs from BasicSourceMapConsumer in
 * that it takes "indexed" source maps (i.e. ones with a "sections" field) as
 * input.
 *
 * The only parameter is a raw source map (either as a JSON string, or already
 * parsed to an object). According to the spec for indexed source maps, they
 * have the following attributes:
 *
 *   - version: Which version of the source map spec this map is following.
 *   - file: Optional. The generated file this source map is associated with.
 *   - sections: A list of section definitions.
 *
 * Each value under the "sections" field has two fields:
 *   - offset: The offset into the original specified at which this section
 *       begins to apply, defined as an object with a "line" and "column"
 *       field.
 *   - map: A source map definition. This source map could also be indexed,
 *       but doesn't have to be.
 *
 * Instead of the "map" field, it's also possible to have a "url" field
 * specifying a URL to retrieve a source map from, but that's currently
 * unsupported.
 *
 * Here's an example source map, taken from the source map spec[0], but
 * modified to omit a section which uses the "url" field.
 *
 *  {
 *    version : 3,
 *    file: "app.js",
 *    sections: [{
 *      offset: {line:100, column:10},
 *      map: {
 *        version : 3,
 *        file: "section.js",
 *        sources: ["foo.js", "bar.js"],
 *        names: ["src", "maps", "are", "fun"],
 *        mappings: "AAAA,E;;ABCDE;"
 *      }
 *    }],
 *  }
 *
 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit#heading=h.535es3xeprgt
 */
function IndexedSourceMapConsumer(aSourceMap) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
  }

  var version = util.getArg(sourceMap, 'version');
  var sections = util.getArg(sourceMap, 'sections');

  if (version != this._version) {
    throw new Error('Unsupported version: ' + version);
  }

  this._sources = new ArraySet$1();
  this._names = new ArraySet$1();

  var lastOffset = {
    line: -1,
    column: 0
  };
  this._sections = sections.map(function (s) {
    if (s.url) {
      // The url field will require support for asynchronicity.
      // See https://github.com/mozilla/source-map/issues/16
      throw new Error('Support for url field in sections not implemented.');
    }
    var offset = util.getArg(s, 'offset');
    var offsetLine = util.getArg(offset, 'line');
    var offsetColumn = util.getArg(offset, 'column');

    if (offsetLine < lastOffset.line ||
        (offsetLine === lastOffset.line && offsetColumn < lastOffset.column)) {
      throw new Error('Section offsets must be ordered and non-overlapping.');
    }
    lastOffset = offset;

    return {
      generatedOffset: {
        // The offset fields are 0-based, but we use 1-based indices when
        // encoding/decoding from VLQ.
        generatedLine: offsetLine + 1,
        generatedColumn: offsetColumn + 1
      },
      consumer: new SourceMapConsumer(util.getArg(s, 'map'))
    }
  });
}

IndexedSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
IndexedSourceMapConsumer.prototype.constructor = SourceMapConsumer;

/**
 * The version of the source mapping spec that we are consuming.
 */
IndexedSourceMapConsumer.prototype._version = 3;

/**
 * The list of original sources.
 */
Object.defineProperty(IndexedSourceMapConsumer.prototype, 'sources', {
  get: function () {
    var sources = [];
    for (var i = 0; i < this._sections.length; i++) {
      for (var j = 0; j < this._sections[i].consumer.sources.length; j++) {
        sources.push(this._sections[i].consumer.sources[j]);
      }
    }
    return sources;
  }
});

/**
 * Returns the original source, line, and column information for the generated
 * source's line and column positions provided. The only argument is an object
 * with the following properties:
 *
 *   - line: The line number in the generated source.
 *   - column: The column number in the generated source.
 *
 * and an object is returned with the following properties:
 *
 *   - source: The original source file, or null.
 *   - line: The line number in the original source, or null.
 *   - column: The column number in the original source, or null.
 *   - name: The original identifier, or null.
 */
IndexedSourceMapConsumer.prototype.originalPositionFor =
  function IndexedSourceMapConsumer_originalPositionFor(aArgs) {
    var needle = {
      generatedLine: util.getArg(aArgs, 'line'),
      generatedColumn: util.getArg(aArgs, 'column')
    };

    // Find the section containing the generated position we're trying to map
    // to an original position.
    var sectionIndex = binarySearch.search(needle, this._sections,
      function(needle, section) {
        var cmp = needle.generatedLine - section.generatedOffset.generatedLine;
        if (cmp) {
          return cmp;
        }

        return (needle.generatedColumn -
                section.generatedOffset.generatedColumn);
      });
    var section = this._sections[sectionIndex];

    if (!section) {
      return {
        source: null,
        line: null,
        column: null,
        name: null
      };
    }

    return section.consumer.originalPositionFor({
      line: needle.generatedLine -
        (section.generatedOffset.generatedLine - 1),
      column: needle.generatedColumn -
        (section.generatedOffset.generatedLine === needle.generatedLine
         ? section.generatedOffset.generatedColumn - 1
         : 0),
      bias: aArgs.bias
    });
  };

/**
 * Return true if we have the source content for every source in the source
 * map, false otherwise.
 */
IndexedSourceMapConsumer.prototype.hasContentsOfAllSources =
  function IndexedSourceMapConsumer_hasContentsOfAllSources() {
    return this._sections.every(function (s) {
      return s.consumer.hasContentsOfAllSources();
    });
  };

/**
 * Returns the original source content. The only argument is the url of the
 * original source file. Returns null if no original source content is
 * available.
 */
IndexedSourceMapConsumer.prototype.sourceContentFor =
  function IndexedSourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];

      var content = section.consumer.sourceContentFor(aSource, true);
      if (content) {
        return content;
      }
    }
    if (nullOnMissing) {
      return null;
    }
    else {
      throw new Error('"' + aSource + '" is not in the SourceMap.');
    }
  };

/**
 * Returns the generated line and column information for the original source,
 * line, and column positions provided. The only argument is an object with
 * the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.
 *   - column: The column number in the original source.
 *
 * and an object is returned with the following properties:
 *
 *   - line: The line number in the generated source, or null.
 *   - column: The column number in the generated source, or null.
 */
IndexedSourceMapConsumer.prototype.generatedPositionFor =
  function IndexedSourceMapConsumer_generatedPositionFor(aArgs) {
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];

      // Only consider this section if the requested source is in the list of
      // sources of the consumer.
      if (section.consumer.sources.indexOf(util.getArg(aArgs, 'source')) === -1) {
        continue;
      }
      var generatedPosition = section.consumer.generatedPositionFor(aArgs);
      if (generatedPosition) {
        var ret = {
          line: generatedPosition.line +
            (section.generatedOffset.generatedLine - 1),
          column: generatedPosition.column +
            (section.generatedOffset.generatedLine === generatedPosition.line
             ? section.generatedOffset.generatedColumn - 1
             : 0)
        };
        return ret;
      }
    }

    return {
      line: null,
      column: null
    };
  };

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
IndexedSourceMapConsumer.prototype._parseMappings =
  function IndexedSourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    this.__generatedMappings = [];
    this.__originalMappings = [];
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];
      var sectionMappings = section.consumer._generatedMappings;
      for (var j = 0; j < sectionMappings.length; j++) {
        var mapping = sectionMappings[j];

        var source = section.consumer._sources.at(mapping.source);
        if (section.consumer.sourceRoot !== null) {
          source = util.join(section.consumer.sourceRoot, source);
        }
        this._sources.add(source);
        source = this._sources.indexOf(source);

        var name = section.consumer._names.at(mapping.name);
        this._names.add(name);
        name = this._names.indexOf(name);

        // The mappings coming from the consumer for the section have
        // generated positions relative to the start of the section, so we
        // need to offset them to be relative to the start of the concatenated
        // generated file.
        var adjustedMapping = {
          source: source,
          generatedLine: mapping.generatedLine +
            (section.generatedOffset.generatedLine - 1),
          generatedColumn: mapping.generatedColumn +
            (section.generatedOffset.generatedLine === mapping.generatedLine
            ? section.generatedOffset.generatedColumn - 1
            : 0),
          originalLine: mapping.originalLine,
          originalColumn: mapping.originalColumn,
          name: name
        };

        this.__generatedMappings.push(adjustedMapping);
        if (typeof adjustedMapping.originalLine === 'number') {
          this.__originalMappings.push(adjustedMapping);
        }
      }
    }

    quickSort$1(this.__generatedMappings, util.compareByGeneratedPositionsDeflated);
    quickSort$1(this.__originalMappings, util.compareByOriginalPositions);
  };

var IndexedSourceMapConsumer_1 = IndexedSourceMapConsumer;

var sourceMapConsumer = {
	SourceMapConsumer: SourceMapConsumer_1,
	BasicSourceMapConsumer: BasicSourceMapConsumer_1,
	IndexedSourceMapConsumer: IndexedSourceMapConsumer_1
};

var stacktraceGps = createCommonjsModule(function (module, exports) {
(function(root, factory) {
    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.

    /* istanbul ignore next */
    {
        module.exports = factory(sourceMapConsumer, stackframe);
    }
}(commonjsGlobal, function(SourceMap, StackFrame) {

    /**
     * Make a X-Domain request to url and callback.
     *
     * @param {String} url
     * @returns {Promise} with response text if fulfilled
     */
    function _xdr(url) {
        return new Promise(function(resolve, reject) {
            var req = new XMLHttpRequest();
            req.open('get', url);
            req.onerror = reject;
            req.onreadystatechange = function onreadystatechange() {
                if (req.readyState === 4) {
                    if ((req.status >= 200 && req.status < 300) ||
                        (url.substr(0, 7) === 'file://' && req.responseText)) {
                        resolve(req.responseText);
                    } else {
                        reject(new Error('HTTP status: ' + req.status + ' retrieving ' + url));
                    }
                }
            };
            req.send();
        });

    }

    /**
     * Convert a Base64-encoded string into its original representation.
     * Used for inline sourcemaps.
     *
     * @param {String} b64str Base-64 encoded string
     * @returns {String} original representation of the base64-encoded string.
     */
    function _atob(b64str) {
        if (typeof window !== 'undefined' && window.atob) {
            return window.atob(b64str);
        } else {
            throw new Error('You must supply a polyfill for window.atob in this environment');
        }
    }

    function _parseJson(string) {
        if (typeof JSON !== 'undefined' && JSON.parse) {
            return JSON.parse(string);
        } else {
            throw new Error('You must supply a polyfill for JSON.parse in this environment');
        }
    }

    function _findFunctionName(source, lineNumber/*, columnNumber*/) {
        var syntaxes = [
            // {name} = function ({args}) TODO args capture
            /['"]?([$_A-Za-z][$_A-Za-z0-9]*)['"]?\s*[:=]\s*function\b/,
            // function {name}({args}) m[1]=name m[2]=args
            /function\s+([^('"`]*?)\s*\(([^)]*)\)/,
            // {name} = eval()
            /['"]?([$_A-Za-z][$_A-Za-z0-9]*)['"]?\s*[:=]\s*(?:eval|new Function)\b/,
            // fn_name() {
            /\b(?!(?:if|for|switch|while|with|catch)\b)(?:(?:static)\s+)?(\S+)\s*\(.*?\)\s*\{/,
            // {name} = () => {
            /['"]?([$_A-Za-z][$_A-Za-z0-9]*)['"]?\s*[:=]\s*\(.*?\)\s*=>/
        ];
        var lines = source.split('\n');

        // Walk backwards in the source lines until we find the line which matches one of the patterns above
        var code = '';
        var maxLines = Math.min(lineNumber, 20);
        for (var i = 0; i < maxLines; ++i) {
            // lineNo is 1-based, source[] is 0-based
            var line = lines[lineNumber - i - 1];
            var commentPos = line.indexOf('//');
            if (commentPos >= 0) {
                line = line.substr(0, commentPos);
            }

            if (line) {
                code = line + code;
                var len = syntaxes.length;
                for (var index = 0; index < len; index++) {
                    var m = syntaxes[index].exec(code);
                    if (m && m[1]) {
                        return m[1];
                    }
                }
            }
        }
        return undefined;
    }

    function _ensureSupportedEnvironment() {
        if (typeof Object.defineProperty !== 'function' || typeof Object.create !== 'function') {
            throw new Error('Unable to consume source maps in older browsers');
        }
    }

    function _ensureStackFrameIsLegit(stackframe$$1) {
        if (typeof stackframe$$1 !== 'object') {
            throw new TypeError('Given StackFrame is not an object');
        } else if (typeof stackframe$$1.fileName !== 'string') {
            throw new TypeError('Given file name is not a String');
        } else if (typeof stackframe$$1.lineNumber !== 'number' ||
            stackframe$$1.lineNumber % 1 !== 0 ||
            stackframe$$1.lineNumber < 1) {
            throw new TypeError('Given line number must be a positive integer');
        } else if (typeof stackframe$$1.columnNumber !== 'number' ||
            stackframe$$1.columnNumber % 1 !== 0 ||
            stackframe$$1.columnNumber < 0) {
            throw new TypeError('Given column number must be a non-negative integer');
        }
        return true;
    }

    function _findSourceMappingURL(source) {
        var sourceMappingUrlRegExp = /\/\/[#@] ?sourceMappingURL=([^\s'"]+)\s*$/mg;
        var lastSourceMappingUrl;
        var matchSourceMappingUrl;
        while (matchSourceMappingUrl = sourceMappingUrlRegExp.exec(source)) { // jshint ignore:line
            lastSourceMappingUrl = matchSourceMappingUrl[1];
        }
        if (lastSourceMappingUrl) {
            return lastSourceMappingUrl;
        } else {
            throw new Error('sourceMappingURL not found');
        }
    }

    function _extractLocationInfoFromSourceMapSource(stackframe$$1, sourceMapConsumer$$1, sourceCache) {
        return new Promise(function(resolve, reject) {
            var loc = sourceMapConsumer$$1.originalPositionFor({
                line: stackframe$$1.lineNumber,
                column: stackframe$$1.columnNumber
            });

            if (loc.source) {
                // cache mapped sources
                var mappedSource = sourceMapConsumer$$1.sourceContentFor(loc.source);
                if (mappedSource) {
                    sourceCache[loc.source] = mappedSource;
                }

                resolve(
                    // given stackframe and source location, update stackframe
                    new StackFrame({
                        functionName: loc.name || stackframe$$1.functionName,
                        args: stackframe$$1.args,
                        fileName: loc.source,
                        lineNumber: loc.line,
                        columnNumber: loc.column
                    }));
            } else {
                reject(new Error('Could not get original source for given stackframe and source map'));
            }
        });
    }

    /**
     * @constructor
     * @param {Object} opts
     *      opts.sourceCache = {url: "Source String"} => preload source cache
     *      opts.sourceMapConsumerCache = {/path/file.js.map: SourceMapConsumer}
     *      opts.offline = True to prevent network requests.
     *              Best effort without sources or source maps.
     *      opts.ajax = Promise returning function to make X-Domain requests
     */
    return function StackTraceGPS(opts) {
        if (!(this instanceof StackTraceGPS)) {
            return new StackTraceGPS(opts);
        }
        opts = opts || {};

        this.sourceCache = opts.sourceCache || {};
        this.sourceMapConsumerCache = opts.sourceMapConsumerCache || {};

        this.ajax = opts.ajax || _xdr;

        this._atob = opts.atob || _atob;

        this._get = function _get(location) {
            return new Promise(function(resolve, reject) {
                var isDataUrl = location.substr(0, 5) === 'data:';
                if (this.sourceCache[location]) {
                    resolve(this.sourceCache[location]);
                } else if (opts.offline && !isDataUrl) {
                    reject(new Error('Cannot make network requests in offline mode'));
                } else {
                    if (isDataUrl) {
                        // data URLs can have parameters.
                        // see http://tools.ietf.org/html/rfc2397
                        var supportedEncodingRegexp =
                            /^data:application\/json;([\w=:"-]+;)*base64,/;
                        var match = location.match(supportedEncodingRegexp);
                        if (match) {
                            var sourceMapStart = match[0].length;
                            var encodedSource = location.substr(sourceMapStart);
                            var source = this._atob(encodedSource);
                            this.sourceCache[location] = source;
                            resolve(source);
                        } else {
                            reject(new Error('The encoding of the inline sourcemap is not supported'));
                        }
                    } else {
                        var xhrPromise = this.ajax(location, {method: 'get'});
                        // Cache the Promise to prevent duplicate in-flight requests
                        this.sourceCache[location] = xhrPromise;
                        xhrPromise.then(resolve, reject);
                    }
                }
            }.bind(this));
        };

        /**
         * Creating SourceMapConsumers is expensive, so this wraps the creation of a
         * SourceMapConsumer in a per-instance cache.
         *
         * @param {String} sourceMappingURL = URL to fetch source map from
         * @param {String} defaultSourceRoot = Default source root for source map if undefined
         * @returns {Promise} that resolves a SourceMapConsumer
         */
        this._getSourceMapConsumer = function _getSourceMapConsumer(sourceMappingURL, defaultSourceRoot) {
            return new Promise(function(resolve, reject) {
                if (this.sourceMapConsumerCache[sourceMappingURL]) {
                    resolve(this.sourceMapConsumerCache[sourceMappingURL]);
                } else {
                    var sourceMapConsumerPromise = new Promise(function(resolve, reject) {
                        return this._get(sourceMappingURL).then(function(sourceMapSource) {
                            if (typeof sourceMapSource === 'string') {
                                sourceMapSource = _parseJson(sourceMapSource.replace(/^\)\]\}'/, ''));
                            }
                            if (typeof sourceMapSource.sourceRoot === 'undefined') {
                                sourceMapSource.sourceRoot = defaultSourceRoot;
                            }

                            resolve(new SourceMap.SourceMapConsumer(sourceMapSource));
                        }, reject);
                    }.bind(this));
                    this.sourceMapConsumerCache[sourceMappingURL] = sourceMapConsumerPromise;
                    resolve(sourceMapConsumerPromise);
                }
            }.bind(this));
        };

        /**
         * Given a StackFrame, enhance function name and use source maps for a
         * better StackFrame.
         *
         * @param {StackFrame} stackframe object
         * @returns {Promise} that resolves with with source-mapped StackFrame
         */
        this.pinpoint = function StackTraceGPS$$pinpoint(stackframe$$1) {
            return new Promise(function(resolve, reject) {
                this.getMappedLocation(stackframe$$1).then(function(mappedStackFrame) {
                    function resolveMappedStackFrame() {
                        resolve(mappedStackFrame);
                    }

                    this.findFunctionName(mappedStackFrame)
                        .then(resolve, resolveMappedStackFrame)
                        ['catch'](resolveMappedStackFrame);
                }.bind(this), reject);
            }.bind(this));
        };

        /**
         * Given a StackFrame, guess function name from location information.
         *
         * @param {StackFrame} stackframe
         * @returns {Promise} that resolves with enhanced StackFrame.
         */
        this.findFunctionName = function StackTraceGPS$$findFunctionName(stackframe$$1) {
            return new Promise(function(resolve, reject) {
                _ensureStackFrameIsLegit(stackframe$$1);
                this._get(stackframe$$1.fileName).then(function getSourceCallback(source) {
                    var lineNumber = stackframe$$1.lineNumber;
                    var columnNumber = stackframe$$1.columnNumber;
                    var guessedFunctionName = _findFunctionName(source, lineNumber, columnNumber);
                    // Only replace functionName if we found something
                    if (guessedFunctionName) {
                        resolve(new StackFrame({
                            functionName: guessedFunctionName,
                            args: stackframe$$1.args,
                            fileName: stackframe$$1.fileName,
                            lineNumber: lineNumber,
                            columnNumber: columnNumber
                        }));
                    } else {
                        resolve(stackframe$$1);
                    }
                }, reject)['catch'](reject);
            }.bind(this));
        };

        /**
         * Given a StackFrame, seek source-mapped location and return new enhanced StackFrame.
         *
         * @param {StackFrame} stackframe
         * @returns {Promise} that resolves with enhanced StackFrame.
         */
        this.getMappedLocation = function StackTraceGPS$$getMappedLocation(stackframe$$1) {
            return new Promise(function(resolve, reject) {
                _ensureSupportedEnvironment();
                _ensureStackFrameIsLegit(stackframe$$1);

                var sourceCache = this.sourceCache;
                var fileName = stackframe$$1.fileName;
                this._get(fileName).then(function(source) {
                    var sourceMappingURL = _findSourceMappingURL(source);
                    var isDataUrl = sourceMappingURL.substr(0, 5) === 'data:';
                    var defaultSourceRoot = fileName.substring(0, fileName.lastIndexOf('/') + 1);

                    if (sourceMappingURL[0] !== '/' && !isDataUrl && !(/^https?:\/\/|^\/\//i).test(sourceMappingURL)) {
                        sourceMappingURL = defaultSourceRoot + sourceMappingURL;
                    }

                    return this._getSourceMapConsumer(sourceMappingURL, defaultSourceRoot)
                        .then(function(sourceMapConsumer$$1) {
                            return _extractLocationInfoFromSourceMapSource(stackframe$$1, sourceMapConsumer$$1, sourceCache)
                                .then(resolve)['catch'](function() {
                                resolve(stackframe$$1);
                            });
                        });
                }.bind(this), reject)['catch'](reject);
            }.bind(this));
        };
    };
}));
});

var stacktrace = createCommonjsModule(function (module, exports) {
(function(root, factory) {
    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.

    /* istanbul ignore next */
    {
        module.exports = factory(errorStackParser, stackGenerator, stacktraceGps);
    }
}(commonjsGlobal, function StackTrace(ErrorStackParser, StackGenerator, StackTraceGPS) {
    var _options = {
        filter: function(stackframe) {
            // Filter out stackframes for this library by default
            return (stackframe.functionName || '').indexOf('StackTrace$$') === -1 &&
                (stackframe.functionName || '').indexOf('ErrorStackParser$$') === -1 &&
                (stackframe.functionName || '').indexOf('StackTraceGPS$$') === -1 &&
                (stackframe.functionName || '').indexOf('StackGenerator$$') === -1;
        },
        sourceCache: {}
    };

    var _generateError = function StackTrace$$GenerateError() {
        try {
            // Error must be thrown to get stack in IE
            throw new Error();
        } catch (err) {
            return err;
        }
    };

    /**
     * Merge 2 given Objects. If a conflict occurs the second object wins.
     * Does not do deep merges.
     *
     * @param {Object} first base object
     * @param {Object} second overrides
     * @returns {Object} merged first and second
     * @private
     */
    function _merge(first, second) {
        var target = {};

        [first, second].forEach(function(obj) {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    target[prop] = obj[prop];
                }
            }
            return target;
        });

        return target;
    }

    function _isShapedLikeParsableError(err) {
        return err.stack || err['opera#sourceloc'];
    }

    function _filtered(stackframes, filter) {
        if (typeof filter === 'function') {
            return stackframes.filter(filter);
        }
        return stackframes;
    }

    return {
        /**
         * Get a backtrace from invocation point.
         *
         * @param {Object} opts
         * @returns {Array} of StackFrame
         */
        get: function StackTrace$$get(opts) {
            var err = _generateError();
            return _isShapedLikeParsableError(err) ? this.fromError(err, opts) : this.generateArtificially(opts);
        },

        /**
         * Get a backtrace from invocation point.
         * IMPORTANT: Does not handle source maps or guess function names!
         *
         * @param {Object} opts
         * @returns {Array} of StackFrame
         */
        getSync: function StackTrace$$getSync(opts) {
            opts = _merge(_options, opts);
            var err = _generateError();
            var stack = _isShapedLikeParsableError(err) ? ErrorStackParser.parse(err) : StackGenerator.backtrace(opts);
            return _filtered(stack, opts.filter);
        },

        /**
         * Given an error object, parse it.
         *
         * @param {Error} error object
         * @param {Object} opts
         * @returns {Promise} for Array[StackFrame}
         */
        fromError: function StackTrace$$fromError(error, opts) {
            opts = _merge(_options, opts);
            var gps = new StackTraceGPS(opts);
            return new Promise(function(resolve) {
                var stackframes = _filtered(ErrorStackParser.parse(error), opts.filter);
                resolve(Promise.all(stackframes.map(function(sf) {
                    return new Promise(function(resolve) {
                        function resolveOriginal() {
                            resolve(sf);
                        }

                        gps.pinpoint(sf).then(resolve, resolveOriginal)['catch'](resolveOriginal);
                    });
                })));
            }.bind(this));
        },

        /**
         * Use StackGenerator to generate a backtrace.
         *
         * @param {Object} opts
         * @returns {Promise} of Array[StackFrame]
         */
        generateArtificially: function StackTrace$$generateArtificially(opts) {
            opts = _merge(_options, opts);
            var stackFrames = StackGenerator.backtrace(opts);
            if (typeof opts.filter === 'function') {
                stackFrames = stackFrames.filter(opts.filter);
            }
            return Promise.resolve(stackFrames);
        },

        /**
         * Given a function, wrap it such that invocations trigger a callback that
         * is called with a stack trace.
         *
         * @param {Function} fn to be instrumented
         * @param {Function} callback function to call with a stack trace on invocation
         * @param {Function} errback optional function to call with error if unable to get stack trace.
         * @param {Object} thisArg optional context object (e.g. window)
         */
        instrument: function StackTrace$$instrument(fn, callback, errback, thisArg) {
            if (typeof fn !== 'function') {
                throw new Error('Cannot instrument non-function object');
            } else if (typeof fn.__stacktraceOriginalFn === 'function') {
                // Already instrumented, return given Function
                return fn;
            }

            var instrumented = function StackTrace$$instrumented() {
                try {
                    this.get().then(callback, errback)['catch'](errback);
                    return fn.apply(thisArg || this, arguments);
                } catch (e) {
                    if (_isShapedLikeParsableError(e)) {
                        this.fromError(e).then(callback, errback)['catch'](errback);
                    }
                    throw e;
                }
            }.bind(this);
            instrumented.__stacktraceOriginalFn = fn;

            return instrumented;
        },

        /**
         * Given a function that has been instrumented,
         * revert the function to it's original (non-instrumented) state.
         *
         * @param {Function} fn to de-instrument
         */
        deinstrument: function StackTrace$$deinstrument(fn) {
            if (typeof fn !== 'function') {
                throw new Error('Cannot de-instrument non-function object');
            } else if (typeof fn.__stacktraceOriginalFn === 'function') {
                return fn.__stacktraceOriginalFn;
            } else {
                // Function not instrumented, return original
                return fn;
            }
        },

        /**
         * Given an error message and Array of StackFrames, serialize and POST to given URL.
         *
         * @param {Array} stackframes
         * @param {String} url
         * @param {String} errorMsg
         * @param {Object} requestOptions
         */
        report: function StackTrace$$report(stackframes, url, errorMsg, requestOptions) {
            return new Promise(function(resolve, reject) {
                var req = new XMLHttpRequest();
                req.onerror = reject;
                req.onreadystatechange = function onreadystatechange() {
                    if (req.readyState === 4) {
                        if (req.status >= 200 && req.status < 400) {
                            resolve(req.responseText);
                        } else {
                            reject(new Error('POST to ' + url + ' failed with status: ' + req.status));
                        }
                    }
                };
                req.open('post', url);

                // Set request headers
                req.setRequestHeader('Content-Type', 'application/json');
                if (requestOptions && typeof requestOptions.headers === 'object') {
                    var headers = requestOptions.headers;
                    for (var header in headers) {
                        if (headers.hasOwnProperty(header)) {
                            req.setRequestHeader(header, headers[header]);
                        }
                    }
                }

                var reportPayload = {stack: stackframes};
                if (errorMsg !== undefined && errorMsg !== null) {
                    reportPayload.message = errorMsg;
                }

                req.send(JSON.stringify(reportPayload));
            });
        }
    };
}));
});

/**
 * {@link call} shortcut that only returns the output files.
 */
function Call(inputFiles, command) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield call(inputFiles, command);
        for (let outputFile of result.outputFiles) {
            outputFile.blob = new Blob([outputFile.buffer]);
        }
        return result.outputFiles;
    });
}
/**
 * Low level execution function. All the other functions like [execute](https://github.com/KnicKnic/WASM-ImageMagick/tree/master/apidocs#execute)
 * ends up calling this one. It accept only one command and only in the form of array of strings.
 */
function call(inputFiles, command) {
    const request = {
        files: inputFiles,
        args: command,
        requestNumber: magickWorkerPromisesKey,
    };
    // let transfer = [];
    // for (let file of request.files) {
    //   if(file.content instanceof ArrayBuffer)
    //   {
    //     transfer.push(file.content)
    //   }
    //   else{
    //     transfer.push(file.content.buffer)
    //   }
    // }
    const promise = CreatePromiseEvent();
    magickWorkerPromises[magickWorkerPromisesKey] = promise;
    magickWorker.postMessage(request); //,transfer)
    magickWorkerPromisesKey++;
    console.log('magickWorkerPromisesKey',magickWorkerPromisesKey);
    return promise;
}
function CreatePromiseEvent() {
    let resolver;
    let rejecter;
    const emptyPromise = new Promise((resolve, reject) => {
        resolver = resolve;
        rejecter = reject;
    });
    emptyPromise.resolve = resolver;
    emptyPromise.reject = rejecter;
    return emptyPromise;
}
function ChangeUrl(url, fileName) {
    let splitUrl = url.split('/');
    splitUrl[splitUrl.length - 1] = fileName;
    return splitUrl.join('/');
}
function GetCurrentUrlDifferentFilename(currentUrl, fileName) {
    return ChangeUrl(currentUrl, fileName);
}
let currentJavascriptURL = './magickApi.js';
// // instead of doing the sane code of being able to just use import.meta.url 
// // (Edge doesn't work) (safari mobile, chrome, opera, firefox all do)
// // 
// // I will use stacktrace-js library to get the current file name
// //
// try {
//   // @ts-ignore
//   let packageUrl = import.meta.url;
//   currentJavascriptURL = packageUrl;
// } catch (error) {
//   // eat
// }
function GenerateStackAndGetPathAtDepth(depth) {
    try {
        let stacktrace$$1 = stacktrace.getSync();
        let filePath = stacktrace$$1[depth].fileName;
        // if the stack trace code doesn't return a path separator
        if (filePath !== undefined && filePath.indexOf('/') === -1 && filePath.indexOf('\\') === -1) {
            return undefined;
        }
        return filePath;
    }
    catch (error) {
        return undefined;
    }
}
function GetCurrentFileURLHelper3() {
    // 3rd call site didn't work, so I made this complicated maze of helpers.. 
    // Pulling the filename from the 3rd call site of the stacktrace to get the full path
    // to the module. The first index is inconsistent across browsers and does not return 
    // the full path in Safari and results in the worker failing to resolve. 
    // I am preferring to do depth 0 first, as that will ensure people that do minification still works
    let filePath = GenerateStackAndGetPathAtDepth(0);
    if (filePath === undefined) {
        filePath = GenerateStackAndGetPathAtDepth(2);
    }
    // if the stack trace code messes up 
    if (filePath === undefined) {
        filePath = './magickApi.js';
    }
    return filePath;
}
function GetCurrentFileURLHelper2() {
    return GetCurrentFileURLHelper3();
}
function GetCurrentFileURLHelper1() {
    return GetCurrentFileURLHelper2();
}
function GetCurrentFileURL() {
    return GetCurrentFileURLHelper1();
}
currentJavascriptURL = GetCurrentFileURL();
// const magickWorkerUrl = GetCurrentUrlDifferentFilename(currentJavascriptURL, 'magick.js');
const magickWorkerUrl = window.CACHE_LIST['magick.js'];


function GenerateMagickWorkerText(magickUrl) {
    // generates code for the following
    // var magickJsCurrentPath = 'magickUrl';
    // importScripts(magickJsCurrentPath);
    return "var magickJsCurrentPath = '" + magickUrl + "';\n" +
        'importScripts(magickJsCurrentPath);';
}
let magickWorker;
if (currentJavascriptURL.startsWith('http')) {
    // if worker is in a different domain fetch it, and run it
    magickWorker = new Worker(window.URL.createObjectURL(new Blob([GenerateMagickWorkerText(magickWorkerUrl)])));
}
else {
    magickWorker = new Worker(magickWorkerUrl);
}
const magickWorkerPromises = {};
let magickWorkerPromisesKey = 1;
// handle responses as they stream in after being outputFiles by image magick
magickWorker.onmessage = e => {
    const response = e.data;
    const promise = magickWorkerPromises[response.requestNumber];
    delete magickWorkerPromises[response.requestNumber];
    const result = {
        outputFiles: response.outputFiles,
        stdout: response.stdout,
        stderr: response.stderr,
        exitCode: response.exitCode || 0,
    };
    promise.resolve(result);
};

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMAlign;
(function (IMAlign) {
    IMAlign["Center"] = "Center";
    IMAlign["End"] = "End";
    IMAlign["Left"] = "Left";
    IMAlign["Middle"] = "Middle";
    IMAlign["Right"] = "Right";
    IMAlign["Start"] = "Start";
})(IMAlign || (IMAlign = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMAlpha;
(function (IMAlpha) {
    IMAlpha["Activate"] = "Activate";
    IMAlpha["Associate"] = "Associate";
    IMAlpha["Background"] = "Background";
    IMAlpha["Copy"] = "Copy";
    IMAlpha["Deactivate"] = "Deactivate";
    IMAlpha["Discrete"] = "Discrete";
    IMAlpha["Disassociate"] = "Disassociate";
    IMAlpha["Extract"] = "Extract";
    IMAlpha["Off"] = "Off";
    IMAlpha["On"] = "On";
    IMAlpha["Opaque"] = "Opaque";
    IMAlpha["Remove"] = "Remove";
    IMAlpha["Set"] = "Set";
    IMAlpha["Shape"] = "Shape";
    IMAlpha["Transparent"] = "Transparent";
})(IMAlpha || (IMAlpha = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMAutoThreshold;
(function (IMAutoThreshold) {
    IMAutoThreshold["Kapur"] = "Kapur";
    IMAutoThreshold["OTSU"] = "OTSU";
    IMAutoThreshold["Triangle"] = "Triangle";
})(IMAutoThreshold || (IMAutoThreshold = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMBoolean;
(function (IMBoolean) {
    IMBoolean["False"] = "False";
    IMBoolean["True"] = "True";
    IMBoolean["0_"] = "0";
    IMBoolean["1_"] = "1";
})(IMBoolean || (IMBoolean = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMCache;
(function (IMCache) {
    IMCache["Disk"] = "Disk";
    IMCache["Distributed"] = "Distributed";
    IMCache["Map"] = "Map";
    IMCache["Memory"] = "Memory";
    IMCache["Ping"] = "Ping";
})(IMCache || (IMCache = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMChannel;
(function (IMChannel) {
    IMChannel["All"] = "All";
    IMChannel["Sync"] = "Sync";
    IMChannel["Default"] = "Default";
    IMChannel["A"] = "A";
    IMChannel["Alpha"] = "Alpha";
    IMChannel["Black"] = "Black";
    IMChannel["B"] = "B";
    IMChannel["Blue"] = "Blue";
    IMChannel["C"] = "C";
    IMChannel["Chroma"] = "Chroma";
    IMChannel["Cyan"] = "Cyan";
    IMChannel["Gray"] = "Gray";
    IMChannel["G"] = "G";
    IMChannel["Green"] = "Green";
    IMChannel["H"] = "H";
    IMChannel["Hue"] = "Hue";
    IMChannel["K"] = "K";
    IMChannel["L"] = "L";
    IMChannel["Lightness"] = "Lightness";
    IMChannel["Luminance"] = "Luminance";
    IMChannel["M"] = "M";
    IMChannel["Magenta"] = "Magenta";
    IMChannel["Meta"] = "Meta";
    IMChannel["R"] = "R";
    IMChannel["Red"] = "Red";
    IMChannel["S"] = "S";
    IMChannel["Saturation"] = "Saturation";
    IMChannel["Y"] = "Y";
    IMChannel["Yellow"] = "Yellow";
    IMChannel["0_"] = "0";
    IMChannel["1_"] = "1";
    IMChannel["2_"] = "2";
    IMChannel["3_"] = "3";
    IMChannel["4_"] = "4";
    IMChannel["5_"] = "5";
    IMChannel["6_"] = "6";
    IMChannel["7_"] = "7";
    IMChannel["8_"] = "8";
    IMChannel["9_"] = "9";
    IMChannel["10_"] = "10";
    IMChannel["11_"] = "11";
    IMChannel["12_"] = "12";
    IMChannel["13_"] = "13";
    IMChannel["14_"] = "14";
    IMChannel["15_"] = "15";
    IMChannel["16_"] = "16";
    IMChannel["17_"] = "17";
    IMChannel["18_"] = "18";
    IMChannel["19_"] = "19";
    IMChannel["20_"] = "20";
    IMChannel["21_"] = "21";
    IMChannel["22_"] = "22";
    IMChannel["23_"] = "23";
    IMChannel["24_"] = "24";
    IMChannel["25_"] = "25";
    IMChannel["26_"] = "26";
    IMChannel["27_"] = "27";
    IMChannel["28_"] = "28";
    IMChannel["29_"] = "29";
    IMChannel["30_"] = "30";
    IMChannel["31_"] = "31";
})(IMChannel || (IMChannel = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMClass;
(function (IMClass) {
    IMClass["DirectClass"] = "DirectClass";
    IMClass["PseudoClass"] = "PseudoClass";
})(IMClass || (IMClass = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMClipPath;
(function (IMClipPath) {
    IMClipPath["ObjectBoundingBox"] = "ObjectBoundingBox";
    IMClipPath["UserSpace"] = "UserSpace";
    IMClipPath["UserSpaceOnUse"] = "UserSpaceOnUse";
})(IMClipPath || (IMClipPath = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMColorspace;
(function (IMColorspace) {
    IMColorspace["CIELab"] = "CIELab";
    IMColorspace["CMY"] = "CMY";
    IMColorspace["CMYK"] = "CMYK";
    IMColorspace["Gray"] = "Gray";
    IMColorspace["HCL"] = "HCL";
    IMColorspace["HCLp"] = "HCLp";
    IMColorspace["HSB"] = "HSB";
    IMColorspace["HSI"] = "HSI";
    IMColorspace["HSL"] = "HSL";
    IMColorspace["HSV"] = "HSV";
    IMColorspace["HWB"] = "HWB";
    IMColorspace["Lab"] = "Lab";
    IMColorspace["LCH"] = "LCH";
    IMColorspace["LCHab"] = "LCHab";
    IMColorspace["LCHuv"] = "LCHuv";
    IMColorspace["LinearGray"] = "LinearGray";
    IMColorspace["LMS"] = "LMS";
    IMColorspace["Log"] = "Log";
    IMColorspace["Luv"] = "Luv";
    IMColorspace["OHTA"] = "OHTA";
    IMColorspace["Rec601YCbCr"] = "Rec601YCbCr";
    IMColorspace["Rec709YCbCr"] = "Rec709YCbCr";
    IMColorspace["RGB"] = "RGB";
    IMColorspace["scRGB"] = "scRGB";
    IMColorspace["sRGB"] = "sRGB";
    IMColorspace["Transparent"] = "Transparent";
    IMColorspace["xyY"] = "xyY";
    IMColorspace["XYZ"] = "XYZ";
    IMColorspace["YCbCr"] = "YCbCr";
    IMColorspace["YDbDr"] = "YDbDr";
    IMColorspace["YCC"] = "YCC";
    IMColorspace["YIQ"] = "YIQ";
    IMColorspace["YPbPr"] = "YPbPr";
    IMColorspace["YUV"] = "YUV";
})(IMColorspace || (IMColorspace = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMCommand;
(function (IMCommand) {
    IMCommand["-alpha"] = "-alpha";
    IMCommand["+background"] = "+background";
    IMCommand["-background"] = "-background";
    IMCommand["+format"] = "+format";
    IMCommand["-format"] = "-format";
    IMCommand["-quiet"] = "-quiet";
    IMCommand["+quiet"] = "+quiet";
    IMCommand["-regard-warnings"] = "-regard-warnings";
    IMCommand["+regard-warnings"] = "+regard-warnings";
    IMCommand["+repage"] = "+repage";
    IMCommand["-repage"] = "-repage";
    IMCommand["+size"] = "+size";
    IMCommand["-size"] = "-size";
    IMCommand["+virtual-pixel"] = "+virtual-pixel";
    IMCommand["-virtual-pixel"] = "-virtual-pixel";
    IMCommand["-blur"] = "-blur";
    IMCommand["-resize"] = "-resize";
    IMCommand["-adaptive-blur"] = "-adaptive-blur";
    IMCommand["-adaptive-resize"] = "-adaptive-resize";
    IMCommand["-adaptive-sharpen"] = "-adaptive-sharpen";
    IMCommand["-adjoin"] = "-adjoin";
    IMCommand["+adjoin"] = "+adjoin";
    IMCommand["+mattecolor"] = "+mattecolor";
    IMCommand["-mattecolor"] = "-mattecolor";
    IMCommand["-annotate"] = "-annotate";
    IMCommand["-antialias"] = "-antialias";
    IMCommand["+antialias"] = "+antialias";
    IMCommand["-append"] = "-append";
    IMCommand["+append"] = "+append";
    IMCommand["+attenuate"] = "+attenuate";
    IMCommand["-attenuate"] = "-attenuate";
    IMCommand["+authenticate"] = "+authenticate";
    IMCommand["-authenticate"] = "-authenticate";
    IMCommand["-auto-gamma"] = "-auto-gamma";
    IMCommand["-auto-level"] = "-auto-level";
    IMCommand["-auto-orient"] = "-auto-orient";
    IMCommand["-auto-threshold"] = "-auto-threshold";
    IMCommand["+backdrop"] = "+backdrop";
    IMCommand["-backdrop"] = "-backdrop";
    IMCommand["-bench"] = "-bench";
    IMCommand["+bias"] = "+bias";
    IMCommand["-bias"] = "-bias";
    IMCommand["-black-point-compensation"] = "-black-point-compensation";
    IMCommand["+black-point-compensation"] = "+black-point-compensation";
    IMCommand["-black-threshold"] = "-black-threshold";
    IMCommand["+blend"] = "+blend";
    IMCommand["-blend"] = "-blend";
    IMCommand["+blue-primary"] = "+blue-primary";
    IMCommand["-blue-primary"] = "-blue-primary";
    IMCommand["-blue-shift"] = "-blue-shift";
    IMCommand["+blue-shift"] = "+blue-shift";
    IMCommand["-border"] = "-border";
    IMCommand["+bordercolor"] = "+bordercolor";
    IMCommand["-bordercolor"] = "-bordercolor";
    IMCommand["+borderwidth"] = "+borderwidth";
    IMCommand["-borderwidth"] = "-borderwidth";
    IMCommand["-brightness-contrast"] = "-brightness-contrast";
    IMCommand["+cache"] = "+cache";
    IMCommand["-cache"] = "-cache";
    IMCommand["+caption"] = "+caption";
    IMCommand["-caption"] = "-caption";
    IMCommand["-cdl"] = "-cdl";
    IMCommand["+channel"] = "+channel";
    IMCommand["-channel"] = "-channel";
    IMCommand["-channel-fx"] = "-channel-fx";
    IMCommand["-charcoal"] = "-charcoal";
    IMCommand["-chop"] = "-chop";
    IMCommand["-clamp"] = "-clamp";
    IMCommand["-clip"] = "-clip";
    IMCommand["+clip"] = "+clip";
    IMCommand["+clip-mask"] = "+clip-mask";
    IMCommand["-clip-mask"] = "-clip-mask";
    IMCommand["-clip-path"] = "-clip-path";
    IMCommand["+clip-path"] = "+clip-path";
    IMCommand["+clone"] = "+clone";
    IMCommand["-clone"] = "-clone";
    IMCommand["-clut"] = "-clut";
    IMCommand["-coalesce"] = "-coalesce";
    IMCommand["-colorize"] = "-colorize";
    IMCommand["+colormap"] = "+colormap";
    IMCommand["-colormap"] = "-colormap";
    IMCommand["-color-matrix"] = "-color-matrix";
    IMCommand["-colors"] = "-colors";
    IMCommand["+colorspace"] = "+colorspace";
    IMCommand["-colorspace"] = "-colorspace";
    IMCommand["-combine"] = "-combine";
    IMCommand["+combine"] = "+combine";
    IMCommand["+comment"] = "+comment";
    IMCommand["-comment"] = "-comment";
    IMCommand["-compare"] = "-compare";
    IMCommand["-complex"] = "-complex";
    IMCommand["+compose"] = "+compose";
    IMCommand["-compose"] = "-compose";
    IMCommand["-composite"] = "-composite";
    IMCommand["+compress"] = "+compress";
    IMCommand["-compress"] = "-compress";
    IMCommand["-concurrent"] = "-concurrent";
    IMCommand["-connected-components"] = "-connected-components";
    IMCommand["-contrast-stretch"] = "-contrast-stretch";
    IMCommand["-convolve"] = "-convolve";
    IMCommand["-copy"] = "-copy";
    IMCommand["-crop"] = "-crop";
    IMCommand["-cycle"] = "-cycle";
    IMCommand["+debug"] = "+debug";
    IMCommand["-debug"] = "-debug";
    IMCommand["-decipher"] = "-decipher";
    IMCommand["-define"] = "-define";
    IMCommand["+define"] = "+define";
    IMCommand["+delay"] = "+delay";
    IMCommand["-delay"] = "-delay";
    IMCommand["+delete"] = "+delete";
    IMCommand["-delete"] = "-delete";
    IMCommand["+density"] = "+density";
    IMCommand["-density"] = "-density";
    IMCommand["+depth"] = "+depth";
    IMCommand["-depth"] = "-depth";
    IMCommand["+descend"] = "+descend";
    IMCommand["-descend"] = "-descend";
    IMCommand["+deskew"] = "+deskew";
    IMCommand["-deskew"] = "-deskew";
    IMCommand["-despeckle"] = "-despeckle";
    IMCommand["+direction"] = "+direction";
    IMCommand["-direction"] = "-direction";
    IMCommand["+displace"] = "+displace";
    IMCommand["-displace"] = "-displace";
    IMCommand["-display"] = "-display";
    IMCommand["+display"] = "+display";
    IMCommand["+dispose"] = "+dispose";
    IMCommand["-dispose"] = "-dispose";
    IMCommand["+dissimilarity-threshold"] = "+dissimilarity-threshold";
    IMCommand["-dissimilarity-threshold"] = "-dissimilarity-threshold";
    IMCommand["+dissolve"] = "+dissolve";
    IMCommand["-dissolve"] = "-dissolve";
    IMCommand["-distort"] = "-distort";
    IMCommand["+distort"] = "+distort";
    IMCommand["+dither"] = "+dither";
    IMCommand["-dither"] = "-dither";
    IMCommand["-draw"] = "-draw";
    IMCommand["+duplicate"] = "+duplicate";
    IMCommand["-duplicate"] = "-duplicate";
    IMCommand["-duration"] = "-duration";
    IMCommand["+duration"] = "+duration";
    IMCommand["-edge"] = "-edge";
    IMCommand["-emboss"] = "-emboss";
    IMCommand["-encipher"] = "-encipher";
    IMCommand["+encoding"] = "+encoding";
    IMCommand["-encoding"] = "-encoding";
    IMCommand["+endian"] = "+endian";
    IMCommand["-endian"] = "-endian";
    IMCommand["-enhance"] = "-enhance";
    IMCommand["-equalize"] = "-equalize";
    IMCommand["-evaluate"] = "-evaluate";
    IMCommand["-evaluate-sequence"] = "-evaluate-sequence";
    IMCommand["-exit"] = "-exit";
    IMCommand["-extent"] = "-extent";
    IMCommand["+extract"] = "+extract";
    IMCommand["-extract"] = "-extract";
    IMCommand["-family"] = "-family";
    IMCommand["+features"] = "+features";
    IMCommand["-features"] = "-features";
    IMCommand["-fft"] = "-fft";
    IMCommand["+fft"] = "+fft";
    IMCommand["+fill"] = "+fill";
    IMCommand["-fill"] = "-fill";
    IMCommand["+filter"] = "+filter";
    IMCommand["-filter"] = "-filter";
    IMCommand["-flatten"] = "-flatten";
    IMCommand["-flip"] = "-flip";
    IMCommand["-floodfill"] = "-floodfill";
    IMCommand["+floodfill"] = "+floodfill";
    IMCommand["-flop"] = "-flop";
    IMCommand["+font"] = "+font";
    IMCommand["-font"] = "-font";
    IMCommand["+foreground"] = "+foreground";
    IMCommand["-foreground"] = "-foreground";
    IMCommand["-frame"] = "-frame";
    IMCommand["-function"] = "-function";
    IMCommand["+fuzz"] = "+fuzz";
    IMCommand["-fuzz"] = "-fuzz";
    IMCommand["-fx"] = "-fx";
    IMCommand["-gamma"] = "-gamma";
    IMCommand["+gamma"] = "+gamma";
    IMCommand["-gaussian-blur"] = "-gaussian-blur";
    IMCommand["+geometry"] = "+geometry";
    IMCommand["-geometry"] = "-geometry";
    IMCommand["+gravity"] = "+gravity";
    IMCommand["-gravity"] = "-gravity";
    IMCommand["-grayscale"] = "-grayscale";
    IMCommand["+green-primary"] = "+green-primary";
    IMCommand["-green-primary"] = "-green-primary";
    IMCommand["-hald-clut"] = "-hald-clut";
    IMCommand["+highlight-color"] = "+highlight-color";
    IMCommand["-highlight-color"] = "-highlight-color";
    IMCommand["+iconGeometry"] = "+iconGeometry";
    IMCommand["-iconGeometry"] = "-iconGeometry";
    IMCommand["-iconic"] = "-iconic";
    IMCommand["+iconic"] = "+iconic";
    IMCommand["-identify"] = "-identify";
    IMCommand["-ift"] = "-ift";
    IMCommand["+ift"] = "+ift";
    IMCommand["-immutable"] = "-immutable";
    IMCommand["+immutable"] = "+immutable";
    IMCommand["-implode"] = "-implode";
    IMCommand["+insert"] = "+insert";
    IMCommand["-insert"] = "-insert";
    IMCommand["+intensity"] = "+intensity";
    IMCommand["-intensity"] = "-intensity";
    IMCommand["+intent"] = "+intent";
    IMCommand["-intent"] = "-intent";
    IMCommand["+interlace"] = "+interlace";
    IMCommand["-interlace"] = "-interlace";
    IMCommand["+interline-spacing"] = "+interline-spacing";
    IMCommand["-interline-spacing"] = "-interline-spacing";
    IMCommand["+interpolate"] = "+interpolate";
    IMCommand["-interpolate"] = "-interpolate";
    IMCommand["-interpolative-resize"] = "-interpolative-resize";
    IMCommand["+interword-spacing"] = "+interword-spacing";
    IMCommand["-interword-spacing"] = "-interword-spacing";
    IMCommand["+kerning"] = "+kerning";
    IMCommand["-kerning"] = "-kerning";
    IMCommand["-kuwahara"] = "-kuwahara";
    IMCommand["+label"] = "+label";
    IMCommand["-label"] = "-label";
    IMCommand["-lat"] = "-lat";
    IMCommand["-layers"] = "-layers";
    IMCommand["-level"] = "-level";
    IMCommand["+level"] = "+level";
    IMCommand["-level-colors"] = "-level-colors";
    IMCommand["+level-colors"] = "+level-colors";
    IMCommand["-limit"] = "-limit";
    IMCommand["-linear-stretch"] = "-linear-stretch";
    IMCommand["-liquid-rescale"] = "-liquid-rescale";
    IMCommand["-list"] = "-list";
    IMCommand["-local-contrast"] = "-local-contrast";
    IMCommand["+log"] = "+log";
    IMCommand["-log"] = "-log";
    IMCommand["+loop"] = "+loop";
    IMCommand["-loop"] = "-loop";
    IMCommand["+lowlight-color"] = "+lowlight-color";
    IMCommand["-lowlight-color"] = "-lowlight-color";
    IMCommand["-magnify"] = "-magnify";
    IMCommand["+mask"] = "+mask";
    IMCommand["-mask"] = "-mask";
    IMCommand["+metric"] = "+metric";
    IMCommand["-metric"] = "-metric";
    IMCommand["+mode"] = "+mode";
    IMCommand["-modulate"] = "-modulate";
    IMCommand["-moments"] = "-moments";
    IMCommand["+moments"] = "+moments";
    IMCommand["-monitor"] = "-monitor";
    IMCommand["+monitor"] = "+monitor";
    IMCommand["+monochrome"] = "+monochrome";
    IMCommand["-monochrome"] = "-monochrome";
    IMCommand["-morph"] = "-morph";
    IMCommand["-morphology"] = "-morphology";
    IMCommand["-mosaic"] = "-mosaic";
    IMCommand["-motion-blur"] = "-motion-blur";
    IMCommand["+name"] = "+name";
    IMCommand["-name"] = "-name";
    IMCommand["+negate"] = "+negate";
    IMCommand["-negate"] = "-negate";
    IMCommand["-noise"] = "-noise";
    IMCommand["+noise"] = "+noise";
    IMCommand["-noop"] = "-noop";
    IMCommand["-normalize"] = "-normalize";
    IMCommand["-opaque"] = "-opaque";
    IMCommand["+opaque"] = "+opaque";
    IMCommand["-ordered-dither"] = "-ordered-dither";
    IMCommand["+orient"] = "+orient";
    IMCommand["-orient"] = "-orient";
    IMCommand["+page"] = "+page";
    IMCommand["-page"] = "-page";
    IMCommand["-paint"] = "-paint";
    IMCommand["+path"] = "+path";
    IMCommand["-path"] = "-path";
    IMCommand["+pause"] = "+pause";
    IMCommand["-pause"] = "-pause";
    IMCommand["-ping"] = "-ping";
    IMCommand["+ping"] = "+ping";
    IMCommand["+pointsize"] = "+pointsize";
    IMCommand["-pointsize"] = "-pointsize";
    IMCommand["+polaroid"] = "+polaroid";
    IMCommand["-polaroid"] = "-polaroid";
    IMCommand["-poly"] = "-poly";
    IMCommand["-posterize"] = "-posterize";
    IMCommand["+precision"] = "+precision";
    IMCommand["-precision"] = "-precision";
    IMCommand["-preview"] = "-preview";
    IMCommand["-print"] = "-print";
    IMCommand["-process"] = "-process";
    IMCommand["+profile"] = "+profile";
    IMCommand["-profile"] = "-profile";
    IMCommand["+quality"] = "+quality";
    IMCommand["-quality"] = "-quality";
    IMCommand["+quantize"] = "+quantize";
    IMCommand["-quantize"] = "-quantize";
    IMCommand["-raise"] = "-raise";
    IMCommand["+raise"] = "+raise";
    IMCommand["-random-threshold"] = "-random-threshold";
    IMCommand["-range-threshold"] = "-range-threshold";
    IMCommand["-read"] = "-read";
    IMCommand["+read-mask"] = "+read-mask";
    IMCommand["-read-mask"] = "-read-mask";
    IMCommand["+red-primary"] = "+red-primary";
    IMCommand["-red-primary"] = "-red-primary";
    IMCommand["+region"] = "+region";
    IMCommand["-region"] = "-region";
    IMCommand["+remap"] = "+remap";
    IMCommand["-remap"] = "-remap";
    IMCommand["+remote"] = "+remote";
    IMCommand["-remote"] = "-remote";
    IMCommand["-render"] = "-render";
    IMCommand["+render"] = "+render";
    IMCommand["-resample"] = "-resample";
    IMCommand["-respect-parenthesis"] = "-respect-parenthesis";
    IMCommand["+respect-parenthesis"] = "+respect-parenthesis";
    IMCommand["-reverse"] = "-reverse";
    IMCommand["-roll"] = "-roll";
    IMCommand["-rotate"] = "-rotate";
    IMCommand["-rotational-blur"] = "-rotational-blur";
    IMCommand["-sample"] = "-sample";
    IMCommand["+sampling-factor"] = "+sampling-factor";
    IMCommand["-sampling-factor"] = "-sampling-factor";
    IMCommand["-scale"] = "-scale";
    IMCommand["+scene"] = "+scene";
    IMCommand["-scene"] = "-scene";
    IMCommand["+scenes"] = "+scenes";
    IMCommand["-scenes"] = "-scenes";
    IMCommand["+screen"] = "+screen";
    IMCommand["-screen"] = "-screen";
    IMCommand["-script"] = "-script";
    IMCommand["+seed"] = "+seed";
    IMCommand["-seed"] = "-seed";
    IMCommand["-segment"] = "-segment";
    IMCommand["-selective-blur"] = "-selective-blur";
    IMCommand["-separate"] = "-separate";
    IMCommand["-sepia-tone"] = "-sepia-tone";
    IMCommand["+set"] = "+set";
    IMCommand["-set"] = "-set";
    IMCommand["-shade"] = "-shade";
    IMCommand["-shadow"] = "-shadow";
    IMCommand["+shared-memory"] = "+shared-memory";
    IMCommand["-shared-memory"] = "-shared-memory";
    IMCommand["-sharpen"] = "-sharpen";
    IMCommand["-shave"] = "-shave";
    IMCommand["-shear"] = "-shear";
    IMCommand["-sigmoidal-contrast"] = "-sigmoidal-contrast";
    IMCommand["+sigmoidal-contrast"] = "+sigmoidal-contrast";
    IMCommand["+silent"] = "+silent";
    IMCommand["-silent"] = "-silent";
    IMCommand["+similarity-threshold"] = "+similarity-threshold";
    IMCommand["-similarity-threshold"] = "-similarity-threshold";
    IMCommand["-sketch"] = "-sketch";
    IMCommand["-smush"] = "-smush";
    IMCommand["+smush"] = "+smush";
    IMCommand["+snaps"] = "+snaps";
    IMCommand["-snaps"] = "-snaps";
    IMCommand["-solarize"] = "-solarize";
    IMCommand["-sparse-color"] = "-sparse-color";
    IMCommand["-splice"] = "-splice";
    IMCommand["-spread"] = "-spread";
    IMCommand["-statistic"] = "-statistic";
    IMCommand["+stegano"] = "+stegano";
    IMCommand["-stegano"] = "-stegano";
    IMCommand["-stereo"] = "-stereo";
    IMCommand["-stretch"] = "-stretch";
    IMCommand["-strip"] = "-strip";
    IMCommand["+stroke"] = "+stroke";
    IMCommand["-stroke"] = "-stroke";
    IMCommand["-strokewidth"] = "-strokewidth";
    IMCommand["+strokewidth"] = "+strokewidth";
    IMCommand["+style"] = "+style";
    IMCommand["-style"] = "-style";
    IMCommand["-subimage"] = "-subimage";
    IMCommand["-subimage-search"] = "-subimage-search";
    IMCommand["+subimage-search"] = "+subimage-search";
    IMCommand["+swap"] = "+swap";
    IMCommand["-swap"] = "-swap";
    IMCommand["-swirl"] = "-swirl";
    IMCommand["-synchronize"] = "-synchronize";
    IMCommand["+synchronize"] = "+synchronize";
    IMCommand["-taint"] = "-taint";
    IMCommand["+taint"] = "+taint";
    IMCommand["+text-font"] = "+text-font";
    IMCommand["-text-font"] = "-text-font";
    IMCommand["+texture"] = "+texture";
    IMCommand["-texture"] = "-texture";
    IMCommand["+threshold"] = "+threshold";
    IMCommand["-threshold"] = "-threshold";
    IMCommand["-thumbnail"] = "-thumbnail";
    IMCommand["+tile"] = "+tile";
    IMCommand["-tile"] = "-tile";
    IMCommand["+tile-offset"] = "+tile-offset";
    IMCommand["-tile-offset"] = "-tile-offset";
    IMCommand["-tint"] = "-tint";
    IMCommand["+tint"] = "+tint";
    IMCommand["+title"] = "+title";
    IMCommand["-title"] = "-title";
    IMCommand["-transparent"] = "-transparent";
    IMCommand["+transparent"] = "+transparent";
    IMCommand["+transparent-color"] = "+transparent-color";
    IMCommand["-transparent-color"] = "-transparent-color";
    IMCommand["-transpose"] = "-transpose";
    IMCommand["-transverse"] = "-transverse";
    IMCommand["-treedepth"] = "-treedepth";
    IMCommand["-trim"] = "-trim";
    IMCommand["+type"] = "+type";
    IMCommand["-type"] = "-type";
    IMCommand["+undercolor"] = "+undercolor";
    IMCommand["-undercolor"] = "-undercolor";
    IMCommand["-unique"] = "-unique";
    IMCommand["+unique"] = "+unique";
    IMCommand["-unique-colors"] = "-unique-colors";
    IMCommand["+units"] = "+units";
    IMCommand["-units"] = "-units";
    IMCommand["-unsharp"] = "-unsharp";
    IMCommand["+update"] = "+update";
    IMCommand["-update"] = "-update";
    IMCommand["+use-pixmap"] = "+use-pixmap";
    IMCommand["-use-pixmap"] = "-use-pixmap";
    IMCommand["-verbose"] = "-verbose";
    IMCommand["+verbose"] = "+verbose";
    IMCommand["-version"] = "-version";
    IMCommand["+view"] = "+view";
    IMCommand["-view"] = "-view";
    IMCommand["-vignette"] = "-vignette";
    IMCommand["+visual"] = "+visual";
    IMCommand["-visual"] = "-visual";
    IMCommand["+watermark"] = "+watermark";
    IMCommand["-watermark"] = "-watermark";
    IMCommand["-wave"] = "-wave";
    IMCommand["-wavelet-denoise"] = "-wavelet-denoise";
    IMCommand["-weight"] = "-weight";
    IMCommand["+white-point"] = "+white-point";
    IMCommand["-white-point"] = "-white-point";
    IMCommand["-white-threshold"] = "-white-threshold";
    IMCommand["+window"] = "+window";
    IMCommand["-window"] = "-window";
    IMCommand["+window-group"] = "+window-group";
    IMCommand["-window-group"] = "-window-group";
    IMCommand["-write"] = "-write";
    IMCommand["+write"] = "+write";
    IMCommand["+write-mask"] = "+write-mask";
    IMCommand["-write-mask"] = "-write-mask";
})(IMCommand || (IMCommand = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMCompliance;
(function (IMCompliance) {
    IMCompliance["CSS"] = "CSS";
    IMCompliance["MVG"] = "MVG";
    IMCompliance["No"] = "No";
    IMCompliance["SVG"] = "SVG";
    IMCompliance["X11"] = "X11";
    IMCompliance["XPM"] = "XPM";
})(IMCompliance || (IMCompliance = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMComplex;
(function (IMComplex) {
    IMComplex["Add"] = "Add";
    IMComplex["Conjugate"] = "Conjugate";
    IMComplex["Divide"] = "Divide";
    IMComplex["MagnitudePhase"] = "MagnitudePhase";
    IMComplex["Multiply"] = "Multiply";
    IMComplex["RealImaginary"] = "RealImaginary";
    IMComplex["Subtract"] = "Subtract";
})(IMComplex || (IMComplex = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMCompose;
(function (IMCompose) {
    IMCompose["Atop"] = "Atop";
    IMCompose["Blend"] = "Blend";
    IMCompose["Blur"] = "Blur";
    IMCompose["Bumpmap"] = "Bumpmap";
    IMCompose["ChangeMask"] = "ChangeMask";
    IMCompose["Clear"] = "Clear";
    IMCompose["ColorBurn"] = "ColorBurn";
    IMCompose["ColorDodge"] = "ColorDodge";
    IMCompose["Colorize"] = "Colorize";
    IMCompose["CopyAlpha"] = "CopyAlpha";
    IMCompose["CopyBlack"] = "CopyBlack";
    IMCompose["CopyBlue"] = "CopyBlue";
    IMCompose["CopyCyan"] = "CopyCyan";
    IMCompose["CopyGreen"] = "CopyGreen";
    IMCompose["Copy"] = "Copy";
    IMCompose["CopyMagenta"] = "CopyMagenta";
    IMCompose["CopyRed"] = "CopyRed";
    IMCompose["CopyYellow"] = "CopyYellow";
    IMCompose["Darken"] = "Darken";
    IMCompose["DarkenIntensity"] = "DarkenIntensity";
    IMCompose["DivideDst"] = "DivideDst";
    IMCompose["DivideSrc"] = "DivideSrc";
    IMCompose["Dst"] = "Dst";
    IMCompose["Difference"] = "Difference";
    IMCompose["Displace"] = "Displace";
    IMCompose["Dissolve"] = "Dissolve";
    IMCompose["Distort"] = "Distort";
    IMCompose["DstAtop"] = "DstAtop";
    IMCompose["DstIn"] = "DstIn";
    IMCompose["DstOut"] = "DstOut";
    IMCompose["DstOver"] = "DstOver";
    IMCompose["Exclusion"] = "Exclusion";
    IMCompose["HardLight"] = "HardLight";
    IMCompose["HardMix"] = "HardMix";
    IMCompose["Hue"] = "Hue";
    IMCompose["In"] = "In";
    IMCompose["Intensity"] = "Intensity";
    IMCompose["Lighten"] = "Lighten";
    IMCompose["LightenIntensity"] = "LightenIntensity";
    IMCompose["LinearBurn"] = "LinearBurn";
    IMCompose["LinearDodge"] = "LinearDodge";
    IMCompose["LinearLight"] = "LinearLight";
    IMCompose["Luminize"] = "Luminize";
    IMCompose["Mathematics"] = "Mathematics";
    IMCompose["MinusDst"] = "MinusDst";
    IMCompose["MinusSrc"] = "MinusSrc";
    IMCompose["Modulate"] = "Modulate";
    IMCompose["ModulusAdd"] = "ModulusAdd";
    IMCompose["ModulusSubtract"] = "ModulusSubtract";
    IMCompose["Multiply"] = "Multiply";
    IMCompose["None"] = "None";
    IMCompose["Out"] = "Out";
    IMCompose["Overlay"] = "Overlay";
    IMCompose["Over"] = "Over";
    IMCompose["PegtopLight"] = "PegtopLight";
    IMCompose["PinLight"] = "PinLight";
    IMCompose["Plus"] = "Plus";
    IMCompose["Replace"] = "Replace";
    IMCompose["Saturate"] = "Saturate";
    IMCompose["Screen"] = "Screen";
    IMCompose["SoftLight"] = "SoftLight";
    IMCompose["Src"] = "Src";
    IMCompose["SrcAtop"] = "SrcAtop";
    IMCompose["SrcIn"] = "SrcIn";
    IMCompose["SrcOut"] = "SrcOut";
    IMCompose["SrcOver"] = "SrcOver";
    IMCompose["Stereo"] = "Stereo";
    IMCompose["VividLight"] = "VividLight";
    IMCompose["Xor"] = "Xor";
})(IMCompose || (IMCompose = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMCompress;
(function (IMCompress) {
    IMCompress["B44A"] = "B44A";
    IMCompress["B44"] = "B44";
    IMCompress["BZip"] = "BZip";
    IMCompress["DXT1"] = "DXT1";
    IMCompress["DXT3"] = "DXT3";
    IMCompress["DXT5"] = "DXT5";
    IMCompress["Fax"] = "Fax";
    IMCompress["Group4"] = "Group4";
    IMCompress["JBIG1"] = "JBIG1";
    IMCompress["JBIG2"] = "JBIG2";
    IMCompress["JPEG2000"] = "JPEG2000";
    IMCompress["JPEG"] = "JPEG";
    IMCompress["LosslessJPEG"] = "LosslessJPEG";
    IMCompress["Lossless"] = "Lossless";
    IMCompress["LZMA"] = "LZMA";
    IMCompress["LZW"] = "LZW";
    IMCompress["None"] = "None";
    IMCompress["Piz"] = "Piz";
    IMCompress["Pxr24"] = "Pxr24";
    IMCompress["RLE"] = "RLE";
    IMCompress["RunlengthEncoded"] = "RunlengthEncoded";
    IMCompress["WebP"] = "WebP";
    IMCompress["ZipS"] = "ZipS";
    IMCompress["Zip"] = "Zip";
    IMCompress["Zstd"] = "Zstd";
})(IMCompress || (IMCompress = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMDataType;
(function (IMDataType) {
    IMDataType["Byte"] = "Byte";
    IMDataType["Long"] = "Long";
    IMDataType["Short"] = "Short";
    IMDataType["String"] = "String";
})(IMDataType || (IMDataType = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMDebug;
(function (IMDebug) {
    IMDebug["All"] = "All";
    IMDebug["Accelerate"] = "Accelerate";
    IMDebug["Annotate"] = "Annotate";
    IMDebug["Blob"] = "Blob";
    IMDebug["Cache"] = "Cache";
    IMDebug["Coder"] = "Coder";
    IMDebug["Command"] = "Command";
    IMDebug["Configure"] = "Configure";
    IMDebug["Deprecate"] = "Deprecate";
    IMDebug["Draw"] = "Draw";
    IMDebug["Exception"] = "Exception";
    IMDebug["Locale"] = "Locale";
    IMDebug["Module"] = "Module";
    IMDebug["None"] = "None";
    IMDebug["Pixel"] = "Pixel";
    IMDebug["Policy"] = "Policy";
    IMDebug["Resource"] = "Resource";
    IMDebug["Trace"] = "Trace";
    IMDebug["Transform"] = "Transform";
    IMDebug["User"] = "User";
    IMDebug["Wand"] = "Wand";
    IMDebug["X11"] = "X11";
})(IMDebug || (IMDebug = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMDecoration;
(function (IMDecoration) {
    IMDecoration["LineThrough"] = "LineThrough";
    IMDecoration["None"] = "None";
    IMDecoration["Overline"] = "Overline";
    IMDecoration["Underline"] = "Underline";
})(IMDecoration || (IMDecoration = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMDirection;
(function (IMDirection) {
    IMDirection["right-to-left"] = "right-to-left";
    IMDirection["left-to-right"] = "left-to-right";
})(IMDirection || (IMDirection = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMDispose;
(function (IMDispose) {
    IMDispose["Undefined"] = "Undefined";
    IMDispose["Background"] = "Background";
    IMDispose["None"] = "None";
    IMDispose["Previous"] = "Previous";
    IMDispose["0_"] = "0";
    IMDispose["1_"] = "1";
    IMDispose["2_"] = "2";
    IMDispose["3_"] = "3";
})(IMDispose || (IMDispose = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMDistort;
(function (IMDistort) {
    IMDistort["Affine"] = "Affine";
    IMDistort["AffineProjection"] = "AffineProjection";
    IMDistort["ScaleRotateTranslate"] = "ScaleRotateTranslate";
    IMDistort["SRT"] = "SRT";
    IMDistort["Perspective"] = "Perspective";
    IMDistort["PerspectiveProjection"] = "PerspectiveProjection";
    IMDistort["BilinearForward"] = "BilinearForward";
    IMDistort["BilinearReverse"] = "BilinearReverse";
    IMDistort["Polynomial"] = "Polynomial";
    IMDistort["Arc"] = "Arc";
    IMDistort["Polar"] = "Polar";
    IMDistort["DePolar"] = "DePolar";
    IMDistort["Barrel"] = "Barrel";
    IMDistort["BarrelInverse"] = "BarrelInverse";
    IMDistort["Shepards"] = "Shepards";
    IMDistort["Resize"] = "Resize";
})(IMDistort || (IMDistort = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMDither;
(function (IMDither) {
    IMDither["None"] = "None";
    IMDither["FloydSteinberg"] = "FloydSteinberg";
    IMDither["Riemersma"] = "Riemersma";
})(IMDither || (IMDither = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMEndian;
(function (IMEndian) {
    IMEndian["LSB"] = "LSB";
    IMEndian["MSB"] = "MSB";
})(IMEndian || (IMEndian = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMEvaluate;
(function (IMEvaluate) {
    IMEvaluate["Abs"] = "Abs";
    IMEvaluate["Add"] = "Add";
    IMEvaluate["AddModulus"] = "AddModulus";
    IMEvaluate["And"] = "And";
    IMEvaluate["Cos"] = "Cos";
    IMEvaluate["Cosine"] = "Cosine";
    IMEvaluate["Divide"] = "Divide";
    IMEvaluate["Exp"] = "Exp";
    IMEvaluate["Exponential"] = "Exponential";
    IMEvaluate["GaussianNoise"] = "GaussianNoise";
    IMEvaluate["ImpulseNoise"] = "ImpulseNoise";
    IMEvaluate["LaplacianNoise"] = "LaplacianNoise";
    IMEvaluate["LeftShift"] = "LeftShift";
    IMEvaluate["Log"] = "Log";
    IMEvaluate["Max"] = "Max";
    IMEvaluate["Mean"] = "Mean";
    IMEvaluate["Median"] = "Median";
    IMEvaluate["Min"] = "Min";
    IMEvaluate["MultiplicativeNoise"] = "MultiplicativeNoise";
    IMEvaluate["Multiply"] = "Multiply";
    IMEvaluate["Or"] = "Or";
    IMEvaluate["PoissonNoise"] = "PoissonNoise";
    IMEvaluate["Pow"] = "Pow";
    IMEvaluate["RightShift"] = "RightShift";
    IMEvaluate["RMS"] = "RMS";
    IMEvaluate["RootMeanSquare"] = "RootMeanSquare";
    IMEvaluate["Set"] = "Set";
    IMEvaluate["Sin"] = "Sin";
    IMEvaluate["Sine"] = "Sine";
    IMEvaluate["Subtract"] = "Subtract";
    IMEvaluate["Sum"] = "Sum";
    IMEvaluate["Threshold"] = "Threshold";
    IMEvaluate["ThresholdBlack"] = "ThresholdBlack";
    IMEvaluate["ThresholdWhite"] = "ThresholdWhite";
    IMEvaluate["UniformNoise"] = "UniformNoise";
    IMEvaluate["Xor"] = "Xor";
})(IMEvaluate || (IMEvaluate = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMFillRule;
(function (IMFillRule) {
    IMFillRule["Evenodd"] = "Evenodd";
    IMFillRule["NonZero"] = "NonZero";
})(IMFillRule || (IMFillRule = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMFilter;
(function (IMFilter) {
    IMFilter["Bartlett"] = "Bartlett";
    IMFilter["Blackman"] = "Blackman";
    IMFilter["Bohman"] = "Bohman";
    IMFilter["Box"] = "Box";
    IMFilter["Catrom"] = "Catrom";
    IMFilter["Cosine"] = "Cosine";
    IMFilter["Cubic"] = "Cubic";
    IMFilter["Gaussian"] = "Gaussian";
    IMFilter["Hamming"] = "Hamming";
    IMFilter["Hann"] = "Hann";
    IMFilter["Hermite"] = "Hermite";
    IMFilter["Jinc"] = "Jinc";
    IMFilter["Kaiser"] = "Kaiser";
    IMFilter["Lagrange"] = "Lagrange";
    IMFilter["Lanczos"] = "Lanczos";
    IMFilter["Lanczos2"] = "Lanczos2";
    IMFilter["Lanczos2Sharp"] = "Lanczos2Sharp";
    IMFilter["LanczosRadius"] = "LanczosRadius";
    IMFilter["LanczosSharp"] = "LanczosSharp";
    IMFilter["Mitchell"] = "Mitchell";
    IMFilter["Parzen"] = "Parzen";
    IMFilter["Point"] = "Point";
    IMFilter["Quadratic"] = "Quadratic";
    IMFilter["Robidoux"] = "Robidoux";
    IMFilter["RobidouxSharp"] = "RobidouxSharp";
    IMFilter["Sinc"] = "Sinc";
    IMFilter["SincFast"] = "SincFast";
    IMFilter["Spline"] = "Spline";
    IMFilter["CubicSpline"] = "CubicSpline";
    IMFilter["Triangle"] = "Triangle";
    IMFilter["Welch"] = "Welch";
})(IMFilter || (IMFilter = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMFunction;
(function (IMFunction) {
    IMFunction["Polynomial"] = "Polynomial";
    IMFunction["Sinusoid"] = "Sinusoid";
    IMFunction["ArcSin"] = "ArcSin";
    IMFunction["ArcTan"] = "ArcTan";
})(IMFunction || (IMFunction = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMGradient;
(function (IMGradient) {
    IMGradient["Linear"] = "Linear";
    IMGradient["Radial"] = "Radial";
})(IMGradient || (IMGradient = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMGravity;
(function (IMGravity) {
    IMGravity["None"] = "None";
    IMGravity["Center"] = "Center";
    IMGravity["East"] = "East";
    IMGravity["Forget"] = "Forget";
    IMGravity["NorthEast"] = "NorthEast";
    IMGravity["North"] = "North";
    IMGravity["NorthWest"] = "NorthWest";
    IMGravity["SouthEast"] = "SouthEast";
    IMGravity["South"] = "South";
    IMGravity["SouthWest"] = "SouthWest";
    IMGravity["West"] = "West";
})(IMGravity || (IMGravity = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMIntensity;
(function (IMIntensity) {
    IMIntensity["Average"] = "Average";
    IMIntensity["Brightness"] = "Brightness";
    IMIntensity["Lightness"] = "Lightness";
    IMIntensity["Mean"] = "Mean";
    IMIntensity["MS"] = "MS";
    IMIntensity["Rec601Luma"] = "Rec601Luma";
    IMIntensity["Rec601Luminance"] = "Rec601Luminance";
    IMIntensity["Rec709Luma"] = "Rec709Luma";
    IMIntensity["Rec709Luminance"] = "Rec709Luminance";
    IMIntensity["RMS"] = "RMS";
})(IMIntensity || (IMIntensity = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMIntent;
(function (IMIntent) {
    IMIntent["Absolute"] = "Absolute";
    IMIntent["Perceptual"] = "Perceptual";
    IMIntent["Relative"] = "Relative";
    IMIntent["Saturation"] = "Saturation";
})(IMIntent || (IMIntent = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMInterlace;
(function (IMInterlace) {
    IMInterlace["Line"] = "Line";
    IMInterlace["None"] = "None";
    IMInterlace["Plane"] = "Plane";
    IMInterlace["Partition"] = "Partition";
    IMInterlace["GIF"] = "GIF";
    IMInterlace["JPEG"] = "JPEG";
    IMInterlace["PNG"] = "PNG";
})(IMInterlace || (IMInterlace = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMInterpolate;
(function (IMInterpolate) {
    IMInterpolate["Average"] = "Average";
    IMInterpolate["Average4"] = "Average4";
    IMInterpolate["Average9"] = "Average9";
    IMInterpolate["Average16"] = "Average16";
    IMInterpolate["Background"] = "Background";
    IMInterpolate["Bilinear"] = "Bilinear";
    IMInterpolate["Blend"] = "Blend";
    IMInterpolate["Catrom"] = "Catrom";
    IMInterpolate["Integer"] = "Integer";
    IMInterpolate["Mesh"] = "Mesh";
    IMInterpolate["Nearest"] = "Nearest";
    IMInterpolate["Spline"] = "Spline";
})(IMInterpolate || (IMInterpolate = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMKernel;
(function (IMKernel) {
    IMKernel["Unity"] = "Unity";
    IMKernel["Gaussian"] = "Gaussian";
    IMKernel["DoG"] = "DoG";
    IMKernel["LoG"] = "LoG";
    IMKernel["Blur"] = "Blur";
    IMKernel["Comet"] = "Comet";
    IMKernel["Binomial"] = "Binomial";
    IMKernel["Laplacian"] = "Laplacian";
    IMKernel["Sobel"] = "Sobel";
    IMKernel["FreiChen"] = "FreiChen";
    IMKernel["Roberts"] = "Roberts";
    IMKernel["Prewitt"] = "Prewitt";
    IMKernel["Compass"] = "Compass";
    IMKernel["Kirsch"] = "Kirsch";
    IMKernel["Diamond"] = "Diamond";
    IMKernel["Square"] = "Square";
    IMKernel["Rectangle"] = "Rectangle";
    IMKernel["Disk"] = "Disk";
    IMKernel["Octagon"] = "Octagon";
    IMKernel["Plus"] = "Plus";
    IMKernel["Cross"] = "Cross";
    IMKernel["Ring"] = "Ring";
    IMKernel["Peaks"] = "Peaks";
    IMKernel["Edges"] = "Edges";
    IMKernel["Corners"] = "Corners";
    IMKernel["Diagonals"] = "Diagonals";
    IMKernel["LineEnds"] = "LineEnds";
    IMKernel["LineJunctions"] = "LineJunctions";
    IMKernel["Ridges"] = "Ridges";
    IMKernel["ConvexHull"] = "ConvexHull";
    IMKernel["ThinSe"] = "ThinSe";
    IMKernel["Skeleton"] = "Skeleton";
    IMKernel["Chebyshev"] = "Chebyshev";
    IMKernel["Manhattan"] = "Manhattan";
    IMKernel["Octagonal"] = "Octagonal";
    IMKernel["Euclidean"] = "Euclidean";
})(IMKernel || (IMKernel = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMLayers;
(function (IMLayers) {
    IMLayers["Coalesce"] = "Coalesce";
    IMLayers["CompareAny"] = "CompareAny";
    IMLayers["CompareClear"] = "CompareClear";
    IMLayers["CompareOverlay"] = "CompareOverlay";
    IMLayers["Dispose"] = "Dispose";
    IMLayers["Optimize"] = "Optimize";
    IMLayers["OptimizeFrame"] = "OptimizeFrame";
    IMLayers["OptimizePlus"] = "OptimizePlus";
    IMLayers["OptimizeTransparency"] = "OptimizeTransparency";
    IMLayers["RemoveDups"] = "RemoveDups";
    IMLayers["RemoveZero"] = "RemoveZero";
    IMLayers["Composite"] = "Composite";
    IMLayers["Merge"] = "Merge";
    IMLayers["Flatten"] = "Flatten";
    IMLayers["Mosaic"] = "Mosaic";
    IMLayers["TrimBounds"] = "TrimBounds";
})(IMLayers || (IMLayers = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMLineCap;
(function (IMLineCap) {
    IMLineCap["Butt"] = "Butt";
    IMLineCap["Round"] = "Round";
    IMLineCap["Square"] = "Square";
})(IMLineCap || (IMLineCap = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMLineJoin;
(function (IMLineJoin) {
    IMLineJoin["Bevel"] = "Bevel";
    IMLineJoin["Miter"] = "Miter";
    IMLineJoin["Round"] = "Round";
})(IMLineJoin || (IMLineJoin = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMList;
(function (IMList) {
    IMList["Align"] = "Align";
    IMList["Alpha"] = "Alpha";
    IMList["AutoThreshold"] = "AutoThreshold";
    IMList["Boolean"] = "Boolean";
    IMList["Cache"] = "Cache";
    IMList["Channel"] = "Channel";
    IMList["Class"] = "Class";
    IMList["CLI"] = "CLI";
    IMList["ClipPath"] = "ClipPath";
    IMList["Coder"] = "Coder";
    IMList["Color"] = "Color";
    IMList["Colorspace"] = "Colorspace";
    IMList["Command"] = "Command";
    IMList["Compliance"] = "Compliance";
    IMList["Complex"] = "Complex";
    IMList["Compose"] = "Compose";
    IMList["Compress"] = "Compress";
    IMList["Configure"] = "Configure";
    IMList["DataType"] = "DataType";
    IMList["Debug"] = "Debug";
    IMList["Decoration"] = "Decoration";
    IMList["Delegate"] = "Delegate";
    IMList["Direction"] = "Direction";
    IMList["Dispose"] = "Dispose";
    IMList["Distort"] = "Distort";
    IMList["Dither"] = "Dither";
    IMList["Endian"] = "Endian";
    IMList["Evaluate"] = "Evaluate";
    IMList["FillRule"] = "FillRule";
    IMList["Filter"] = "Filter";
    IMList["Font"] = "Font";
    IMList["Format"] = "Format";
    IMList["Function"] = "Function";
    IMList["Gradient"] = "Gradient";
    IMList["Gravity"] = "Gravity";
    IMList["Intensity"] = "Intensity";
    IMList["Intent"] = "Intent";
    IMList["Interlace"] = "Interlace";
    IMList["Interpolate"] = "Interpolate";
    IMList["Kernel"] = "Kernel";
    IMList["Layers"] = "Layers";
    IMList["LineCap"] = "LineCap";
    IMList["LineJoin"] = "LineJoin";
    IMList["List"] = "List";
    IMList["Locale"] = "Locale";
    IMList["LogEvent"] = "LogEvent";
    IMList["Log"] = "Log";
    IMList["Magic"] = "Magic";
    IMList["Method"] = "Method";
    IMList["Metric"] = "Metric";
    IMList["Mime"] = "Mime";
    IMList["Mode"] = "Mode";
    IMList["Morphology"] = "Morphology";
    IMList["Module"] = "Module";
    IMList["Noise"] = "Noise";
    IMList["Orientation"] = "Orientation";
    IMList["PixelChannel"] = "PixelChannel";
    IMList["PixelIntensity"] = "PixelIntensity";
    IMList["PixelMask"] = "PixelMask";
    IMList["PixelTrait"] = "PixelTrait";
    IMList["Policy"] = "Policy";
    IMList["PolicyDomain"] = "PolicyDomain";
    IMList["PolicyRights"] = "PolicyRights";
    IMList["Preview"] = "Preview";
    IMList["Primitive"] = "Primitive";
    IMList["QuantumFormat"] = "QuantumFormat";
    IMList["Resource"] = "Resource";
    IMList["SparseColor"] = "SparseColor";
    IMList["Statistic"] = "Statistic";
    IMList["Storage"] = "Storage";
    IMList["Stretch"] = "Stretch";
    IMList["Style"] = "Style";
    IMList["Threshold"] = "Threshold";
    IMList["Tool"] = "Tool";
    IMList["Type"] = "Type";
    IMList["Units"] = "Units";
    IMList["Validate"] = "Validate";
    IMList["VirtualPixel"] = "VirtualPixel";
    IMList["Weight"] = "Weight";
})(IMList || (IMList = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMLogEvent;
(function (IMLogEvent) {
    IMLogEvent["All"] = "All";
    IMLogEvent["Accelerate"] = "Accelerate";
    IMLogEvent["Annotate"] = "Annotate";
    IMLogEvent["Blob"] = "Blob";
    IMLogEvent["Cache"] = "Cache";
    IMLogEvent["Coder"] = "Coder";
    IMLogEvent["Command"] = "Command";
    IMLogEvent["Configure"] = "Configure";
    IMLogEvent["Deprecate"] = "Deprecate";
    IMLogEvent["Draw"] = "Draw";
    IMLogEvent["Exception"] = "Exception";
    IMLogEvent["Locale"] = "Locale";
    IMLogEvent["Module"] = "Module";
    IMLogEvent["None"] = "None";
    IMLogEvent["Pixel"] = "Pixel";
    IMLogEvent["Policy"] = "Policy";
    IMLogEvent["Resource"] = "Resource";
    IMLogEvent["Trace"] = "Trace";
    IMLogEvent["Transform"] = "Transform";
    IMLogEvent["User"] = "User";
    IMLogEvent["Wand"] = "Wand";
    IMLogEvent["X11"] = "X11";
})(IMLogEvent || (IMLogEvent = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMLog;
(function (IMLog) {
    IMLog["Path: /etc/ImageMagick-7/log.xml"] = "Path: /etc/ImageMagick-7/log.xml";
    IMLog["Console        Generations     Limit  Format"] = "Console        Generations     Limit  Format";
    IMLog["-------------------------------------------------------------------------------"] = "-------------------------------------------------------------------------------";
    IMLog["Magick-%g.log            3      2000   %t %r %u %v %d %c[%p]: %m/%f/%l/%d\n  %e"] = "Magick-%g.log            3      2000   %t %r %u %v %d %c[%p]: %m/%f/%l/%d\n  %e";
    IMLog["Path: [built-in]"] = "Path: [built-in]";
    IMLog["Magick-%g.log            0         0   %t %r %u %v %d %c[%p]: %m/%f/%l/%d\n  %e"] = "Magick-%g.log            0         0   %t %r %u %v %d %c[%p]: %m/%f/%l/%d\n  %e";
})(IMLog || (IMLog = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMMethod;
(function (IMMethod) {
    IMMethod["FillToBorder"] = "FillToBorder";
    IMMethod["Floodfill"] = "Floodfill";
    IMMethod["Point"] = "Point";
    IMMethod["Replace"] = "Replace";
    IMMethod["Reset"] = "Reset";
})(IMMethod || (IMMethod = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMMetric;
(function (IMMetric) {
    IMMetric["AE"] = "AE";
    IMMetric["DSSIM"] = "DSSIM";
    IMMetric["Fuzz"] = "Fuzz";
    IMMetric["MAE"] = "MAE";
    IMMetric["MEPP"] = "MEPP";
    IMMetric["MSE"] = "MSE";
    IMMetric["NCC"] = "NCC";
    IMMetric["PAE"] = "PAE";
    IMMetric["PHASH"] = "PHASH";
    IMMetric["PSNR"] = "PSNR";
    IMMetric["RMSE"] = "RMSE";
    IMMetric["SSIM"] = "SSIM";
})(IMMetric || (IMMetric = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMMode;
(function (IMMode) {
    IMMode["Concatenate"] = "Concatenate";
    IMMode["Frame"] = "Frame";
    IMMode["Unframe"] = "Unframe";
})(IMMode || (IMMode = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMMorphology;
(function (IMMorphology) {
    IMMorphology["Correlate"] = "Correlate";
    IMMorphology["Convolve"] = "Convolve";
    IMMorphology["Dilate"] = "Dilate";
    IMMorphology["Erode"] = "Erode";
    IMMorphology["Close"] = "Close";
    IMMorphology["Open"] = "Open";
    IMMorphology["DilateIntensity"] = "DilateIntensity";
    IMMorphology["ErodeIntensity"] = "ErodeIntensity";
    IMMorphology["CloseIntensity"] = "CloseIntensity";
    IMMorphology["OpenIntensity"] = "OpenIntensity";
    IMMorphology["DilateI"] = "DilateI";
    IMMorphology["ErodeI"] = "ErodeI";
    IMMorphology["CloseI"] = "CloseI";
    IMMorphology["OpenI"] = "OpenI";
    IMMorphology["Smooth"] = "Smooth";
    IMMorphology["EdgeOut"] = "EdgeOut";
    IMMorphology["EdgeIn"] = "EdgeIn";
    IMMorphology["Edge"] = "Edge";
    IMMorphology["TopHat"] = "TopHat";
    IMMorphology["BottomHat"] = "BottomHat";
    IMMorphology["Hmt"] = "Hmt";
    IMMorphology["HitNMiss"] = "HitNMiss";
    IMMorphology["HitAndMiss"] = "HitAndMiss";
    IMMorphology["Thinning"] = "Thinning";
    IMMorphology["Thicken"] = "Thicken";
    IMMorphology["Distance"] = "Distance";
    IMMorphology["IterativeDistance"] = "IterativeDistance";
})(IMMorphology || (IMMorphology = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMModule;
(function (IMModule) {
    IMModule["Path: /usr/lib/ImageMagick-7.0.8/modules-Q16HDRI/coders"] = "Path: /usr/lib/ImageMagick-7.0.8/modules-Q16HDRI/coders";
    IMModule["Image Coder"] = "Image Coder";
    IMModule["-------------------------------------------------------------------------------"] = "-------------------------------------------------------------------------------";
    IMModule["aai"] = "aai";
    IMModule["art"] = "art";
    IMModule["avs"] = "avs";
    IMModule["bgr"] = "bgr";
    IMModule["bmp"] = "bmp";
    IMModule["braille"] = "braille";
    IMModule["cals"] = "cals";
    IMModule["caption"] = "caption";
    IMModule["cin"] = "cin";
    IMModule["cip"] = "cip";
    IMModule["clip"] = "clip";
    IMModule["cmyk"] = "cmyk";
    IMModule["cut"] = "cut";
    IMModule["dcm"] = "dcm";
    IMModule["dds"] = "dds";
    IMModule["debug"] = "debug";
    IMModule["dib"] = "dib";
    IMModule["dng"] = "dng";
    IMModule["dot"] = "dot";
    IMModule["dpx"] = "dpx";
    IMModule["ept"] = "ept";
    IMModule["exr"] = "exr";
    IMModule["fax"] = "fax";
    IMModule["fits"] = "fits";
    IMModule["gif"] = "gif";
    IMModule["gradient"] = "gradient";
    IMModule["gray"] = "gray";
    IMModule["hald"] = "hald";
    IMModule["hdr"] = "hdr";
    IMModule["heic"] = "heic";
    IMModule["histogram"] = "histogram";
    IMModule["hrz"] = "hrz";
    IMModule["html"] = "html";
    IMModule["icon"] = "icon";
    IMModule["info"] = "info";
    IMModule["inline"] = "inline";
    IMModule["ipl"] = "ipl";
    IMModule["jbig"] = "jbig";
    IMModule["jnx"] = "jnx";
    IMModule["jp2"] = "jp2";
    IMModule["jpeg"] = "jpeg";
    IMModule["json"] = "json";
    IMModule["label"] = "label";
    IMModule["mac"] = "mac";
    IMModule["magick"] = "magick";
    IMModule["map"] = "map";
    IMModule["mask"] = "mask";
    IMModule["mat"] = "mat";
    IMModule["matte"] = "matte";
    IMModule["meta"] = "meta";
    IMModule["miff"] = "miff";
    IMModule["mono"] = "mono";
    IMModule["mpc"] = "mpc";
    IMModule["mpeg"] = "mpeg";
    IMModule["mpr"] = "mpr";
    IMModule["msl"] = "msl";
    IMModule["mtv"] = "mtv";
    IMModule["mvg"] = "mvg";
    IMModule["null"] = "null";
    IMModule["otb"] = "otb";
    IMModule["palm"] = "palm";
    IMModule["pango"] = "pango";
    IMModule["pattern"] = "pattern";
    IMModule["pcd"] = "pcd";
    IMModule["pcl"] = "pcl";
    IMModule["pcx"] = "pcx";
    IMModule["pdb"] = "pdb";
    IMModule["pdf"] = "pdf";
    IMModule["pes"] = "pes";
    IMModule["pgx"] = "pgx";
    IMModule["pict"] = "pict";
    IMModule["pix"] = "pix";
    IMModule["plasma"] = "plasma";
    IMModule["png"] = "png";
    IMModule["pnm"] = "pnm";
    IMModule["ps"] = "ps";
    IMModule["ps2"] = "ps2";
    IMModule["ps3"] = "ps3";
    IMModule["psd"] = "psd";
    IMModule["pwp"] = "pwp";
    IMModule["raw"] = "raw";
    IMModule["rgb"] = "rgb";
    IMModule["rgf"] = "rgf";
    IMModule["rla"] = "rla";
    IMModule["rle"] = "rle";
    IMModule["scr"] = "scr";
    IMModule["sct"] = "sct";
    IMModule["sfw"] = "sfw";
    IMModule["sgi"] = "sgi";
    IMModule["sixel"] = "sixel";
    IMModule["stegano"] = "stegano";
    IMModule["sun"] = "sun";
    IMModule["svg"] = "svg";
    IMModule["tga"] = "tga";
    IMModule["thumbnail"] = "thumbnail";
    IMModule["tiff"] = "tiff";
    IMModule["tile"] = "tile";
    IMModule["tim"] = "tim";
    IMModule["ttf"] = "ttf";
    IMModule["txt"] = "txt";
    IMModule["uil"] = "uil";
    IMModule["url"] = "url";
    IMModule["uyvy"] = "uyvy";
    IMModule["vicar"] = "vicar";
    IMModule["vid"] = "vid";
    IMModule["viff"] = "viff";
    IMModule["vips"] = "vips";
    IMModule["wbmp"] = "wbmp";
    IMModule["webp"] = "webp";
    IMModule["wmf"] = "wmf";
    IMModule["wpg"] = "wpg";
    IMModule["x"] = "x";
    IMModule["xbm"] = "xbm";
    IMModule["xc"] = "xc";
    IMModule["xcf"] = "xcf";
    IMModule["xpm"] = "xpm";
    IMModule["xps"] = "xps";
    IMModule["xtrn"] = "xtrn";
    IMModule["xwd"] = "xwd";
    IMModule["ycbcr"] = "ycbcr";
    IMModule["yuv"] = "yuv";
    IMModule["Path: /usr/lib/ImageMagick-7.0.8/modules-Q16HDRI/filters"] = "Path: /usr/lib/ImageMagick-7.0.8/modules-Q16HDRI/filters";
    IMModule["Image Filter"] = "Image Filter";
    IMModule["analyze"] = "analyze";
})(IMModule || (IMModule = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMNoise;
(function (IMNoise) {
    IMNoise["Gaussian"] = "Gaussian";
    IMNoise["Impulse"] = "Impulse";
    IMNoise["Laplacian"] = "Laplacian";
    IMNoise["Multiplicative"] = "Multiplicative";
    IMNoise["Poisson"] = "Poisson";
    IMNoise["Random"] = "Random";
    IMNoise["Uniform"] = "Uniform";
})(IMNoise || (IMNoise = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMOrientation;
(function (IMOrientation) {
    IMOrientation["TopLeft"] = "TopLeft";
    IMOrientation["TopRight"] = "TopRight";
    IMOrientation["BottomRight"] = "BottomRight";
    IMOrientation["BottomLeft"] = "BottomLeft";
    IMOrientation["LeftTop"] = "LeftTop";
    IMOrientation["RightTop"] = "RightTop";
    IMOrientation["RightBottom"] = "RightBottom";
    IMOrientation["LeftBottom"] = "LeftBottom";
})(IMOrientation || (IMOrientation = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMPixelChannel;
(function (IMPixelChannel) {
    IMPixelChannel["Undefined"] = "Undefined";
    IMPixelChannel["A"] = "A";
    IMPixelChannel["Alpha"] = "Alpha";
    IMPixelChannel["B"] = "B";
    IMPixelChannel["Bk"] = "Bk";
    IMPixelChannel["Black"] = "Black";
    IMPixelChannel["Blue"] = "Blue";
    IMPixelChannel["Cb"] = "Cb";
    IMPixelChannel["Composite"] = "Composite";
    IMPixelChannel["CompositeMask"] = "CompositeMask";
    IMPixelChannel["C"] = "C";
    IMPixelChannel["Cr"] = "Cr";
    IMPixelChannel["Cyan"] = "Cyan";
    IMPixelChannel["Gray"] = "Gray";
    IMPixelChannel["G"] = "G";
    IMPixelChannel["Green"] = "Green";
    IMPixelChannel["Index"] = "Index";
    IMPixelChannel["Intensity"] = "Intensity";
    IMPixelChannel["K"] = "K";
    IMPixelChannel["M"] = "M";
    IMPixelChannel["Magenta"] = "Magenta";
    IMPixelChannel["Meta"] = "Meta";
    IMPixelChannel["O"] = "O";
    IMPixelChannel["R"] = "R";
    IMPixelChannel["ReadMask"] = "ReadMask";
    IMPixelChannel["Red"] = "Red";
    IMPixelChannel["Sync"] = "Sync";
    IMPixelChannel["WriteMask"] = "WriteMask";
    IMPixelChannel["Y"] = "Y";
    IMPixelChannel["Yellow"] = "Yellow";
})(IMPixelChannel || (IMPixelChannel = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMPixelIntensity;
(function (IMPixelIntensity) {
    IMPixelIntensity["Average"] = "Average";
    IMPixelIntensity["Brightness"] = "Brightness";
    IMPixelIntensity["Lightness"] = "Lightness";
    IMPixelIntensity["Mean"] = "Mean";
    IMPixelIntensity["MS"] = "MS";
    IMPixelIntensity["Rec601Luma"] = "Rec601Luma";
    IMPixelIntensity["Rec601Luminance"] = "Rec601Luminance";
    IMPixelIntensity["Rec709Luma"] = "Rec709Luma";
    IMPixelIntensity["Rec709Luminance"] = "Rec709Luminance";
    IMPixelIntensity["RMS"] = "RMS";
})(IMPixelIntensity || (IMPixelIntensity = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMPixelMask;
(function (IMPixelMask) {
    IMPixelMask["R"] = "R";
    IMPixelMask["Read"] = "Read";
    IMPixelMask["W"] = "W";
    IMPixelMask["Write"] = "Write";
})(IMPixelMask || (IMPixelMask = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMPixelTrait;
(function (IMPixelTrait) {
    IMPixelTrait["Blend"] = "Blend";
    IMPixelTrait["Copy"] = "Copy";
    IMPixelTrait["Update"] = "Update";
})(IMPixelTrait || (IMPixelTrait = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMPolicyDomain;
(function (IMPolicyDomain) {
    IMPolicyDomain["Cache"] = "Cache";
    IMPolicyDomain["Coder"] = "Coder";
    IMPolicyDomain["Delegate"] = "Delegate";
    IMPolicyDomain["Filter"] = "Filter";
    IMPolicyDomain["Module"] = "Module";
    IMPolicyDomain["Path"] = "Path";
    IMPolicyDomain["Resource"] = "Resource";
    IMPolicyDomain["System"] = "System";
})(IMPolicyDomain || (IMPolicyDomain = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMPolicyRights;
(function (IMPolicyRights) {
    IMPolicyRights["All"] = "All";
    IMPolicyRights["Execute"] = "Execute";
    IMPolicyRights["None"] = "None";
    IMPolicyRights["Read"] = "Read";
    IMPolicyRights["Write"] = "Write";
})(IMPolicyRights || (IMPolicyRights = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMPreview;
(function (IMPreview) {
    IMPreview["AddNoise"] = "AddNoise";
    IMPreview["Blur"] = "Blur";
    IMPreview["Brightness"] = "Brightness";
    IMPreview["Charcoal"] = "Charcoal";
    IMPreview["Despeckle"] = "Despeckle";
    IMPreview["Dull"] = "Dull";
    IMPreview["EdgeDetect"] = "EdgeDetect";
    IMPreview["Gamma"] = "Gamma";
    IMPreview["Grayscale"] = "Grayscale";
    IMPreview["Hue"] = "Hue";
    IMPreview["Implode"] = "Implode";
    IMPreview["JPEG"] = "JPEG";
    IMPreview["OilPaint"] = "OilPaint";
    IMPreview["Quantize"] = "Quantize";
    IMPreview["Raise"] = "Raise";
    IMPreview["ReduceNoise"] = "ReduceNoise";
    IMPreview["Roll"] = "Roll";
    IMPreview["Rotate"] = "Rotate";
    IMPreview["Saturation"] = "Saturation";
    IMPreview["Segment"] = "Segment";
    IMPreview["Shade"] = "Shade";
    IMPreview["Sharpen"] = "Sharpen";
    IMPreview["Shear"] = "Shear";
    IMPreview["Solarize"] = "Solarize";
    IMPreview["Spiff"] = "Spiff";
    IMPreview["Spread"] = "Spread";
    IMPreview["Swirl"] = "Swirl";
    IMPreview["Threshold"] = "Threshold";
    IMPreview["Wave"] = "Wave";
})(IMPreview || (IMPreview = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMPrimitive;
(function (IMPrimitive) {
    IMPrimitive["Alpha"] = "Alpha";
    IMPrimitive["Arc"] = "Arc";
    IMPrimitive["Bezier"] = "Bezier";
    IMPrimitive["Circle"] = "Circle";
    IMPrimitive["Color"] = "Color";
    IMPrimitive["Ellipse"] = "Ellipse";
    IMPrimitive["Image"] = "Image";
    IMPrimitive["Line"] = "Line";
    IMPrimitive["Matte"] = "Matte";
    IMPrimitive["Path"] = "Path";
    IMPrimitive["Point"] = "Point";
    IMPrimitive["Polygon"] = "Polygon";
    IMPrimitive["Polyline"] = "Polyline";
    IMPrimitive["Rectangle"] = "Rectangle";
    IMPrimitive["RoundRectangle"] = "RoundRectangle";
    IMPrimitive["Text"] = "Text";
})(IMPrimitive || (IMPrimitive = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMQuantumFormat;
(function (IMQuantumFormat) {
    IMQuantumFormat["FloatingPoint"] = "FloatingPoint";
    IMQuantumFormat["Signed"] = "Signed";
    IMQuantumFormat["Unsigned"] = "Unsigned";
})(IMQuantumFormat || (IMQuantumFormat = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMSparseColor;
(function (IMSparseColor) {
    IMSparseColor["Barycentric"] = "Barycentric";
    IMSparseColor["Bilinear"] = "Bilinear";
    IMSparseColor["Inverse"] = "Inverse";
    IMSparseColor["Shepards"] = "Shepards";
    IMSparseColor["Voronoi"] = "Voronoi";
    IMSparseColor["Manhattan"] = "Manhattan";
})(IMSparseColor || (IMSparseColor = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMStatistic;
(function (IMStatistic) {
    IMStatistic["Gradient"] = "Gradient";
    IMStatistic["Maximum"] = "Maximum";
    IMStatistic["Mean"] = "Mean";
    IMStatistic["Median"] = "Median";
    IMStatistic["Minimum"] = "Minimum";
    IMStatistic["Mode"] = "Mode";
    IMStatistic["NonPeak"] = "NonPeak";
    IMStatistic["RootMeanSquare"] = "RootMeanSquare";
    IMStatistic["RMS"] = "RMS";
    IMStatistic["StandardDeviation"] = "StandardDeviation";
})(IMStatistic || (IMStatistic = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMStorage;
(function (IMStorage) {
    IMStorage["Char"] = "Char";
    IMStorage["Double"] = "Double";
    IMStorage["Float"] = "Float";
    IMStorage["Long"] = "Long";
    IMStorage["LongLong"] = "LongLong";
    IMStorage["Quantum"] = "Quantum";
    IMStorage["Short"] = "Short";
})(IMStorage || (IMStorage = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMStretch;
(function (IMStretch) {
    IMStretch["Any"] = "Any";
    IMStretch["Condensed"] = "Condensed";
    IMStretch["Expanded"] = "Expanded";
    IMStretch["ExtraCondensed"] = "ExtraCondensed";
    IMStretch["ExtraExpanded"] = "ExtraExpanded";
    IMStretch["Normal"] = "Normal";
    IMStretch["SemiCondensed"] = "SemiCondensed";
    IMStretch["SemiExpanded"] = "SemiExpanded";
    IMStretch["UltraCondensed"] = "UltraCondensed";
    IMStretch["UltraExpanded"] = "UltraExpanded";
})(IMStretch || (IMStretch = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMStyle;
(function (IMStyle) {
    IMStyle["Any"] = "Any";
    IMStyle["Bold"] = "Bold";
    IMStyle["Italic"] = "Italic";
    IMStyle["Normal"] = "Normal";
    IMStyle["Oblique"] = "Oblique";
})(IMStyle || (IMStyle = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMTool;
(function (IMTool) {
    IMTool["animate"] = "animate";
    IMTool["compare"] = "compare";
    IMTool["composite"] = "composite";
    IMTool["conjure"] = "conjure";
    IMTool["convert"] = "convert";
    IMTool["display"] = "display";
    IMTool["identify"] = "identify";
    IMTool["import"] = "import";
    IMTool["mogrify"] = "mogrify";
    IMTool["montage"] = "montage";
    IMTool["stream"] = "stream";
})(IMTool || (IMTool = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMType;
(function (IMType) {
    IMType["Bilevel"] = "Bilevel";
    IMType["ColorSeparation"] = "ColorSeparation";
    IMType["ColorSeparationAlpha"] = "ColorSeparationAlpha";
    IMType["ColorSeparationMatte"] = "ColorSeparationMatte";
    IMType["Grayscale"] = "Grayscale";
    IMType["GrayscaleAlpha"] = "GrayscaleAlpha";
    IMType["GrayscaleMatte"] = "GrayscaleMatte";
    IMType["Optimize"] = "Optimize";
    IMType["Palette"] = "Palette";
    IMType["PaletteBilevelAlpha"] = "PaletteBilevelAlpha";
    IMType["PaletteBilevelMatte"] = "PaletteBilevelMatte";
    IMType["PaletteAlpha"] = "PaletteAlpha";
    IMType["PaletteMatte"] = "PaletteMatte";
    IMType["TrueColorAlpha"] = "TrueColorAlpha";
    IMType["TrueColorMatte"] = "TrueColorMatte";
    IMType["TrueColor"] = "TrueColor";
})(IMType || (IMType = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMUnits;
(function (IMUnits) {
    IMUnits["PixelsPerInch"] = "PixelsPerInch";
    IMUnits["PixelsPerCentimeter"] = "PixelsPerCentimeter";
    IMUnits["1_"] = "1";
    IMUnits["2_"] = "2";
    IMUnits["3_"] = "3";
})(IMUnits || (IMUnits = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMValidate;
(function (IMValidate) {
    IMValidate["All"] = "All";
    IMValidate["Colorspace"] = "Colorspace";
    IMValidate["Compare"] = "Compare";
    IMValidate["Composite"] = "Composite";
    IMValidate["Convert"] = "Convert";
    IMValidate["FormatsDisk"] = "FormatsDisk";
    IMValidate["FormatsMap"] = "FormatsMap";
    IMValidate["FormatsMemory"] = "FormatsMemory";
    IMValidate["Identify"] = "Identify";
    IMValidate["ImportExport"] = "ImportExport";
    IMValidate["Montage"] = "Montage";
    IMValidate["Stream"] = "Stream";
    IMValidate["None"] = "None";
})(IMValidate || (IMValidate = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMVirtualPixel;
(function (IMVirtualPixel) {
    IMVirtualPixel["Background"] = "Background";
    IMVirtualPixel["Black"] = "Black";
    IMVirtualPixel["CheckerTile"] = "CheckerTile";
    IMVirtualPixel["Dither"] = "Dither";
    IMVirtualPixel["Edge"] = "Edge";
    IMVirtualPixel["Gray"] = "Gray";
    IMVirtualPixel["HorizontalTile"] = "HorizontalTile";
    IMVirtualPixel["HorizontalTileEdge"] = "HorizontalTileEdge";
    IMVirtualPixel["Mirror"] = "Mirror";
    IMVirtualPixel["None"] = "None";
    IMVirtualPixel["Random"] = "Random";
    IMVirtualPixel["Tile"] = "Tile";
    IMVirtualPixel["Transparent"] = "Transparent";
    IMVirtualPixel["VerticalTile"] = "VerticalTile";
    IMVirtualPixel["VerticalTileEdge"] = "VerticalTileEdge";
    IMVirtualPixel["White"] = "White";
})(IMVirtualPixel || (IMVirtualPixel = {}));

/* auto-generated file using command `npx ts-node scripts/generateImEnums.ts` */
var IMWeight;
(function (IMWeight) {
    IMWeight["Thin"] = "Thin";
    IMWeight["ExtraLight"] = "ExtraLight";
    IMWeight["UltraLight"] = "UltraLight";
    IMWeight["Normal"] = "Normal";
    IMWeight["Regular"] = "Regular";
    IMWeight["Medium"] = "Medium";
    IMWeight["DemiBold"] = "DemiBold";
    IMWeight["SemiBold"] = "SemiBold";
    IMWeight["Bold"] = "Bold";
    IMWeight["ExtraBold"] = "ExtraBold";
    IMWeight["UltraBold"] = "UltraBold";
    IMWeight["Heavy"] = "Heavy";
    IMWeight["Black"] = "Black";
})(IMWeight || (IMWeight = {}));

export { executeOne$$1 as executeOne, isExecuteCommand$$1 as isExecuteCommand, asExecuteConfig$$1 as asExecuteConfig, executeAndReturnOutputFile$$1 as executeAndReturnOutputFile, addExecuteListener$$1 as addExecuteListener, execute$$1 as execute, createImageHome$$1 as createImageHome, newExecutionContext$$1 as newExecutionContext, Call, call, CreatePromiseEvent, arrayToCli, cliToArray, asCommand, blobToString, isInputFile, isOutputFile, readFileAsText, isImage, buildInputFile, asInputFile, asOutputFile, getFileName, getFileNameExtension, loadImageElement$$1 as loadImageElement, buildImageSrc$$1 as buildImageSrc, getInputFilesFromHtmlInputElement$$1 as getInputFilesFromHtmlInputElement, getPixelColor$$1 as getPixelColor, builtInImageNames$$1 as builtInImageNames, getBuiltInImages$$1 as getBuiltInImages, getBuiltInImage$$1 as getBuiltInImage, compare$$1 as compare, compareNumber$$1 as compareNumber, extractInfo$$1 as extractInfo, getConfigureFolders$$1 as getConfigureFolders, knownSupportedReadWriteImageFormats$$1 as knownSupportedReadWriteImageFormats, IMAlign, IMAlpha, IMAutoThreshold, IMBoolean, IMCache, IMChannel, IMClass, IMClipPath, IMColorspace, IMCommand, IMCompliance, IMComplex, IMCompose, IMCompress, IMDataType, IMDebug, IMDecoration, IMDirection, IMDispose, IMDistort, IMDither, IMEndian, IMEvaluate, IMFillRule, IMFilter, IMFunction, IMGradient, IMGravity, IMIntensity, IMIntent, IMInterlace, IMInterpolate, IMKernel, IMLayers, IMLineCap, IMLineJoin, IMList, IMLogEvent, IMLog, IMMethod, IMMetric, IMMode, IMMorphology, IMModule, IMNoise, IMOrientation, IMPixelChannel, IMPixelIntensity, IMPixelMask, IMPixelTrait, IMPolicyDomain, IMPolicyRights, IMPreview, IMPrimitive, IMQuantumFormat, IMSparseColor, IMStatistic, IMStorage, IMStretch, IMStyle, IMTool, IMType, IMUnits, IMValidate, IMVirtualPixel, IMWeight };
//# sourceMappingURL=wasm-imagemagick.esm-es6.js.map
