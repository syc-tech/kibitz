"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readJsonFile = readJsonFile;
exports.writeJsonFile = writeJsonFile;
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const DATA_DIR = process.env.DATA_DIR ?? node_path_1.default.resolve(__dirname, '../../data');
async function readJsonFile(fileName, fallback) {
    const filePath = getFilePath(fileName);
    try {
        const raw = await node_fs_1.promises.readFile(filePath, 'utf8');
        return JSON.parse(raw);
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            return fallback;
        }
        throw error;
    }
}
async function writeJsonFile(fileName, data) {
    const filePath = getFilePath(fileName);
    await node_fs_1.promises.mkdir(node_path_1.default.dirname(filePath), { recursive: true });
    await node_fs_1.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}
function getFilePath(fileName) {
    return node_path_1.default.isAbsolute(fileName) ? fileName : node_path_1.default.join(DATA_DIR, fileName);
}
//# sourceMappingURL=fileStore.js.map