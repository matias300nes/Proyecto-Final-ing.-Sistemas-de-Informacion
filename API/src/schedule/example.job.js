const schedule = require('node-schedule');
//Regla de recurrencia
const rule = new schedule.RecurrenceRule();
rule.second = -1;
//propiedades de regla
// rule.second (0-59)
// rule.minute (0-59)
// rule.hour (0-23)
// rule.date (1-31)
// rule.month (0-11)
// rule.year
// dayOfWeek (0-6) Empenzando en domingo

const callback = async () => {
    //codigo a ejecutar
};

module.exports = { rule, callback };