import path from 'path'
import * as react from 'react'
import * as reactRouterDom from 'react-router-dom'
import { createRollupConfig } from '@barusu-react/rollup-config'
import manifest from './package.json'


const resolvePath = p => path.resolve(__dirname, p)
const paths = {
  source: {
    stylesheetInput: [
      resolvePath('src/style/index.styl'),
    ],
  },
  eslintrc: resolvePath('.eslintrc.js'),
  tsconfig: resolvePath('tsconfig.json'),
}


const config = createRollupConfig({
  manifest,
  preprocessOptions: {
    stylesheets: {
      input: paths.source.stylesheetInput,
      pluginOptions: {
        multiEntryOptions: {
          exports: false,
        },
        postcssOptions: {
          modules: {
            camelCase: true,
          },
        }
      },
    }
  },
  pluginOptions: {
    eslintOptions: {
      configFile: paths.eslintrc,
    },
    typescriptOptions: {
      tsconfig: paths.tsconfig,
      useTsconfigDeclarationDir: true,
    },
    commonjsOptions: {
      include: ['../../node_modules/**'],
      namedExports: {
        'react': Object.keys(react),
        'react-router-dom': Object.keys(reactRouterDom)
      },
    },
    postcssOptions: {
      extract: false,
      minimize: true,
      modules: {
        camelCase: true,
        generateScopedName: 'barusu-[local]',
      },
      pluginOptions: {
        postcssUrlOptions: {
          url: 'inline',
        }
      },
    }
  }
})


export default config