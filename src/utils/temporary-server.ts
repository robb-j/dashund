import * as express from 'express'
import * as stoppable from 'stoppable'

type StopFn = () => void
type SetupFn = (app: express.Application, stop: StopFn) => void

/**
  Create a temporary express server, set it up with endpoints
  and have control of closing it cleanly.
  Returns a promise thats resolved when you call `closeServer`
 
  ```
  let someVariable
  await runTemporaryServer(1234, (app, closeServer) => {
    app.get('/', (req, res) => {
      someVariable = req.query.data
      res.send('hey')
      closeServer()
    })
  })
  console.log(someVariable)
  ```
*/
async function runTemporaryServer(port: number, setup: SetupFn) {
  let app = express()

  // Create a promise to run the server, register endpoints
  // and exit cleanly once #closeServer is called
  return new Promise(async (resolve, reject) => {
    let server = app.listen(port, () => {
      server = stoppable(server, 500)
      const closeServer = async () => (server as any).stop(resolve)
      setup(app, closeServer)
    })
  })
}

module.exports = { runTemporaryServer }
