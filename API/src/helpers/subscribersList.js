const pubsub = require("./pubsub")

class SubscribersList {
    constructor() {
        this.users = []
    }

    add(user) {
        //add if not exists
        if (!this.users.includes(user)) {
            let connections = {
                idUser: user,
                status: "connected",
            }
            pubsub.publish("CONNECTION_EVENT", {connections})
            this.users.push(user)
        }
    }

    delete(user) {
        let connections = {
            idUser: user,
            status: "disconnected",
        }
        pubsub.publish("CONNECTION_EVENT", {connections})
        this.users = this.users.filter(u => u !== user)
    }

    get() {
        return this.users
    }
}

module.exports = new SubscribersList()