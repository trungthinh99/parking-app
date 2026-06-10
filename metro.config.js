const { getDefaultConfig } = require('expo/metro-config')
const { withRozenite } = require('@rozenite/metro')

const config = getDefaultConfig(__dirname)

config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer')

config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg')
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg']

module.exports = withRozenite(config, {
  enabled: process.env.WITH_ROZENITE === 'true',
})

