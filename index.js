const {Mongoose} = require('mongoose');
const MongoDbUri = require('mongodb-uri');
const debug = require('debug')('MongooseConnection');

class MongooseConnection {
    /**
     * @private
     * @param uri
     * @param option
     * @returns {Promise<Mongoose.Mongoose>}
     */
    static async createInstance({uri, option = {}}) {
        const conn = new Mongoose();
        async function connect() {
            try {
                await conn.connect(uri, option);
            } catch (e) {
                console.error(e.message);
            }
        }
        const disconnect = conn.disconnect;
        conn.disconnect = async function() {
            this.nowOnExit = true;
            return disconnect.bind(conn)();
        };
        conn.connection
            .on('connected', function () {
                debug(`connected, ${uri}`);
            })
            .on('disconnected', function() {
                debug(`disconnected, ${uri}`);
                if (conn.nowOnExit) return;
                setTimeout(async () => {
                    await connect();
                }, 500);
            })
            .on('reconnected', function() {
                debug(`reconnected, ${uri}`);
            });
        await connect();
        process.on('exit', function () {
            conn.nowOnExit = true;
            conn.disconnect().then();
        });
        return conn;
    }

    /**
     * @typedef ConnectionType
     * @property {string} uri
     * @property {Mongoose.options} option
     */
    /**
     * Connect all MongoDB, return Array of each handler's connection (Mongoose instance)
     * @param {ConnectionType[]} connections
     * @returns {Promise<Mongoose.Mongoose[]>}
     */
    static async connectAll(connections) {
        debug(JSON.stringify(connections));
        return Promise.all(connections.map(this.createInstance));
    }

    /**
     * create single mongoose connection
     * @param {{host: string, port: (string|number)}[]} hosts
     * @param {string} database
     * @param {object} option
     * @returns {Promise<Mongoose.Mongoose>}
     */
    static async createConnection({hosts, database}, option) {
        const uri = MongoDbUri.formatMongoose({
            hosts, database
        });
        return this.createInstance({uri, option});
    }
}

module.exports = MongooseConnection;
