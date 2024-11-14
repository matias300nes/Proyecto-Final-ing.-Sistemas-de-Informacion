const schedule = require('node-schedule')
const fs = require('fs')
const path = require('path')

module.exports = {
  start: function () {
    fs
      .readdirSync(__dirname)
      .filter(function (file) {
        return (file.indexOf('.') !== 0) && (file.slice(-7) === '.job.js');
      })
      .forEach(function (file) {
        var job = require(path.join(__dirname, file));
        schedule.scheduleJob(job.rule, job.callback)
      });
  },
}