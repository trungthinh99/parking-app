/**
 * Patches CMakeLists.txt files in native modules to add c++_shared linking.
 * This is needed because NDK 27 + CMake 3.22.1 on Windows doesn't auto-link
 * the C++ standard library for shared native libraries.
 *
 * Run after `npm install` via postinstall script.
 */

const fs = require('fs');
const path = require('path');

const patches = [
  {
    file: 'node_modules/expo-modules-core/android/CMakeLists.txt',
    search: '  ReactAndroid::jsi\n  android\n  ${JSEXECUTOR_LIB}',
    replace: '  ReactAndroid::jsi\n  android\n  c++_shared\n  ${JSEXECUTOR_LIB}',
  },
  {
    file: 'node_modules/@shopify/react-native-skia/android/CMakeLists.txt',
    search: '        ${COMMON_LIBS}\n    )\nelse()\n    target_link_libraries(${PACKAGE_NAME}\n        ${COMMON_LIBS}\n        -lGLESv2\n        -lEGL\n    )',
    replace: '        ${COMMON_LIBS}\n        c++_shared\n    )\nelse()\n    target_link_libraries(${PACKAGE_NAME}\n        ${COMMON_LIBS}\n        c++_shared\n        -lGLESv2\n        -lEGL\n    )',
  },
  {
    file: 'node_modules/react-native-reanimated/android/CMakeLists.txt',
    search: 'target_link_libraries(reanimated log ReactAndroid::jsi fbjni::fbjni android\n                      worklets)',
    replace: 'target_link_libraries(reanimated log ReactAndroid::jsi fbjni::fbjni android\n                      c++_shared worklets)',
  },
  {
    file: 'node_modules/react-native-worklets/android/CMakeLists.txt',
    search: 'target_link_libraries(worklets log ReactAndroid::jsi fbjni::fbjni)',
    replace: 'target_link_libraries(worklets log ReactAndroid::jsi fbjni::fbjni c++_shared)',
  },
  {
    file: 'node_modules/react-native-screens/android/CMakeLists.txt',
    search: '        target_link_libraries(rnscreens\n            ReactAndroid::reactnative\n            ReactAndroid::jsi\n            fbjni::fbjni\n            android\n        )',
    replace: '        target_link_libraries(rnscreens\n            ReactAndroid::reactnative\n            ReactAndroid::jsi\n            fbjni::fbjni\n            android\n            c++_shared\n        )',
  },
  {
    file: 'node_modules/react-native-gesture-handler/android/src/main/jni/CMakeLists.txt',
    search: 'target_link_libraries(\n  ${PACKAGE_NAME}\n  ReactAndroid::reactnative\n  ReactAndroid::jsi\n  fbjni::fbjni\n)',
    replace: 'target_link_libraries(\n  ${PACKAGE_NAME}\n  ReactAndroid::reactnative\n  ReactAndroid::jsi\n  fbjni::fbjni\n  c++_shared\n)',
  },
  {
    file: 'node_modules/react-native-keyboard-controller/android/src/main/jni/CMakeLists.txt',
    search: '    ReactAndroid::reactnative\n    ReactAndroid::jsi\n    fbjni::fbjni\n  )\nelse()',
    replace: '    ReactAndroid::reactnative\n    ReactAndroid::jsi\n    fbjni::fbjni\n    c++_shared\n  )\nelse()',
  },
  {
    file: 'node_modules/react-native-safe-area-context/android/src/main/jni/CMakeLists.txt',
    search: '          fbjni\n          jsi\n          reactnative\n  )\nelse()',
    replace: '          fbjni\n          jsi\n          reactnative\n          c++_shared\n  )\nelse()',
  },
  {
    file: 'node_modules/react-native-svg/android/src/main/jni/CMakeLists.txt',
    search: '    ReactAndroid::reactnative\n    ReactAndroid::jsi\n  )\nelse()',
    replace: '    ReactAndroid::reactnative\n    ReactAndroid::jsi\n    c++_shared\n  )\nelse()',
  },
  {
    file: 'node_modules/react-native-screens/android/src/main/jni/CMakeLists.txt',
    search: '    ReactAndroid::reactnative\n    ReactAndroid::jsi\n    fbjni::fbjni\n  )\nelse()',
    replace: '    ReactAndroid::reactnative\n    ReactAndroid::jsi\n    fbjni::fbjni\n    c++_shared\n  )\nelse()',
  },
  {
    file: 'node_modules/react-native/ReactAndroid/cmake-utils/ReactNative-application.cmake',
    search: 'add_library(common_flags INTERFACE)\ntarget_compile_options(common_flags INTERFACE ${folly_FLAGS})',
    replace: 'add_library(common_flags INTERFACE)\ntarget_compile_options(common_flags INTERFACE ${folly_FLAGS})\ntarget_link_libraries(common_flags INTERFACE c++_shared)',
  },
  {
    file: 'node_modules/react-native/ReactAndroid/cmake-utils/ReactNative-application.cmake',
    search: 'target_link_libraries(${CMAKE_PROJECT_NAME}\n        fbjni                               # via 3rd party prefab\n        jsi                                 # prefab ready\n        reactnative                         # prefab ready\n)',
    replace: 'target_link_libraries(${CMAKE_PROJECT_NAME}\n        fbjni                               # via 3rd party prefab\n        jsi                                 # prefab ready\n        reactnative                         # prefab ready\n        c++_shared\n)',
  },
];

const root = path.resolve(__dirname, '..');
let patched = 0;
let skipped = 0;

for (const patch of patches) {
  const filePath = path.join(root, patch.file);
  if (!fs.existsSync(filePath)) {
    console.log(`  SKIP (not found): ${patch.file}`);
    skipped++;
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes('c++_shared')) {
    console.log(`  SKIP (already patched): ${patch.file}`);
    skipped++;
    continue;
  }

  if (!content.includes(patch.search)) {
    console.log(`  WARN (search string not found): ${patch.file}`);
    skipped++;
    continue;
  }

  content = content.replace(patch.search, patch.replace);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  PATCHED: ${patch.file}`);
  patched++;
}

console.log(`\nDone: ${patched} patched, ${skipped} skipped.`);
