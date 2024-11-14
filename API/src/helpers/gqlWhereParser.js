const { Op } = require("sequelize")

function isObject(obj){
    return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
}

exports.gqlWhereParser = (where) => {
    let include = []
    let resultWhere = {}

    Object.keys(where).forEach(keyName => {
        let value = where[keyName]
        let key = keyName
        let addToResult = true
        
        if(keyName.startsWith('_')){
            let operator = Op[keyName.split('_')[1]]
            if(operator){
                key = operator
            }else{
                let required = true
                let {_required, ...rest} = value
                if(_required !== undefined) required = _required
                value = rest

                let subFilter = this.gqlWhereParser(value)
                let newInclude = {
                    required: required,
                    association: keyName.split('_')[1],
                    attributes: [],
                    where: subFilter.where,
                }
                if(subFilter.include.length) newInclude.include = subFilter.include
                include.push(newInclude)
                addToResult = false
            }
        }

        if(addToResult){
            if(isObject(value)){
                let subFilter = this.gqlWhereParser(value)
                resultWhere[key] = subFilter.where
                include = include.concat(subFilter.include)
            }else if(Array.isArray(value)){
                resultWhere[key] = new Array(value.length).fill(null)
                value.forEach((item, index) => {
                    if(isObject(item)){
                        let subFilter = this.gqlWhereParser(item)
                        resultWhere[key][index] = subFilter.where
                        include = include.concat(subFilter.include)
                    }else{
                        resultWhere[key] = value
                    }
                })
            }else{
                resultWhere[key] = value
            }
        }
    })

    return {where: resultWhere, include}
}