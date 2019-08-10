# MongooseConnection

Quickly and easily create instance mongoose with auto-reconnect

# Method

```
async createConnection({hosts, database}, option)
```
create a single mongoose instance

```
async connectAll(Array<{uri, option}>)
```
connect to all and return connection handle
