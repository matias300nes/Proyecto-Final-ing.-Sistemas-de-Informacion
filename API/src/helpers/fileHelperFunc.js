const fileRenamer = (filename) =>
{
    const timestamp = Date.now();
    let arrTemp = filename.split(".");
    let ext = arrTemp.pop()
    let name = `${arrTemp}`.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    name = name.substring(0, 64)
    return `${name}${timestamp}.${ext}`;
};

module.exports = fileRenamer;