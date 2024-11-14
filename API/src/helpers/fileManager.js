const fileRenamer = require("./fileHelperFunc");
const path = require('path')
const fs = require('fs')
const streamToBlob = require('stream-to-blob')
const appDir = path.dirname(require.main.filename);
const FILE_SERVER = process.env.FILES_SERVER || ""

const remoteSaver = async (file, filePath) => {
    //post file to remote server
    const remote = `${FILE_SERVER}/saveFiles.php`
    const { createReadStream, filename, fieldName, mimetype, encoding } = file;
    const uniqueName =  fileRenamer(filename);
    const stream = createReadStream();
    const blob = await streamToBlob(stream)
    const formData = new FormData();
    formData.append('archivo', blob, uniqueName);
    formData.append('direccion', filePath);
    const config = {
        method: 'POST',
        body: formData,
    };
    
    let res = await fetch(remote, config)
    let data = await res.json()
    return data.path
}

const remoteDeleter = async (fileDir) => {
    //delete file from remote server
    const remote = `${FILE_SERVER}/deleteFiles.php`
    const formData = new FormData();
    formData.append('direccion', fileDir);
    const config = {
        method: 'POST',
        body: formData,
    };
    let res = await fetch(remote, config)
    let data = await res.json()
    return data.success
}

const localSaver = async (file, filePath) => {
    const { createReadStream, filename, fieldName, mimetype, encoding } = file;
    const stream = createReadStream();
    filePath = filePath.replace(".", "")
    filePath = path.join("public", filePath)
    const dir = path.join(appDir, filePath);
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    const uniqueName =  fileRenamer(filename);
    
    const pathName = path.join(dir, uniqueName);
    
    await stream.pipe(fs.createWriteStream(pathName));
    return path.join(filePath, uniqueName);
}

const localDeleter = async (fileDir) => {
    //delete file
    const pathName = path.join(appDir, fileDir);
    if (fs.existsSync(pathName)){
        fs.unlinkSync(pathName);
        return true;
    }
    return false
}


/**
 * @param {String} filePath - path without filename, default: env.PUBLIC_PATH
 * @param {File} file - the file object
 * @returns {String}  the path to the file
 */
exports.saveFile = async (filePath = "", file) => {
    if (!file) throw new Error("Invalid file");
    if(FILE_SERVER && FILE_SERVER !== ""){
        return await remoteSaver(file, filePath)
    } else {
        return await localSaver(file, filePath)
    }
};

/**
 * @param {String} fileDir - path with filename included
 * @returns {Boolean}  true if file was deleted
 * @returns {String}  error message if file was not found
 */
exports.deleteFile = async (fileDir) => {
    if (!fileDir) return false;
    if(FILE_SERVER && FILE_SERVER !== ""){
        return await remoteDeleter(fileDir)
    } else {
        return await localDeleter(fileDir)
    }
}