import fs from 'fs-extra'
import errorOverlayMiddleware from 'react-dev-utils/errorOverlayMiddleware'
import evalSourceMapMiddleware from 'react-dev-utils/evalSourceMapMiddleware'
import ignoredFiles from 'react-dev-utils/ignoredFiles'
import noopServiceWorkerMiddleware from 'react-dev-utils/noopServiceWorkerMiddleware'
import redirectServedPath from 'react-dev-utils/redirectServedPathMiddleware'
import type {
  Configuration,
  ProxyConfigArray,
  ProxyConfigMap,
} from 'webpack-dev-server'
import type { ConfigEnv } from './env'
import type { ConfigPaths } from './paths'

export default function createBaseWebpackServerConfig(
  env: ConfigEnv,
  paths: ConfigPaths,
  proxy: ProxyConfigMap | ProxyConfigArray,
  allowedHost: string | undefined,
): Configuration {
  return {
    // WebpackDevServer 2.4.3 introduced a security fix that prevents remote
    // websites from potentially accessing local content through DNS rebinding:
    // https://github.com/webpack/webpack-dev-server/issues/887
    // https://medium.com/webpack/webpack-dev-server-middleware-security-issues-1489d950874a
    // However, it made several existing use cases such as development in cloud
    // environment or subdomains in development significantly more complicated:
    // https://github.com/facebook/create-react-app/issues/2271
    // https://github.com/facebook/create-react-app/issues/2233
    // While we're investigating better solutions, for now we will take a
    // compromise. Since our WDS configuration only serves files in the `public`
    // folder we won't consider accessing them a vulnerability. However, if you
    // use the `proxy` feature, it gets more dangerous because it can expose
    // remote code execution vulnerabilities in backends like Django and Rails.
    // So we will disable the host check normally, but enable it if you have
    // specified the `proxy` setting. Finally, we let you override it if you
    // really know what you're doing with a special environment variable.
    disableHostCheck: env.development.server.shouldDisableHostCheck,

    // Whether to enable gzip compression of generated files.
    compress: env.development.server.compress,

    // Silence WebpackDevServer's own logs since they're generally not useful.
    // It will still show compile warnings and errors with this setting.
    clientLogLevel: 'none',

    // By default WebpackDevServer serves physical files from current directory
    // in addition to all the virtual build products that it serves from memory.
    // This is confusing because those files won’t automatically be available in
    // production build folder unless we copy them. However, copying the whole
    // project directory is dangerous because we may expose sensitive files.
    // Instead, we establish a convention that only files in `public` directory
    // get served. Our build script will copy `public` into the `build` folder.
    // In `index.html`, you can get URL of `public` folder with %PUBLIC_URL%:
    // <link rel="icon" href="%PUBLIC_URL%/favicon.ico">
    // In JavaScript code, you can access it with `process.env.PUBLIC_URL`.
    // Note that we only recommend to use `public` folder as an escape hatch
    // for files like `favicon.ico`, `manifest.json`, and libraries that are
    // for some reason broken when imported through webpack. If you just want to
    // use an image, put it in `src` and `import` it from JavaScript instead.
    contentBase: paths.source.public,
    contentBasePublicPath: env.publicUrlOrPath,

    // By default files from `contentBase` will not trigger a page reload.
    watchContentBase: true,

    // Enable hot reloading server. It will provide WDS_SOCKET_PATH endpoint
    // for the WebpackDevServer client so it can learn when the files were
    // updated. The WebpackDevServer client is included as an entry point
    // in the webpack development configuration. Note that only changes
    // to CSS are currently hot reloaded. JS changes will refresh the browser.
    hot: true,

    // Use 'ws' instead of 'sockjs-node' on server since we're using native
    // websockets in `webpackHotDevClient`.
    transportMode: 'ws',

    // Prevent a WS client from getting injected as we're already including
    // `webpackHotDevClient`.
    injectClient: false,

    // Enable custom sockjs pathname for websocket connection to hot reloading
    // server. Enable custom sockjs hostname, pathname and port for websocket
    // connection to hot reloading server.
    sockHost: env.development.server.sockHost,
    sockPath: env.development.server.sockPath,
    sockPort: env.development.server.sockPort,

    // It is important to tell WebpackDevServer to use the same "publicPath"
    // path as we specified in the webpack config. When homepage is '.', default
    // to serving from the root.
    // remove last slash so user can land on `/test` instead of `/test/`
    publicPath: env.publicUrlOrPath.replace(/\/$/, ''),

    // WebpackDevServer is noisy by default so we emit custom message instead by
    // listening to the compiler events with `compiler.hooks[...].tap` calls
    // above.
    quiet: true,

    // Reportedly, this avoids CPU overload on some systems.
    // https://github.com/facebook/create-react-app/issues/293
    // src/node_modules is not ignored to support absolute imports
    // https://github.com/facebook/create-react-app/issues/1065
    watchOptions: {
      ignored: paths.source.src.map(src => ignoredFiles(src)),
      // https://stackoverflow.com/questions/40573774/webpack-hot-reloading-enoent-no-such-file-or-directory
      aggregateTimeout: 300,
      poll: 1000,
    },

    https: false,
    host: env.development.server.host,
    overlay: false,

    historyApiFallback: {
      // Paths with dots should still use the history fallback.
      // See https://github.com/facebook/create-react-app/issues/387.
      disableDotRule: true,
      index: env.publicUrlOrPath,
    },

    public: allowedHost,

    // `proxy` is run between `before` and `after` `webpack-dev-server` hooks
    proxy,

    before(app, server): void {
      // Keep `evalSourceMapMiddleware` and `errorOverlayMiddleware` middlewares
      // before `redirectServedPath` otherwise will not have any effect.
      // This lets us fetch source contents from webpack for the error overlay
      app.use(evalSourceMapMiddleware(server))

      // This lets us open files from the runtime error overlay.
      app.use(errorOverlayMiddleware())

      if (fs.existsSync(paths.source.proxySetup)) {
        // This registers user provided middleware for proxy reasons
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require(paths.source.proxySetup)(app)
      }
    },
    after(app) {
      // Redirect to `PUBLIC_URL` or `homepage` from `package.json`
      // if url not match
      app.use(redirectServedPath(paths.target.mainPage))

      // This service worker file is effectively a 'no-op' that will reset any
      // previous service worker registered for the same host:port combination.
      // We do this in development to avoid hitting the production cache if
      // it used the same host and port.
      // https://github.com/facebook/create-react-app/issues/2272#issuecomment-302832432
      app.use(noopServiceWorkerMiddleware(env.publicUrlOrPath))
    },
  }
}
