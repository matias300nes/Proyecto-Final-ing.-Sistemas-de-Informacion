const { Op } = require("sequelize")

const operators = [
    { gql : '{LIKE}', sql : Op.like },
    { gql : '{GT}', sql : Op.gt }, //mayor
    { gql : '{GTE}', sql : Op.gte }, //mayor o igual
    { gql : '{LT}', sql : Op.lt },  //menor
    { gql : '{LTE}', sql : Op.lte }, //menor o igual
    { gql : '{NE}', sql : Op.ne }, //diferente
    { gql : '{NOT}', sql : Op.not }, 
]

exports.gqlFilterParser = (filter) => {
    //check if filter is an array
    if(!Array.isArray(filter)){
        throw Error('Filter must be an array')
    }
    filter = filter.map(item => {
        Object.keys(item).forEach(key => {
            let value = item[key]
            if(typeof value === 'string'){
                let op = operators.find(op => value.includes(op.gql))
                if(op){
                    let valueArray = value.split(op.gql).join('')
                    item[key] = {[op.sql]: valueArray}
                }
            }
        })
        return item
    })
    
    filter = filter.filter(item => JSON.stringify(item) !== '{}')
    
    let where = filter.length ? {[Op.or]: filter} : {}
    return where
}